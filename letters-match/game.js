// Dynamic UI scale: 1.0 at 1280px wide → 1.5 at 1920px wide (1080p +50%)
(function initScale() {
  if (typeof window === 'undefined') return;
  function updateScale() {
    const w = window.innerWidth;
    const scale = Math.min(1.5, Math.max(1.0, 1.0 + (w - 1280) / 640 * 0.5));
    document.documentElement.style.setProperty('--scale', scale.toFixed(4));
  }
  updateScale();
  window.addEventListener('resize', updateScale);
})();

// Settings resolution (global or imported)
let _settingsModule;
if (typeof require !== 'undefined') {
  try {
    _settingsModule = require('./settings.js');
  } catch (_) {}
}

const _getStorage = (k) => (typeof getStorage === 'function' ? getStorage(k) : (_settingsModule ? _settingsModule.getStorage(k) : null));
const _setStorage = (k, v) => (typeof setStorage === 'function' ? setStorage(k, v) : (_settingsModule ? _settingsModule.setStorage(k, v) : null));
const _getLanguage = () => (typeof getLanguage === 'function' ? getLanguage() : (_settingsModule ? _settingsModule.getLanguage() : 'en'));
const _setLanguage = (l) => (typeof setLanguage === 'function' ? setLanguage(l) : (_settingsModule ? _settingsModule.setLanguage(l) : null));
const _getMute = () => (typeof getMute === 'function' ? getMute() : (_settingsModule ? _settingsModule.getMute() : false));
const _setMute = (v) => (typeof setMute === 'function' ? setMute(v) : (_settingsModule ? _settingsModule.setMute(v) : null));
const _getFontMode = () => (typeof getFontMode === 'function' ? getFontMode() : (_settingsModule ? _settingsModule.getFontMode() : 'default'));
const _setFontMode = (m) => (typeof setFontMode === 'function' ? setFontMode(m) : (_settingsModule ? _settingsModule.setFontMode(m) : null));
const _getDisableHandwritten = () => (typeof getDisableHandwritten === 'function' ? getDisableHandwritten() : (_settingsModule ? _settingsModule.getDisableHandwritten() : false));
const _setDisableHandwritten = (d) => (typeof setDisableHandwritten === 'function' ? setDisableHandwritten(d) : (_settingsModule ? _settingsModule.setDisableHandwritten(d) : null));

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALL_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ALL_PL_LETTERS = 'ABCDEFGHIJKLMNOPRSTUWYZ'.split('').concat(['Ą','Ć','Ę','Ł','Ń','Ó','Ś','Ź','Ż']);
const ALL_PL_LOWERCASE = 'abcdefghijklmnoprstuwyz'.split('').concat(['ą','ć','ę','ł','ń','ó','ś','ź','ż']);

