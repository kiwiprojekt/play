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

const STORAGE_PREFIX = 'letterMatch_';

let currentLevel = null;
let score = 0;
let round = 0;
let isInfinite = false;
let isProcessing = false;
let currentLevelIndex = 0;
let unlockedLevel = 1;

function getStorage(key) {
  return localStorage.getItem(STORAGE_PREFIX + key);
}

function setStorage(key, value) {
  localStorage.setItem(STORAGE_PREFIX + key, value);
}

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
  const targetIndex = Math.floor(Math.random() * letters.length);
  let targetLetter = letters[targetIndex];
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
  const colors = ['#a3a380', '#d6ce93', '#efebce', '#d8a48f', '#bb8588'];
  
  for (let i = 0; i < 15; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = (rect.left + rect.width / 2 + (Math.random() - 0.5) * 100) + 'px';
    piece.style.top = (rect.top + rect.height / 2) + 'px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(piece);
    
    setTimeout(() => piece.remove(), 1000);
  }
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
