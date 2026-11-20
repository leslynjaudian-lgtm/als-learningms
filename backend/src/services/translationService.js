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
  if (!isReady) {
    console.error(
      `[TranslationService] Local NLLB-200 service at ${serviceUrl} is not ready (${lastStartupError || 'timeout waiting for model'}).`
    );
    const err = new Error('Translation unavailable. Please try again.');
    err.statusCode = 503;
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TRANSLATION_TIMEOUT_MS);

  let serviceData;
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

    if (!response.ok) {
      let reason = `HTTP ${response.status}`;
      try {
        const errBody = await response.json();
        if (errBody?.detail) {
          reason = `HTTP ${response.status}: ${errBody.detail}`;
        }
      } catch {
        // ignore JSON parse errors
      }
      console.error(`[TranslationService] Local NLLB service error (${reason})`);
      const err = new Error('Translation unavailable. Please try again.');
      err.statusCode = response.status === 400 ? 400 : 503;
      throw err;
    }

    serviceData = await response.json();
  } catch (err) {
    if (err.statusCode) throw err;
    console.error(
      `[TranslationService] Failed to reach local NLLB service at ${serviceUrl}: ${err.message}`
    );
    const serviceErr = new Error('Translation unavailable. Please try again.');
    serviceErr.statusCode = 503;
    throw serviceErr;
  } finally {
    clearTimeout(timeoutId);
  }

  const modelTranslations = serviceData?.translations;
  if (!Array.isArray(modelTranslations) || modelTranslations.length !== uncachedTexts.length) {
    const err = new Error('Translation unavailable. Please try again.');
    err.statusCode = 502;
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
