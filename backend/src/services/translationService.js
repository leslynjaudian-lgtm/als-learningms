import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const TRANSLATION_SERVICE_DIR = path.join(REPO_ROOT, 'translation-service');
const SERVICE_LOG_PATH = path.join(TRANSLATION_SERVICE_DIR, 'service.log');

const DEFAULT_TRANSLATION_SERVICE_URL = 'http://127.0.0.1:8001';
const TRANSLATION_TIMEOUT_MS = Number(process.env.TRANSLATION_TIMEOUT_MS) || 60000;
const MAX_CACHE_ENTRIES = 2000;
const MAX_TEXTS_PER_REQUEST = 25;
const MAX_CHARS_PER_TEXT = 5000;
const MAX_TOTAL_CHARS = 15000;

// In-memory LRU-like cache: key -> { translatedText, detectedSourceLanguage, alreadyTargetLanguage }
const translationCache = new Map();

// Singleton child process state (prevents duplicate processes and avoids detached console windows)
let pythonProcess = null;
let startupPromise = null;
let lastStartupError = null;

function getServiceUrl() {
  return String(
    process.env.TRANSLATION_SERVICE_URL || DEFAULT_TRANSLATION_SERVICE_URL
  )
    .trim()
    .replace(/\/+$/, '');
}

function getLocalPythonExecutable() {
  const winBin = path.join(TRANSLATION_SERVICE_DIR, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(winBin)) return winBin;
  const posixBin = path.join(TRANSLATION_SERVICE_DIR, '.venv', 'bin', 'python');
  if (fs.existsSync(posixBin)) return posixBin;
  return null;
}

function appendServiceLog(prefix, chunk) {
  const text = String(chunk || '').trim();
  if (!text) return;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim()) {
      console.log(`[NLLB Python ${prefix}] ${line}`);
    }
  }
  try {
    fs.appendFileSync(
      SERVICE_LOG_PATH,
      `[${new Date().toISOString()}] [${prefix}] ${text}\n`,
      'utf8'
    );
  } catch {
    // ignore file logging errors
  }
}

export async function isTranslationServiceAlive(serviceUrl = getServiceUrl()) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(`${serviceUrl}/health`, { signal: controller.signal });
    if (!res.ok) return { alive: false, ready: false };
    const data = await res.json();
    return { alive: true, ready: Boolean(data?.ready) };
  } catch {
    return { alive: false, ready: false };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Starts the local Python FastAPI + Meta NLLB-200 service as a hidden background
 * child process (detached: false, windowsHide: true so Windows uses CREATE_NO_WINDOW
 * and never opens a black console window).
 */
export async function ensureLocalTranslationServiceStarted() {
  const serviceUrl = getServiceUrl();
  const status = await isTranslationServiceAlive(serviceUrl);
  if (status.alive) {
    return status;
  }

  if (pythonProcess && pythonProcess.exitCode === null && !pythonProcess.killed) {
    return { alive: false, ready: false };
  }

  if (startupPromise) {
    return startupPromise;
  }

  startupPromise = (async () => {
    try {
      const recheck = await isTranslationServiceAlive(serviceUrl);
      if (recheck.alive) return recheck;

      const pythonBin = getLocalPythonExecutable();
      const appPy = path.join(TRANSLATION_SERVICE_DIR, 'app.py');
      if (!pythonBin || !fs.existsSync(appPy)) {
        lastStartupError = 'Local Python virtual environment or translation-service/app.py not found.';
        console.error(`[TranslationService] ${lastStartupError}`);
        return { alive: false, ready: false };
      }

      lastStartupError = null;
      console.log('[TranslationService] Starting hidden background NLLB-200 service on 127.0.0.1:8001...');

      const child = spawn(
        pythonBin,
        [
          '-u',
          '-m',
          'uvicorn',
          'app:app',
          '--app-dir',
          TRANSLATION_SERVICE_DIR,
          '--host',
          '127.0.0.1',
          '--port',
          '8001',
        ],
        {
          cwd: REPO_ROOT,
          detached: false,
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            PYTHONUNBUFFERED: '1',
            HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
          },
        }
      );

      pythonProcess = child;

      if (child.stdout) {
        child.stdout.on('data', (chunk) => appendServiceLog('OUT', chunk));
      }
      if (child.stderr) {
        child.stderr.on('data', (chunk) => appendServiceLog('ERR', chunk));
      }

      child.on('error', (err) => {
        lastStartupError = err.message;
        console.error('[TranslationService] Python process error:', err.message);
        if (pythonProcess === child) {
          pythonProcess = null;
        }
      });

      child.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
          lastStartupError = `Python service exited with code ${code}`;
          console.error(`[TranslationService] Python service exited (code=${code}, signal=${signal})`);
        }
        if (pythonProcess === child) {
          pythonProcess = null;
        }
      });

      return { alive: true, ready: false };
    } finally {
      startupPromise = null;
    }
  })();

  return startupPromise;
}

