import { Router } from 'express';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { translateToBisaya } from '../services/translationService.js';

const router = Router();

// Simple per-user/IP sliding-window rate limiter (60 requests per 60 seconds)
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 60;
const rateBucket = new Map();

function checkRateLimit(req, res, next) {
  const key = String(req.user?.userId || req.ip || 'anon');
  const now = Date.now();
  const timestamps = (rateBucket.get(key) || []).filter((ts) => now - ts < RATE_WINDOW_MS);

  if (timestamps.length >= RATE_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Translation unavailable. Please try again.',
    });
  }

  timestamps.push(now);
  rateBucket.set(key, timestamps);
  next();
}

/**
 * POST /api/translations/bisaya
 * Body: { texts: string[], format?: 'text' | 'html', sourceLanguage?: string }
 * Translates English or Filipino/Tagalog text to Cebuano/Bisaya (ceb_Latn)
 * via the private local Python NLLB-200 translation service.
 */
router.post('/bisaya', optionalAuth, checkRateLimit, async (req, res) => {
  try {
    const { texts, format, sourceLanguage } = req.body || {};
    const result = await translateToBisaya(texts, { format, sourceLanguage });
    return res.json(result);
  } catch (err) {
    const status = err.statusCode || 503;
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[TranslationsRoute] POST /api/translations/bisaya failed (${status}):`, err.message);
    }
    return res.status(status).json({
      error: status === 400 ? err.message : 'Translation unavailable. Please try again.',
    });
  }
});

export default router;
