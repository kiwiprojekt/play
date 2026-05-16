// Dynamic UI scale: 1.0 at 1280px wide → 1.5 at 1920px wide (1080p +50%)
(function initScale() {
  function updateScale() {
    const w = window.innerWidth;
    const scale = Math.min(1.5, Math.max(1.0, 1.0 + (w - 1280) / 640 * 0.5));
    document.documentElement.style.setProperty('--scale', scale.toFixed(4));
  }
  updateScale();
  window.addEventListener('resize', updateScale);
})();

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALL_LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'.split('');

const ALL_PL_LETTERS = 'ABCDEFGHIJKLMNOPRSTUWXYZ'.split('').concat(['Ą','Ć','Ę','Ł','Ń','Ó','Ś','Ź','Ż']);
const ALL_PL_LOWERCASE = 'abcdefghijklmnoprstuwxyz'.split('').concat(['ą','ć','ę','ł','ń','ó','ś','ź','ż']);

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
  easy:   ['O', 'o', 'U', 'u', 'M', 'm', 'W', 'w', 'X', 'x', 'Y', 'y', 'I', 'l'],
  medium: ['E', 'e', 'A', 'a', 'S', 's', 'G', 'g', 'J', 'j', 'P', 'p'],
  hard:   ['C', 'c', 'K', 'k', 'F', 'f', 'R', 'r', 'N', 'n', 'B', 'b', 'D', 'd', 'Ą', 'ą'],
  fun:    ['A', 'a', 'B', 'b', 'C', 'c', 'Ć', 'ć', 'D', 'd', 'E', 'e', 'F', 'f', 'G', 'g'],
  mixed:  ['H', 'h', 'I', 'i', 'J', 'j', 'K', 'k', 'L', 'l', 'Ł', 'ł', 'M', 'm', 'N', 'n'],
  wild:   ['P', 'p', 'R', 'r', 'S', 's', 'Ś', 'ś', 'T', 't', 'U', 'u', 'W', 'w', 'X', 'x', 'Y', 'y', 'Z', 'z', 'Ź', 'ź', 'Ż', 'ż']
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

function loadProgress() {
  const saved = getStorage('unlockedLevel');
  if (saved) {
    unlockedLevel = parseInt(saved, 10);
  }
  updateLevelLocks();
}

function saveProgress() {
  setStorage('unlockedLevel', unlockedLevel);
}

function updateLevelLocks() {
  document.querySelectorAll('.level-card').forEach((card, index) => {
    const levelNum = card.dataset.level === 'infinite' ? 7 : LEVEL_ORDER.indexOf(card.dataset.level) + 1;
    if (levelNum > unlockedLevel) {
      card.classList.add('locked');
    } else {
      card.classList.remove('locked');
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
    
    if (isInfinite) {
      gameScreen.classList.add('infinite-mode');
    } else {
      gameScreen.classList.remove('infinite-mode');
    }
    
    mainMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    document.body.classList.add('in-game');
    resetGame();
  });
});

document.getElementById('backBtn').addEventListener('click', () => {
  gameScreen.classList.add('hidden');
  mainMenu.classList.remove('hidden');
  document.body.classList.remove('in-game');
});

document.getElementById('popupBack').addEventListener('click', () => {
  popup.classList.remove('show');
  gameScreen.classList.add('hidden');
  mainMenu.classList.remove('hidden');
  document.body.classList.remove('in-game');
});

document.getElementById('popupNext').addEventListener('click', () => {
  popup.classList.remove('show');
  if (currentLevelIndex < LEVEL_ORDER.length - 1) {
    currentLevel = LEVEL_ORDER[currentLevelIndex + 1];
    currentLevelIndex = LEVEL_ORDER.indexOf(currentLevel);
    isInfinite = currentLevel === 'infinite';
    
    if (isInfinite) {
      gameScreen.classList.add('infinite-mode');
    } else {
      gameScreen.classList.remove('infinite-mode');
    }
  }
  resetGame();
});

