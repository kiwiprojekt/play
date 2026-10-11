const STORAGE_PREFIX = 'letterMatch_';

function getStorage(key) {
  try {
    return localStorage.getItem(STORAGE_PREFIX + key);
  } catch (_) {
    return null;
  }
}

function setStorage(key, value) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, value);
  } catch (_) {}
}

const VALID_LANGUAGES = ['en', 'pl'];
const DEFAULT_LANGUAGE = 'en';

function getLanguage() {
  const saved = getStorage('language');
  if (saved && VALID_LANGUAGES.includes(saved)) {
    return saved;
  }
  return DEFAULT_LANGUAGE;
}

function setLanguage(language) {
  if (!VALID_LANGUAGES.includes(language)) {
    console.warn(`Invalid language: ${language}. Using default.`);
    return;
  }
  setStorage('language', language);
}

function getMute() {
  return getStorage('mute') === 'true';
}

function setMute(isMuted) {
  setStorage('mute', isMuted ? 'true' : 'false');
}

const VALID_FONT_MODES = ['default', 'serif', 'hand'];
const DEFAULT_FONT_MODE = 'default';

function normalizeFontMode(mode) {
  if (mode === 'serifs') return 'serif';
  if (mode === 'mixed') return 'default';
  return mode;
}

function getFontMode() {
  // Check if explicit boolean flag was saved
  const disabled = getStorage('disableHandwritten');
  if (disabled === 'true') {
    return 'serif';
  }
  const saved = normalizeFontMode(getStorage('fontMode'));
  if (saved && VALID_FONT_MODES.includes(saved)) {
    return saved;
  }
  return DEFAULT_FONT_MODE;
}

function setFontMode(mode) {
  const normalized = normalizeFontMode(mode);
  if (!VALID_FONT_MODES.includes(normalized)) {
    console.warn(`Invalid font mode: ${mode}. Using default.`);
    return;
  }
  setStorage('fontMode', normalized);
  setStorage('disableHandwritten', normalized === 'serif' ? 'true' : 'false');
}

function getDisableHandwritten() {
  return getFontMode() === 'serif';
}

function setDisableHandwritten(isMutedOrDisabled) {
  setFontMode(isMutedOrDisabled ? 'serif' : 'default');
}

if (typeof module !== 'undefined') {
  module.exports = {
    STORAGE_PREFIX,
    getStorage,
    setStorage,
    getLanguage,
    setLanguage,
    VALID_LANGUAGES,
    DEFAULT_LANGUAGE,
    getMute,
    setMute,
    VALID_FONT_MODES,
    DEFAULT_FONT_MODE,
    getFontMode,
    setFontMode,
    getDisableHandwritten,
    setDisableHandwritten
  };
}