const LETTERS = {
  easy: ['O', 'o', 'U', 'u', 'M', 'm', 'W', 'w', 'V', 'v', 'Y', 'y', 'I', 'l'],
  medium: ['E', 'e', 'A', 'a', 'S', 's', 'G', 'g', 'J', 'j', 'P', 'p'],
  hard: ['C', 'c', 'K', 'k', 'F', 'f', 'R', 'r', 'N', 'n', 'B', 'b', 'D', 'd', 'Q', 'q'],
  fun: ['A', 'a', 'B', 'b', 'C', 'c', 'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g', 'H', 'h'],
  mixed: ['H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o'],
  wild: ['P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'T', 't', 'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z']
};

// Polish letter sets: no V or Q; Polish-specific letters introduced progressively
const LETTERS_PL = {
  easy:   ['O', 'o', 'U', 'u', 'M', 'm', 'W', 'w', 'Y', 'y', 'I', 'l'],
  medium: ['E', 'e', 'A', 'a', 'S', 's', 'G', 'g', 'J', 'j', 'P', 'p'],
  hard:   ['C', 'c', 'K', 'k', 'F', 'f', 'R', 'r', 'N', 'n', 'B', 'b', 'D', 'd', 'Ą', 'ą'],
  fun:    ['A', 'a', 'B', 'b', 'C', 'c', 'Ć', 'ć', 'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g'],
  mixed:  ['H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'Ł', 'ł', 'M', 'm', 'N', 'n'],
  wild:   ['P', 'p', 'R', 'r', 'S', 's', 'Ś', 'ś', 'T', 't', 'U', 'u', 'W', 'w', 'Y', 'y', 'Z', 'z', 'Ź', 'ź', 'Ż', 'ż']
};

const LEVEL_STYLES = {
  easy: { targetClass: '', cardClass: '' },
  medium: { targetClass: '', cardClass: '' },
  hard: { targetClass: '', cardClass: '' },
  fun: { targetClass: 'handwritten-target', cardClass: 'handwritten-card' },
  mixed: { targetClass: 'handwritten-target', cardClass: 'handwritten-card' },
  wild: { targetClass: 'handwritten-target', cardClass: 'handwritten-card' },
  infinite: { targetClass: '', cardClass: '' }
};

const LEVEL_ORDER = ['easy', 'medium', 'hard', 'fun', 'mixed', 'wild', 'infinite'];
const ROUNDS_PER_GAME = 10;

let currentLevel = null;
let score = 0;
let round = 0;
let isInfinite = false;
let isProcessing = false;
let currentLevelIndex = 0;
let unlockedLevel = 1;
let usedBaseLetters = new Set();
let lastTargetBase = null;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Determines whether a given letter should render in handwritten cursive font.
 * - 'serif': Handwritten disabled across all levels (standard serif only).
 * - 'hand': Handwritten cursive across all levels.
 * - 'default': Level progression (1-3 serif, 4-5 hand, 6-7 mixed).
 */
function isHandwritten(isUpper, level = currentLevel, infinite = isInfinite, mode = _getFontMode()) {
  if (mode === 'serif') return false;
  if (mode === 'hand') return true;
  if (level === 'fun' || level === 'mixed') return true;
  if (level === 'wild' || infinite) return !isUpper;
  return false;
}

function loadProgress() {
  const saved = _getStorage('unlockedLevel');
  if (saved) {
    unlockedLevel = parseInt(saved, 10);
  }
  updateLevelLocks();
}

function saveProgress() {
  _setStorage('unlockedLevel', unlockedLevel);
}

function updateLevelLocks() {
  document.querySelectorAll('.level-card').forEach((card) => {
    const levelNum = card.dataset.level === 'infinite' ? 7 : LEVEL_ORDER.indexOf(card.dataset.level) + 1;
    if (levelNum > unlockedLevel) {
      card.classList.add('locked');
      card.setAttribute('aria-disabled', 'true');
    } else {
      card.classList.remove('locked');
      card.removeAttribute('aria-disabled');
    }
  });
}

function unlockNextLevel() {
  const currentLevelNum = currentLevel === 'infinite' ? 7 : currentLevelIndex + 1;
  if (currentLevelNum >= unlockedLevel && currentLevelNum < 7) {
    unlockedLevel = currentLevelNum + 1;
    saveProgress();
    updateLevelLocks();
  }
}

const mainMenu = document.getElementById('mainMenu');
const gameScreen = document.getElementById('gameScreen');
const targetEl = document.getElementById('target');
const cardsEl = document.getElementById('cards');
const scoreEl = document.getElementById('score');
const progressEl = document.getElementById('progress');
const popup = document.getElementById('popup');
const popupScoreEl = document.getElementById('popupScore');

document.querySelectorAll('.level-card').forEach(card => {
  card.addEventListener('click', () => {
    if (card.classList.contains('locked')) return;
    
    currentLevel = card.dataset.level;
    isInfinite = currentLevel === 'infinite';
    currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel);
    
    if (gameScreen) {
      if (isInfinite) {
        gameScreen.classList.add('infinite-mode');
      } else {
        gameScreen.classList.remove('infinite-mode');
      }
    }
    
    if (mainMenu) mainMenu.classList.add('hidden');
    if (gameScreen) gameScreen.classList.remove('hidden');
    document.body.classList.add('in-game');
    resetGame();
  });
});

const backBtn = document.getElementById('backBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    clearConfetti();
    if (gameScreen) gameScreen.classList.add('hidden');
    if (mainMenu) mainMenu.classList.remove('hidden');
    document.body.classList.remove('in-game');
  });
}