function getAvailableLetters() {
  const lang = getLanguage();
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

function generateRound() {
  const letters = getAvailableLetters();

  // Prefer letters whose base hasn't been used in this level yet.
  let pool = letters.filter(l => !usedBaseLetters.has(l.toUpperCase()));

  // If all base letters exhausted, start a fresh cycle — but never repeat
  // the last base consecutively.
  if (pool.length === 0) {
    usedBaseLetters.clear();
    pool = lastTargetBase
      ? letters.filter(l => l.toUpperCase() !== lastTargetBase)
      : [...letters];
    // Fallback: if the pool somehow ends up empty (single-letter set), use all.
    if (pool.length === 0) pool = [...letters];
  }

  const targetIndex = Math.floor(Math.random() * pool.length);
  let targetLetter = pool[targetIndex];

  lastTargetBase = targetLetter.toUpperCase();
  usedBaseLetters.add(lastTargetBase);
  const targetIsUpper = targetLetter === targetLetter.toUpperCase();
  
  const answer = targetIsUpper ? targetLetter.toLowerCase() : targetLetter.toUpperCase();
  
  const cardCount = getCardCount();
  const wrongAnswers = [];
  const usedLetters = new Set([targetLetter, answer]);
  
  while (wrongAnswers.length < cardCount - 1) {
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    if (!usedLetters.has(randomLetter)) {
      wrongAnswers.push(randomLetter);
      usedLetters.add(randomLetter);
    }
  }
  
  const allCards = [answer, ...wrongAnswers];
  for (let i = allCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
  }
  
  let targetClass = 'target-letter';
  let cardClass = 'answer-card';
  
  if (isInfinite) {
    const targetIsUpper = targetLetter === targetLetter.toUpperCase();
    if (targetIsUpper) {
      targetClass += ' target-mixed-upper';
      cardClass += ' card-mixed-lower';
    } else {
      targetClass += ' target-mixed-lower';
      cardClass += ' card-mixed-upper';
    }
  } else if (currentLevel === 'wild') {
    const targetIsUpper = targetLetter === targetLetter.toUpperCase();
    if (targetIsUpper) {
      targetClass += ' target-mixed-upper';
      cardClass += ' card-mixed-lower';
    } else {
      targetClass += ' target-mixed-lower';
      cardClass += ' card-mixed-upper';
    }
  } else {
    const style = LEVEL_STYLES[currentLevel] || { targetClass: '', cardClass: '' };
    targetClass += ' ' + style.targetClass;
    cardClass += ' ' + style.cardClass;
  }
  
  targetEl.className = targetClass;
  targetEl.textContent = targetLetter;
  cardsEl.innerHTML = '';
  
  allCards.forEach((letter) => {
    const card = document.createElement('div');
    card.className = cardClass;
    card.textContent = letter;
    card.addEventListener('click', () => handleCardClick(card, letter, answer));
    cardsEl.appendChild(card);
  });
}

function handleCardClick(card, clickedLetter, correctAnswer) {
  if (isProcessing) return;
  
  if (clickedLetter === correctAnswer) {
    isProcessing = true;
    score++;
    scoreEl.textContent = score;
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

function createConfetti(card) {
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#a3a380', '#d6ce93', '#f7c59f', '#d8a48f', '#bb8588', '#f4e1d2', '#ffd6a5', '#caffbf'];
  const shapes = ['square', 'circle', 'ribbon'];

  // --- Physics confetti ---
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
    const vy = Math.sin(angle) * speed - 180; // bias upward
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

    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), duration * 1000 + 100);
  }

  // --- Floating emoji burst ---
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
    document.body.appendChild(em);
    setTimeout(() => em.remove(), 1200);
  }

  // --- Ripple ring on the target letter ---
  flashTarget();

  // --- Score counter pop ---
  scoreEl.classList.remove('score-pop');
  void scoreEl.offsetWidth; // reflow
  scoreEl.classList.add('score-pop');
  setTimeout(() => scoreEl.classList.remove('score-pop'), 500);
}

function flashTarget() {
  const ring = document.createElement('div');
  ring.className = 'target-ring';
  const rect = targetEl.getBoundingClientRect();
  ring.style.left = (rect.left + rect.width / 2) + 'px';
  ring.style.top  = (rect.top  + rect.height / 2) + 'px';
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 700);

  targetEl.classList.add('target-flash');
  setTimeout(() => targetEl.classList.remove('target-flash'), 500);
}

function updateProgress() {
  if (!isInfinite) {
    const percentage = (round / ROUNDS_PER_GAME) * 100;
    progressEl.style.width = percentage + '%';
  }
}

function showLevelComplete() {
  popup.classList.add('show');
  
  if (score >= 7) {
    unlockNextLevel();
  }
}

function resetGame() {
  score = 0;
  round = 0;
  usedBaseLetters = new Set();
  lastTargetBase = null;
  scoreEl.textContent = '0';
  progressEl.style.width = '0%';
  popup.classList.remove('show');
  generateRound();
}

loadProgress();
generateRound();

(function initLangSelector() {
  const selector = document.getElementById('langSelector');
  if (!selector) return;

  function updateButtons(lang) {
    selector.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  updateButtons(getLanguage());

  selector.addEventListener('click', (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    setLanguage(lang);
    updateButtons(lang);
    if (gameScreen && !gameScreen.classList.contains('hidden')) {
      generateRound();
    }
  });
})();

if (typeof module !== 'undefined') {
  module.exports = {
    LETTERS, LETTERS_PL, LEVEL_ORDER, ROUNDS_PER_GAME,
    ALL_LETTERS, ALL_LOWERCASE, ALL_PL_LETTERS, ALL_PL_LOWERCASE,
    getAvailableLetters, getCardCount, generateRound,
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
