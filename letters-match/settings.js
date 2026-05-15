const STORAGE_PREFIX = 'letterMatch_';

function getStorage(key) {
  return localStorage.getItem(STORAGE_PREFIX + key);
}

function setStorage(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, value);
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

if (typeof module !== 'undefined') {
  module.exports = { getLanguage, setLanguage, VALID_LANGUAGES, DEFAULT_LANGUAGE };
}