const popupBack = document.getElementById('popupBack');
if (popupBack) {
  popupBack.addEventListener('click', () => {
    clearConfetti();
    if (popup) popup.classList.remove('show');
    if (gameScreen) gameScreen.classList.add('hidden');
    if (mainMenu) mainMenu.classList.remove('hidden');
    document.body.classList.remove('in-game');
  });
}

const popupNext = document.getElementById('popupNext');
if (popupNext) {
  popupNext.addEventListener('click', () => {
    clearConfetti();
    if (popup) popup.classList.remove('show');
    if (currentLevelIndex < LEVEL_ORDER.length - 1) {
      currentLevel = LEVEL_ORDER[currentLevelIndex + 1];
      currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel);
      isInfinite = currentLevel === 'infinite';
      
      if (gameScreen) {
        if (isInfinite) {
          gameScreen.classList.add('infinite-mode');
        } else {
          gameScreen.classList.remove('infinite-mode');
        }
      }
    }
    resetGame();
  });
}

function getAvailableLetters() {
  const lang = _getLanguage();
  if (isInfinite) {
    return lang === 'pl'
      ? [...ALL_PL_LETTERS, ...ALL_PL_LOWERCASE]
      : [...ALL_LETTERS, ...ALL_LOWERCASE];
  }
  const letters = lang === 'pl' ? LETTERS_PL : LETTERS;
  if (currentLevel === 'easy') return letters.easy;
  if (currentLevel === 'medium') return [...letters.easy, ...letters.medium].slice(0, 14);
  if (currentLevel === 'hard') return [...letters.easy, ...letters.medium, ...letters.hard];
  return letters[currentLevel] || letters.easy;
}

function getCardCount() {
  if (isInfinite) return Math.floor(Math.random() * 4) + 3;
  if (currentLevel === 'easy') return 3;
  if (currentLevel === 'medium') return 4;
  if (currentLevel === 'hard') return 5;
  if (currentLevel === 'fun') return 4;
  if (currentLevel === 'mixed') return 5;
  return 6;
}

function applyFontClasses() {
  if (!targetEl || !cardsEl) return;
  const targetLetter = targetEl.textContent;
  if (targetLetter) {
    const targetIsUpper = targetLetter === targetLetter.toUpperCase();
    const targetHandwritten = isHandwritten(targetIsUpper, currentLevel, isInfinite);
    targetEl.className = 'target-letter' + (targetHandwritten ? ' handwritten-target' : '');
  }

  cardsEl.querySelectorAll('.answer-card').forEach((card) => {
    const cardLetter = card.textContent;
    const cardIsUpper = cardLetter === cardLetter.toUpperCase();
    const cardHandwritten = isHandwritten(cardIsUpper, currentLevel, isInfinite);
    card.className = 'answer-card' + (cardHandwritten ? ' handwritten-card' : '');
  });
}