export function stopLocalTranslationService() {
  if (pythonProcess && pythonProcess.exitCode === null && !pythonProcess.killed) {
    try {
      pythonProcess.kill();
    } catch {
      // ignore kill error on shutdown
    }
    pythonProcess = null;
  }
}

process.on('exit', () => {
  stopLocalTranslationService();
});

async function waitForTranslationServiceReady(serviceUrl, maxWaitMs = 90000) {
  let status = await isTranslationServiceAlive(serviceUrl);
  if (status.ready) return true;

  // If serviceUrl points to a non-default URL (or no local Python venv exists on Railway),
  // do not attempt to spawn local Python on port 8001 or wait 90s; immediately return false
  // so the cloud fallback handles the request without delay.
  const isDefaultLocalUrl = /^https?:\/\/(127\.0\.0\.1|localhost):8001(\/|$)/i.test(serviceUrl);
  if (!isDefaultLocalUrl || (!status.alive && !getLocalPythonExecutable())) {
    return false;
  }

  // Only start if not alive and no process is currently running
  if (!status.alive && (!pythonProcess || pythonProcess.exitCode !== null)) {
    await ensureLocalTranslationServiceStarted();
  }

  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    if (lastStartupError && (!pythonProcess || pythonProcess.exitCode !== null)) {
      const checkAfterExit = await isTranslationServiceAlive(serviceUrl);
      if (!checkAfterExit.alive) {
        return false;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
    status = await isTranslationServiceAlive(serviceUrl);
    if (status.ready) return true;
  }
  return false;
}

const TAGALOG_MARKERS = new Set([
  'ang', 'ng', 'mga', 'sa', 'na', 'ay', 'at', 'o', 'kung', 'para',
  'ito', 'iyan', 'iyon', 'bawat', 'tanong', 'sagot', 'piliin', 'basahin',
  'basahing', 'mabuti', 'tamang', 'mali', 'tama', 'hindi', 'oo', 'wala',
  'may', 'mayroon', 'dahil', 'upang', 'nang', 'paano', 'bakit', 'ano',
  'sino', 'saan', 'kailan', 'alin', 'ilan', 'isulat', 'ibigay', 'tukuyin',
  'sumusunod', 'alinman', 'gawin', 'aralin', 'modyul', 'pagsusulit',
  'pagkatapos', 'bago', 'iyong', 'inyong', 'natin', 'nila', 'niya', 'siya',
  'ako', 'ikaw', 'kayo', 'tayo', 'sila', 'dapat', 'huwag', 'gamitin',
]);

const ENGLISH_MARKERS = new Set([
  'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can',
  'could', 'may', 'might', 'must', 'and', 'or', 'but', 'if', 'then',
  'which', 'what', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'this', 'that', 'these', 'those', 'each', 'every', 'choose', 'select',
  'read', 'question', 'answer', 'correct', 'incorrect', 'following',
  'carefully', 'true', 'false', 'write', 'your', 'you', 'with', 'from',
  'for', 'about', 'into', 'after', 'before', 'between', 'under', 'above',
]);

function detectSourceLangIso(text, requestedSource = 'auto') {
  const req = String(requestedSource || 'auto').trim().toLowerCase();
  if (req === 'tl' || req === 'fil' || req === 'tgl' || req === 'tgl_latn') {
    return { iso: 'tl', nllb: 'tgl_Latn' };
  }
  if (req === 'en' || req === 'eng' || req === 'eng_latn') {
    return { iso: 'en', nllb: 'eng_Latn' };
  }

  const tokens = String(text || '').toLowerCase().match(/[a-z]+/g) || [];
  let tlScore = 0;
  let enScore = 0;
  for (const tok of tokens) {
    if (TAGALOG_MARKERS.has(tok)) tlScore++;
    if (ENGLISH_MARKERS.has(tok)) enScore++;
  }
  if (tlScore > enScore) {
    return { iso: 'tl', nllb: 'tgl_Latn' };
  }
  return { iso: 'en', nllb: 'eng_Latn' };
}

/**
 * Free, keyless cloud translation fallback for deployed environments (Railway)
 * where the local Python NLLB-200 virtual environment is not present.
 * Primary: Google Translate public GTX endpoint (supports Cebuano `ceb` natively).
 * Secondary backup: MyMemory free translation endpoint.
 */
async function translateSingleViaFreeCloud(text, sourceLanguage = 'auto') {
  const { iso, nllb } = detectSourceLangIso(text, sourceLanguage);

  // Provider 1: Google Translate free GTX endpoint
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const slParam = sourceLanguage && sourceLanguage !== 'auto' ? iso : 'auto';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(slParam)}&tl=ceb&dt=t&q=${encodeURIComponent(text)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ALS-LMS/1.0)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const joined = data[0]
            .map((segment) => (Array.isArray(segment) && segment[0] ? String(segment[0]) : ''))
            .join('')
            .trim();
          if (joined) {
            const detectedIso = typeof data[2] === 'string' ? data[2].toLowerCase() : iso;
            const detectedNllb =
              detectedIso === 'tl' || detectedIso === 'fil'
                ? 'tgl_Latn'
                : detectedIso === 'ceb'
                ? 'ceb_Latn'
                : nllb;
            return {
              originalText: text,
              translatedText: joined,
              detectedSourceLanguage: detectedNllb,
              alreadyTargetLanguage: detectedIso === 'ceb',
            };
          }
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.warn('[TranslationService] Primary cloud fallback warning:', err.message);
  }

  // Provider 2: MyMemory free keyless API backup
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const langPair = `${iso}|ceb`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langPair)}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        const translated = String(data?.responseData?.translatedText || '').trim();
        if (translated && Number(data?.responseStatus || 200) === 200) {
          return {
            originalText: text,
            translatedText: translated,
            detectedSourceLanguage: nllb,
            alreadyTargetLanguage: false,
          };
        }
      }
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    console.warn('[TranslationService] Secondary cloud fallback warning:', err.message);
  }

  return null;
}

