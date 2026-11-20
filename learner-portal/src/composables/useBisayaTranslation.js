import { reactive } from 'vue';
import api from '../api/axios.js';
import { sanitizeRichText } from '../utils/sanitizeRichText.js';

// Client-side session cache so toggling "Show Original" / "Translate to Bisaya" is instant
const clientTranslationCache = new Map();

export function useBisayaTranslation() {
  const entries = reactive({});

  function ensureEntry(key) {
    if (!entries[key]) {
      entries[key] = {
        visible: false,
        loading: false,
        error: '',
        text: '',
        questionText: '',
        optionsMap: {},
        alreadyBisaya: false,
      };
    }
    return entries[key];
  }

  function getEntry(key) {
    return entries[key] || {
      visible: false,
      loading: false,
      error: '',
      text: '',
      questionText: '',
      optionsMap: {},
      alreadyBisaya: false,
    };
  }

  async function requestTranslations(texts, format = 'text') {
    const cleanTexts = texts.map((t) => String(t ?? '').trim());
    const results = new Array(cleanTexts.length);
    const missingIndices = [];
    const missingTexts = [];

    for (let i = 0; i < cleanTexts.length; i++) {
      const t = cleanTexts[i];
      if (!t) {
        results[i] = { translatedText: '', alreadyTargetLanguage: false };
        continue;
      }
      const cacheKey = `${format}::${t}`;
      if (clientTranslationCache.has(cacheKey)) {
        results[i] = clientTranslationCache.get(cacheKey);
      } else {
        missingIndices.push(i);
        missingTexts.push(t);
      }
    }

    if (missingTexts.length > 0) {
      const { data } = await api.post(
        '/translations/bisaya',
        {
          texts: missingTexts,
          format,
        },
        {
          timeout: 90000,
        }
      );

      const returned = data?.translations;
      if (!Array.isArray(returned) || returned.length !== missingTexts.length) {
        throw new Error('Translation unavailable. Please try again.');
      }

      for (let j = 0; j < missingIndices.length; j++) {
        const idx = missingIndices[j];
        const orig = missingTexts[j];
        const item = returned[j] || {};
        const translatedText =
          format === 'html'
            ? sanitizeRichText(item.translatedText || orig)
            : String(item.translatedText || orig);

        const payload = {
          translatedText,
          alreadyTargetLanguage: Boolean(item.alreadyTargetLanguage),
        };
        clientTranslationCache.set(`${format}::${orig}`, payload);
        results[idx] = payload;
      }
    }

    return results;
  }

  async function toggleTextTranslation(key, originalText, options = {}) {
    const entry = ensureEntry(key);
    if (entry.loading) return;

    if (entry.visible) {
      entry.visible = false;
      entry.error = '';
      return;
    }

    const raw = String(originalText ?? '').trim();
    if (!raw) return;

    // Use approved local translation if available
    if (options.approvedText && String(options.approvedText).trim()) {
      entry.text =
        options.format === 'html'
          ? sanitizeRichText(options.approvedText)
          : String(options.approvedText).trim();
      entry.alreadyBisaya = false;
      entry.error = '';
      entry.visible = true;
      return;
    }

    if (entry.text) {
      entry.error = '';
      entry.visible = true;
      return;
    }

    entry.loading = true;
    entry.error = '';
    try {
      const [res] = await requestTranslations([raw], options.format || 'text');
      entry.text = res.translatedText || raw;
      entry.alreadyBisaya = Boolean(res.alreadyTargetLanguage);
      entry.visible = true;
    } catch (_err) {
      entry.error = 'Translation unavailable. Please try again.';
      entry.visible = false;
    } finally {
      entry.loading = false;
    }
  }

  async function toggleQuestionTranslation(key, questionText, _optionsList = [], approved = null) {
    const entry = ensureEntry(key);
    if (entry.loading) return;

    if (entry.visible) {
      entry.visible = false;
      entry.error = '';
      return;
    }

    // Use approved local translation if provided
    if (approved && approved.question) {
      entry.questionText = String(approved.question).trim();
      entry.optionsMap = {};
      entry.alreadyBisaya = false;
      entry.error = '';
      entry.visible = true;
      return;
    }

    if (entry.questionText) {
      entry.error = '';
      entry.visible = true;
      return;
    }

    const qText = String(questionText ?? '').trim();
    if (!qText) return;

    entry.loading = true;
    entry.error = '';
    try {
      const [res] = await requestTranslations([qText], 'text');
      entry.questionText = res?.translatedText || qText;
      entry.optionsMap = {};
      entry.alreadyBisaya = Boolean(res?.alreadyTargetLanguage);
      entry.visible = true;
    } catch (_err) {
      entry.error = 'Translation unavailable. Please try again.';
      entry.visible = false;
    } finally {
      entry.loading = false;
    }
  }

  function getButtonLabel(key) {
    const entry = getEntry(key);
    if (entry.loading) return 'Translating...';
    if (entry.visible) return 'Show Original';
    return 'Translate to Bisaya';
  }

  return {
    getEntry,
    getButtonLabel,
    toggleTextTranslation,
    toggleQuestionTranslation,
  };
}