function generateRound() {
  const letters = getAvailableLetters();

  // Prefer letters whose base hasn't been used in this level yet.
  let pool = letters.filter(l => !usedBaseLetters.has(l.toUpperCase()));

  // If all base letters exhausted, start a fresh cycle — but never repeat the last base consecutively.
  if (pool.length === 0) {
    usedBaseLetters.clear();
    pool = lastTargetBase
      ? letters.filter(l => l.toUpperCase() !== lastTargetBase)
      : [...letters];
    // Fallback: if the pool ends up empty, use all.
    if (pool.length === 0) pool = [...letters];
  }

  const targetIndex = Math.floor(Math.random() * pool.length);
  const targetLetter = pool[targetIndex];

  lastTargetBase = targetLetter.toUpperCase();
  usedBaseLetters.add(lastTargetBase);
  const targetIsUpper = targetLetter === targetLetter.toUpperCase();
  
  const answer = targetIsUpper ? targetLetter.toLowerCase() : targetLetter.toUpperCase();
  const cardCount = getCardCount();

  const candidatePool = letters.filter(l => l !== targetLetter && l !== answer);
  const wrongAnswers = shuffle(candidatePool).slice(0, cardCount - 1);
  const allCards = shuffle([answer, ...wrongAnswers]);

  const targetIsHandwritten = isHandwritten(targetIsUpper, currentLevel, isInfinite);
  if (targetEl) {
    targetEl.className = 'target-letter' + (targetIsHandwritten ? ' handwritten-target' : '');
    targetEl.textContent = targetLetter;
  }

  if (cardsEl) {
    cardsEl.innerHTML = '';
    allCards.forEach((letter) => {
      const card = document.createElement('div');
      const cardIsUpper = letter === letter.toUpperCase();
      const cardIsHandwritten = isHandwritten(cardIsUpper, currentLevel, isInfinite);
      card.className = 'answer-card' + (cardIsHandwritten ? ' handwritten-card' : '');
      card.textContent = letter;
      card.addEventListener('click', () => handleCardClick(card, letter, answer));
      cardsEl.appendChild(card);
    });
  }

  // Speak the target letter after a short delay
  setTimeout(() => speakLetter(targetLetter), 150);
}

function handleCardClick(card, clickedLetter, correctAnswer) {
  if (isProcessing) return;
  
  if (clickedLetter === correctAnswer) {
    isProcessing = true;
    score++;
    if (scoreEl) scoreEl.textContent = score;
    card.classList.add('correct');
    createConfetti(card);
    
    setTimeout(() => {
      round++;
      updateProgress();
      
      if (!isInfinite && round >= ROUNDS_PER_GAME) {
        showLevelComplete();
      } else {
        generateRound();
      }
      isProcessing = false;
    }, 600);
  } else {
    card.classList.add('wrong');
    setTimeout(() => card.classList.remove('wrong'), 400);
  }
}

