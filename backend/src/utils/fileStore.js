import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../..');
const UPLOADS_MODULES_DIR = path.join(BACKEND_ROOT, 'uploads', 'modules');
const BUNDLED_MODULES_DIR = path.join(BACKEND_ROOT, 'bundled-modules');
const PUBLIC_MODULES_DIR = path.resolve(BACKEND_ROOT, '..', 'learner-portal', 'public', 'modules');

let tableInitialized = false;
let initPromise = null;

/**
 * Ensures the `uploaded_files` table exists in MySQL so uploaded PDFs and
 * module materials survive Railway container restarts and redeployments.
 */
export async function ensureUploadedFilesTable() {
  if (tableInitialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS uploaded_files (
          filename VARCHAR(255) NOT NULL PRIMARY KEY,
          original_name VARCHAR(255) NULL,
          mime_type VARCHAR(120) NOT NULL DEFAULT 'application/pdf',
          file_size INT NOT NULL DEFAULT 0,
          file_data LONGBLOB NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      tableInitialized = true;
      return true;
    } catch (err) {
      console.warn('[FileStore] Could not initialize uploaded_files table:', err.message);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Persists an uploaded file buffer into MySQL `uploaded_files` table.
 */
export async function persistUploadedFileToDb({ filename, originalName, mimeType, filePath }) {
  try {
    if (!filename || !filePath || !fs.existsSync(filePath)) return false;
    const ready = await ensureUploadedFilesTable();
    if (!ready) return false;

    const buffer = fs.readFileSync(filePath);
    const size = buffer.length;
    const safeMime = mimeType || 'application/octet-stream';
    const safeOrig = originalName || filename;

    await prisma.$executeRawUnsafe(
      `INSERT INTO uploaded_files (filename, original_name, mime_type, file_size, file_data)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         original_name = VALUES(original_name),
         mime_type = VALUES(mime_type),
         file_size = VALUES(file_size),
         file_data = VALUES(file_data)`,
      filename,
      safeOrig,
      safeMime,
      size,
      buffer
    );
    return true;
  } catch (err) {
    console.warn(`[FileStore] Could not persist "${filename}" to DB:`, err.message);
    return false;
  }
}

/**
 * Canonicalizes a filename by stripping the Multer `-<timestamp>-<random>` suffix
 * and lowercasing alphanumeric tokens so e.g. `Keep_Those_Germs_Away-1794317990701-1392577.pdf`
 * matches `Keep_Those_Germs_Away-*.pdf` in `bundled-modules/` or `uploads/modules/`.
 */
function extractBaseTitlePrefix(filename) {
  const ext = path.extname(filename).toLowerCase();
  const stem = path.basename(filename, path.extname(filename));
  // Strip trailing -<10+ digit timestamp>-<random digits>
  const stripped = stem.replace(/-\d{10,}-\d+$/, '');
  const normalized = stripped.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return { normalized, ext };
}

function findMatchingFileInDir(dirPath, requestedFilename) {
  if (!fs.existsSync(dirPath)) return null;

  // 1. Exact filename match
  const exactPath = path.resolve(dirPath, requestedFilename);
  if (
    exactPath.startsWith(path.resolve(dirPath) + path.sep) &&
    fs.existsSync(exactPath) &&
    fs.statSync(exactPath).isFile()
  ) {
    return exactPath;
  }

  // 2. Prefix/title match (e.g., same PDF uploaded at a different timestamp)
  const target = extractBaseTitlePrefix(requestedFilename);
  if (!target.normalized) return null;

  try {
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const candidate = extractBaseTitlePrefix(entry);
      if (candidate.ext === target.ext && candidate.normalized === target.normalized) {
        const candidatePath = path.resolve(dirPath, entry);
        if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
          return candidatePath;
        }
      }
    }
  } catch {
    // ignore read errors
  }

  return null;
}

/**
 * Resolves a module/upload file on disk, or restores it from `bundled-modules` or MySQL `uploaded_files`
 * if the Railway ephemeral container disk was reset.
 */
export async function resolveOrRestoreModuleFile(rawFileUrl, moduleTitle = '') {
  const cleanUrlPath = String(rawFileUrl || '').trim().split('?')[0].split('#')[0];
  let safeBasename = cleanUrlPath ? path.basename(cleanUrlPath) : '';

  if (!fs.existsSync(UPLOADS_MODULES_DIR)) {
    fs.mkdirSync(UPLOADS_MODULES_DIR, { recursive: true });
  }

  // 1. Check exact or title-prefix match in uploads/modules
  if (safeBasename) {
    const inUploads = findMatchingFileInDir(UPLOADS_MODULES_DIR, safeBasename);
    if (inUploads) return inUploads;

    // 2. Check exact or title-prefix match in tracked backend/bundled-modules
    const inBundled = findMatchingFileInDir(BUNDLED_MODULES_DIR, safeBasename);
    if (inBundled) {
      // Cache a copy in uploads/modules under the requested filename so express.static serves it directly next time
      try {
        const dest = path.resolve(UPLOADS_MODULES_DIR, safeBasename);
        if (dest.startsWith(path.resolve(UPLOADS_MODULES_DIR) + path.sep) && !fs.existsSync(dest)) {
          fs.copyFileSync(inBundled, dest);
          return dest;
        }
      } catch {}
      return inBundled;
    }

    // 3. Check learner-portal/public/modules
    const inPublic = findMatchingFileInDir(PUBLIC_MODULES_DIR, safeBasename);
    if (inPublic) return inPublic;

    // 4. Check MySQL `uploaded_files` table (exact filename or prefix match)
    try {
      const ready = await ensureUploadedFilesTable();
      if (ready) {
        let rows = await prisma.$queryRawUnsafe(
          `SELECT filename, file_data FROM uploaded_files WHERE filename = ? LIMIT 1`,
          safeBasename
        );
        if (!Array.isArray(rows) || rows.length === 0) {
          const prefix = extractBaseTitlePrefix(safeBasename);
          if (prefix.normalized) {
            rows = await prisma.$queryRawUnsafe(
              `SELECT filename, file_data FROM uploaded_files WHERE LOWER(filename) LIKE ? ORDER BY created_at DESC LIMIT 1`,
              `${prefix.normalized.replace(/_/g, '%')}%${prefix.ext}`
            );
          }
        }
        if (Array.isArray(rows) && rows.length > 0 && rows[0].file_data) {
          const buf = Buffer.isBuffer(rows[0].file_data)
            ? rows[0].file_data
            : Buffer.from(rows[0].file_data);
          if (buf.length > 0) {
            const restoredPath = path.resolve(UPLOADS_MODULES_DIR, safeBasename);
            if (restoredPath.startsWith(path.resolve(UPLOADS_MODULES_DIR) + path.sep)) {
              fs.writeFileSync(restoredPath, buf);
              return restoredPath;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[FileStore] Error querying uploaded_files from DB:', err.message);
    }
  }

  // 5. Fallback by moduleTitle if provided (e.g. "Keep Those Germs Away" -> Keep_Those_Germs_Away*.pdf)
  if (moduleTitle) {
    const syntheticName = `${String(moduleTitle).trim().replace(/[^a-zA-Z0-9]+/g, '_')}.pdf`;
    const byTitleUploads = findMatchingFileInDir(UPLOADS_MODULES_DIR, syntheticName);
    if (byTitleUploads) return byTitleUploads;
    const byTitleBundled = findMatchingFileInDir(BUNDLED_MODULES_DIR, syntheticName);
    if (byTitleBundled) return byTitleBundled;
  }

  return null;
}