async function translateBatchViaFreeCloud(texts, sourceLanguage = 'auto') {
  const translatedItems = await Promise.all(
    texts.map((t) => translateSingleViaFreeCloud(t, sourceLanguage))
  );
  if (translatedItems.some((item) => !item || !item.translatedText)) {
    return null;
  }
  return translatedItems;
}

function stripHtmlForModel(html) {
  return String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function getCacheKey(text, sourceLanguage) {
  return crypto
    .createHash('sha256')
    .update(`${sourceLanguage || 'auto'}::ceb_Latn::${text}`)
    .digest('hex');
}

function setCacheEntry(key, value) {
  if (translationCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey !== undefined) {
      translationCache.delete(oldestKey);
    }
  }
  translationCache.set(key, value);
}

/**
 * Translates an array of texts into Cebuano/Bisaya (ceb_Latn) using the private
 * local Python FastAPI + Meta NLLB-200 service.
 */
export async function translateToBisaya(texts, options = {}) {
  if (!Array.isArray(texts) || texts.length === 0) {
    const err = new Error('At least one text string is required.');
    err.statusCode = 400;
    throw err;
  }

  if (texts.length > MAX_TEXTS_PER_REQUEST) {
    const err = new Error(`Too many text items (max ${MAX_TEXTS_PER_REQUEST}).`);
    err.statusCode = 400;
    throw err;
  }

  const format = options.format === 'html' ? 'html' : 'text';
  const sourceLanguage = options.sourceLanguage ? String(options.sourceLanguage).trim() : 'auto';
  const normalized = texts.map((t) =>
    format === 'html' ? stripHtmlForModel(t) : String(t ?? '').trim()
  );

  let totalChars = 0;
  for (const t of normalized) {
    if (t.length > MAX_CHARS_PER_TEXT) {
      const err = new Error(`Text exceeds maximum length of ${MAX_CHARS_PER_TEXT} characters.`);
      err.statusCode = 400;
      throw err;
    }
    totalChars += t.length;
  }
  if (totalChars > MAX_TOTAL_CHARS) {
    const err = new Error(`Total payload exceeds maximum of ${MAX_TOTAL_CHARS} characters.`);
    err.statusCode = 400;
    throw err;
  }

  const results = new Array(normalized.length);
  const uncachedIndices = [];
  const uncachedTexts = [];

  for (let i = 0; i < normalized.length; i++) {
    const text = normalized[i];
    if (!text) {
      results[i] = {
        originalText: text,
        translatedText: '',
        detectedSourceLanguage: null,
        alreadyTargetLanguage: false,
        cached: false,
      };
      continue;
    }

    const key = getCacheKey(text, sourceLanguage);
    if (translationCache.has(key)) {
      const hit = translationCache.get(key);
      translationCache.delete(key);
      translationCache.set(key, hit);
      results[i] = {
        originalText: text,
        ...hit,
        cached: true,
      };
    } else {
      uncachedIndices.push(i);
      uncachedTexts.push(text);
    }
  }

  if (uncachedTexts.length === 0) {
    return { translations: results };
  }

  const serviceUrl = getServiceUrl();
  const isReady = await waitForTranslationServiceReady(serviceUrl, 90000);
  let modelTranslations = null;

  if (isReady) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

    try {
      const response = await fetch(`${serviceUrl}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: uncachedTexts,
          source_language: sourceLanguage,
          target_language: 'ceb_Latn',
        }),
        signal: controller.signal,
      });

      if (response.ok) {
        const serviceData = await response.json();
        if (
          Array.isArray(serviceData?.translations) &&
          serviceData.translations.length === uncachedTexts.length
        ) {
          modelTranslations = serviceData.translations;
        }
      } else if (response.status === 400) {
        const err = new Error('Translation unavailable. Please try again.');
        err.statusCode = 400;
        throw err;
      }
    } catch (err) {
      if (err.statusCode === 400) throw err;
      console.warn(
        `[TranslationService] Local NLLB service at ${serviceUrl} unreachable (${err.message}); using cloud fallback.`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Fallback to free keyless cloud translation when running on Railway (no local Python .venv)
  if (!modelTranslations) {
    modelTranslations = await translateBatchViaFreeCloud(uncachedTexts, sourceLanguage);
  }

  if (!Array.isArray(modelTranslations) || modelTranslations.length !== uncachedTexts.length) {
    const err = new Error('Translation unavailable. Please try again.');
    err.statusCode = 503;
    throw err;
  }

  for (let j = 0; j < uncachedIndices.length; j++) {
    const idx = uncachedIndices[j];
    const originalText = uncachedTexts[j];
    const item = modelTranslations[j] || {};
    const detectedSourceLanguage = item.detectedSourceLanguage || null;
    const translatedText = String(item.translatedText || '').trim() || originalText;

    const entry = {
      translatedText,
      detectedSourceLanguage,
      alreadyTargetLanguage: Boolean(item.alreadyTargetLanguage),
    };

    setCacheEntry(getCacheKey(originalText, sourceLanguage), entry);
    results[idx] = {
      originalText,
      ...entry,
      cached: false,
    };
  }

  return { translations: results };
}