// ---------------------------------------------------------------------------
// Voiceover — Web Speech API
// ---------------------------------------------------------------------------
let _cachedVoices = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  const loadVoices = () => {
    try {
      _cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch (_) {}
  };
  loadVoices();
  if (window.speechSynthesis.addEventListener) {
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

function pickEnFemaleVoice() {
  const femaleKeywords = ['samantha', 'karen', 'victoria', 'moira', 'tessa',
                          'fiona', 'veena', 'zira', 'female', 'woman'];
  const enVoices = _cachedVoices.filter(v => v.lang && v.lang.startsWith('en'));
  return enVoices.find(v => femaleKeywords.some(k => v.name.toLowerCase().includes(k)))
      ?? enVoices.find(v => v.lang === 'en-US')
      ?? enVoices[0]
      ?? null;
}

function speakLetter(letter) {
  if (typeof window === 'undefined' || !window.speechSynthesis || _getMute() || !letter) return;
  try {
    window.speechSynthesis.cancel();
    // Always use lowercase so TTS doesn't say "capital W" or "duże W"
    const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
    const isPL = _getLanguage() === 'pl';
    utterance.lang   = isPL ? 'pl-PL' : 'en-US';
    utterance.rate   = isPL ? 0.8 : 1.0;
    utterance.pitch  = 1.0;
    utterance.volume = 1;

    if (isPL) {
      const plVoice = _cachedVoices.find(v => v.lang && v.lang.toLowerCase().startsWith('pl'));
      if (plVoice) utterance.voice = plVoice;
    } else {
      const femaleVoice = pickEnFemaleVoice();
      if (femaleVoice) utterance.voice = femaleVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch (_) {}
}

function getConfettiContainer() {
  return document.getElementById('confettiContainer') || document.body;
}

function clearConfetti() {
  const container = document.getElementById('confettiContainer');
  if (container) {
    container.innerHTML = '';
  }
}

function createConfetti(card) {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#a3a380', '#d6ce93', '#f7c59f', '#d8a48f', '#bb8588', '#f4e1d2', '#ffd6a5', '#caffbf'];
  const shapes = ['square', 'circle', 'ribbon'];
  const container = getConfettiContainer();

  // Physics confetti
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('div');
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    piece.className = 'confetti-piece confetti-' + shape;
    const color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.background = color;
    piece.style.left = cx + 'px';
    piece.style.top = cy + 'px';

    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 220;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 180;
    const gravity = 420 + Math.random() * 120;
    const rotSpeed = (Math.random() - 0.5) * 900;
    const duration = 0.7 + Math.random() * 0.5;
    const size = 8 + Math.random() * 10;

    piece.style.width = size + 'px';
    piece.style.height = shape === 'ribbon' ? (size * 0.35) + 'px' : size + 'px';
    piece.style.setProperty('--vx', vx + 'px');
    piece.style.setProperty('--vy', vy + 'px');
    piece.style.setProperty('--gravity', gravity + 'px');
    piece.style.setProperty('--rot', rotSpeed + 'deg');
    piece.style.setProperty('--dur', duration + 's');

    container.appendChild(piece);
    setTimeout(() => piece.remove(), duration * 1000 + 100);
  }

  // Floating emoji burst
  const emojiSets = [
    ['⭐', '🌟', '✨', '💫'],
    ['❤️', '💛', '💚', '💙'],
    ['🎉', '🎊', '🎈', '🎀'],
  ];
  const emojis = emojiSets[Math.floor(Math.random() * emojiSets.length)];
  for (let i = 0; i < 5; i++) {
    const em = document.createElement('div');
    em.className = 'win-emoji';
    em.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const spread = 120;
    em.style.left = (cx + (Math.random() - 0.5) * spread) + 'px';
    em.style.top = (cy + (Math.random() - 0.5) * spread * 0.5) + 'px';
    em.style.setProperty('--rise', -(60 + Math.random() * 80) + 'px');
    em.style.setProperty('--sway', (Math.random() - 0.5) * 60 + 'px');
    em.style.setProperty('--delay', (i * 0.07) + 's');
    container.appendChild(em);
    setTimeout(() => em.remove(), 1200);
  }

  flashTarget();

  if (scoreEl) {
    scoreEl.classList.remove('score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-pop');
    setTimeout(() => scoreEl.classList.remove('score-pop'), 500);
  }
}

function flashTarget() {
  if (!targetEl) return;
  const ring = document.createElement('div');
  ring.className = 'target-ring';
  const rect = targetEl.getBoundingClientRect();
  ring.style.left = (rect.left + rect.width / 2) + 'px';
  ring.style.top  = (rect.top  + rect.height / 2) + 'px';
  const container = getConfettiContainer();
  container.appendChild(ring);
  setTimeout(() => ring.remove(), 700);

  targetEl.classList.add('target-flash');
  setTimeout(() => targetEl.classList.remove('target-flash'), 500);
}

function updateProgress() {
  if (!isInfinite && progressEl) {
    const percentage = (round / ROUNDS_PER_GAME) * 100;
    progressEl.style.width = percentage + '%';
  }
}

function showLevelComplete() {
  if (popup) popup.classList.add('show');
  if (popupScoreEl) {
    popupScoreEl.textContent = `${score} / ${ROUNDS_PER_GAME}`;
  }
  if (score >= 7) {
    unlockNextLevel();
  }
}

function resetGame() {
  score = 0;
  round = 0;
  usedBaseLetters = new Set();
  lastTargetBase = null;
  clearConfetti();
  if (scoreEl) scoreEl.textContent = '0';
  if (progressEl) progressEl.style.width = '0%';
  if (popup) popup.classList.remove('show');
  generateRound();
}

if (targetEl) {
  targetEl.addEventListener('click', () => {
    const letter = targetEl.textContent;
    if (letter) speakLetter(letter);
  });
}

// ---------------------------------------------------------------------------
// Controls: Sound (Mute) & Font Switch
// ---------------------------------------------------------------------------

function updateMuteUI() {
  const isMuted = _getMute();
  document.querySelectorAll('.mute-btn').forEach(btn => {
    btn.textContent = isMuted ? '🔇' : '🔊';
    btn.classList.toggle('muted', isMuted);
    btn.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
    btn.setAttribute('title', isMuted ? 'Sound: Muted' : 'Sound: On');
  });
}

function toggleMute() {
  const isMuted = !_getMute();
  _setMute(isMuted);
  updateMuteUI();
  if (!isMuted && targetEl && targetEl.textContent) {
    speakLetter(targetEl.textContent);
  }
}

function updateFontUI() {
  const mode = _getFontMode();
  document.querySelectorAll('.font-btn').forEach(btn => {
    btn.classList.toggle('active', mode === 'serif');
    if (mode === 'serif') {
      btn.textContent = '🔤';
      btn.setAttribute('title', 'Font: Plain Serif (Handwriting disabled)');
      btn.setAttribute('aria-label', 'Font: Plain Serif');
    } else if (mode === 'hand') {
      btn.textContent = '🖋️';
      btn.setAttribute('title', 'Font: Handwritten Cursive');
      btn.setAttribute('aria-label', 'Font: Handwritten');
    } else {
      btn.textContent = '✍️';
      btn.setAttribute('title', 'Font: Level Default (Serifs / Hand / Mixed)');
      btn.setAttribute('aria-label', 'Font: Level Default');
    }
  });
  applyFontClasses();
}

function cycleFontMode() {
  const current = _getFontMode();
  let next = 'default';
  if (current === 'default') next = 'serif';
  else if (current === 'serif') next = 'hand';
  else next = 'default';
  
  _setFontMode(next);
  updateFontUI();
}

document.querySelectorAll('.mute-btn').forEach(btn => {
  btn.addEventListener('click', toggleMute);
});

document.querySelectorAll('.font-btn').forEach(btn => {
  btn.addEventListener('click', cycleFontMode);
});

updateMuteUI();
updateFontUI();
loadProgress();
generateRound();

// ---------------------------------------------------------------------------
// Language Selector
// ---------------------------------------------------------------------------
(function initLangSelector() {
  const selector = document.getElementById('langSelector');
  if (!selector) return;

  function updateButtons(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  updateButtons(_getLanguage());

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      _setLanguage(lang);
      updateButtons(lang);
      if (gameScreen && !gameScreen.classList.contains('hidden')) {
        generateRound();
      }
    });
  });
})();

if (typeof module !== 'undefined') {
  module.exports = {
    LETTERS,
    LETTERS_PL,
    LEVEL_ORDER,
    ROUNDS_PER_GAME,
    ALL_LETTERS,
    ALL_LOWERCASE,
    ALL_PL_LETTERS,
    ALL_PL_LOWERCASE,
    getAvailableLetters,
    getCardCount,
    generateRound,
    isHandwritten,
    applyFontClasses,
    updateFontUI,
    updateMuteUI,
    cycleFontMode,
    toggleMute,
    _setState(state) {
      if ('currentLevel' in state) currentLevel = state.currentLevel;
      if ('isInfinite' in state) isInfinite = state.isInfinite;
      if ('usedBaseLetters' in state) usedBaseLetters = new Set(state.usedBaseLetters);
      if ('lastTargetBase' in state) lastTargetBase = state.lastTargetBase;
    },
    _getState() {
      return { usedBaseLetters: new Set(usedBaseLetters), lastTargetBase };
    },
  };
}
