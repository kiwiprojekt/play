const levels = {
  1: {
    code: "01",
    title: "Transportation",
    pairs: 6,
    imageBase: "assets/01/",
    coverImage: "cover.png",
    backImage: "back.png",
    images: [
      "PNG image.png",
      "PNG image 2.png",
      "PNG image 3.png",
      "PNG image 4.png",
      "PNG image 5.png",
      "PNG image 6.png"
    ]
  },
  2: {
    code: "02",
    title: "Dinosaurs",
    pairs: 8,
    imageBase: "assets/02/",
    coverImage: "cover.png",
    backImage: "back.png",
    images: [
      "PNG image.png",
      "PNG image 2.png",
      "PNG image 3.png",
      "PNG image 4.png",
      "PNG image 5.png",
      "PNG image 6.png",
      "PNG image 7.png",
      "PNG image 8.png"
    ]
  },
  3: {
    code: "03",
    title: "Tools",
    pairs: 10,
    imageBase: "assets/03/",
    coverImage: "cover.png",
    backImage: "back.png",
    images: [
      "PNG image 2.png",
      "PNG image 3.png",
      "PNG image 4.png",
      "PNG image 5.png",
      "PNG image 6.png",
      "PNG image 7.png",
      "PNG image 8.png",
      "PNG image 9.png",
      "PNG image 10.png",
      "PNG image 11.png"
    ]
  },
  4: {
    code: "04",
    title: "African Animals",
    pairs: 12,
    imageBase: "assets/04/",
    coverImage: "cover.png",
    backImage: "back.png",
    images: [
      "PNG image.png",
      "PNG image 2.png",
      "PNG image 3.png",
      "PNG image 4.png",
      "PNG image 5.png",
      "PNG image 6.png",
      "PNG image 7.png",
      "PNG image 8.png",
      "PNG image 9.png",
      "PNG image 10.png",
      "PNG image 11.png",
      "PNG image 12.png"
    ]
  }
};

const mainScreen = document.getElementById("mainScreen");
const gameScreen = document.getElementById("gameScreen");
const board = document.getElementById("board");
const levelLabel = document.getElementById("levelLabel");
const finishPopup = document.getElementById("finishPopup");
const nextButton = document.getElementById("nextButton");
const exitButton = document.getElementById("exitButton");
const muteButton = document.getElementById("muteButton");
const muteButtonMenu = document.getElementById("muteButtonMenu");
const levelButtons = document.querySelectorAll(".level-button");
const LEVEL_POP_MS = 480;

let muted = localStorage.getItem("soundMuted") === "true";

const cardSound = new Audio("assets/rockHit1.ogg");
const buttonSound = new Audio("assets/stoneHit4.ogg");

function playSound(sound) {
  if (muted) return;
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function updateMuteButtons() {
  const text = muted ? "sound: off" : "sound: on";
  muteButton.textContent = text;
  muteButtonMenu.textContent = text;
}

updateMuteButtons();

let unlockedLevels = parseInt(localStorage.getItem("memoUnlockedLevels") || "1", 10);

function updateLevelLocks() {
  levelButtons.forEach((button) => {
    const level = Number(button.dataset.level);
    if (level > unlockedLevels) {
      button.classList.add("locked");
      button.disabled = true;
    } else {
      button.classList.remove("locked");
      button.disabled = false;
    }
  });
}

updateLevelLocks();

let levelMenuBusy = false;
let currentLevel = 1;
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let mismatchPending = false;
let mismatchedPair = null;
let mismatchTimer = null;
let matches = 0;
let nextTimer = null;

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (levelMenuBusy) return;
    const levelNum = Number(button.dataset.level);
    if (levelNum > unlockedLevels) return;
    playSound(buttonSound);
    levelMenuBusy = true;

    const proceed = () => {
      levelMenuBusy = false;
      button.classList.remove("level-tile-pop");
      startLevel(levelNum);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      proceed();
      return;
    }

    button.classList.remove("level-tile-pop");
    void button.offsetWidth;
    button.classList.add("level-tile-pop");

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(fallbackTimer);
      proceed();
    };

    const fallbackTimer = setTimeout(finish, LEVEL_POP_MS + 100);
    button.addEventListener(
      "animationend",
      (event) => {
        const name = String(event.animationName || "");
        if (!name.includes("level-tile-pop")) return;
        finish();
      },
      { once: true }
    );
  });
});

renderLevelCovers();

document.getElementById("backButton").addEventListener("click", () => {
  playSound(buttonSound);
  clearPopupTimers();
  hidePopup();
  showMain();
});

muteButton.addEventListener("click", () => {
  playSound(buttonSound);
  muted = !muted;
  localStorage.setItem("soundMuted", String(muted));
  muteButton.setAttribute("aria-pressed", String(muted));
  muteButtonMenu.setAttribute("aria-pressed", String(muted));
  updateMuteButtons();
});

muteButtonMenu.addEventListener("click", () => {
  playSound(buttonSound);
  muted = !muted;
  localStorage.setItem("soundMuted", String(muted));
  muteButton.setAttribute("aria-pressed", String(muted));
  muteButtonMenu.setAttribute("aria-pressed", String(muted));
  updateMuteButtons();
});

exitButton.addEventListener("click", () => {
  playSound(buttonSound);
  clearPopupTimers();
  hidePopup();
  showMain();
});

nextButton.addEventListener("click", () => {
  playSound(buttonSound);
  clearPopupTimers();
  hidePopup();
  const nextLevel = currentLevel < 4 ? currentLevel + 1 : 1;
  startLevel(nextLevel);
});

function startLevel(level) {
  currentLevel = level;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  matches = 0;
  clearPopupTimers();
  hidePopup();
  showGame();
  levelLabel.textContent = levels[level].title;
  buildBoard(level);
}

function showMain() {
  gameScreen.classList.remove("active");
  mainScreen.classList.add("active");
}

function showGame() {
  mainScreen.classList.remove("active");
  gameScreen.classList.add("active");
}
function getBoardAspect(pairs) {
  if (pairs === 6) return 4 / 3;
  if (pairs === 10) return 5 / 4;
  if (pairs === 12) return 6 / 4;
  return 1;
}
function getBoardAspectCss(pairs) {
  const aspect = getBoardAspect(pairs);
  if (aspect === 4 / 3) return "4 / 3";
  if (aspect === 5 / 4) return "5 / 4";
  if (aspect === 6 / 4) return "6 / 4";
  return "1 / 1";
}

function buildBoard(level) {
  const config = levels[level];
  const imagePaths = getImageSet(config);
  const cardValues = shuffle([...imagePaths, ...imagePaths]);
  const backImagePath = getAssetPath(config.imageBase, config.backImage);

  board.innerHTML = "";
  board.className = `board level-${level}`;
  const gridAspect = getBoardAspectCss(config.pairs);
  board.style.setProperty("--board-aspect", gridAspect);
  board.style.width = "";
  board.style.height = "";

  cardValues.forEach((value) => {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.dataset.value = value;
    const backFace = backImagePath
      ? `<span class="card-face card-back"><img alt="card back" src="${backImagePath}"></span>`
      : '<span class="card-face card-back"></span>';
    card.innerHTML = `
      <span class="card-inner">
        ${backFace}
        <span class="card-face card-front"><img alt="card image" src="${value}"></span>
      </span>
    `;
    card.addEventListener("click", handleCardClick);
    board.appendChild(card);
  });

  requestAnimationFrame(() => {
    const wrap = document.querySelector(".board-wrap");
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const margin = 28;
    const aspect = getBoardAspect(config.pairs);

    const computedStyle = window.getComputedStyle(wrap);
    const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const availableW = wrapRect.width - paddingX;
    const availableH = wrapRect.height - paddingY;

    let w = availableW - margin * 2;
    let h = w / aspect;
    if (h > availableH - margin * 2) {
      h = availableH - margin * 2;
      w = h * aspect;
    }

    board.style.width = `${Math.max(w, 0)}px`;
    board.style.height = `${Math.max(h, 0)}px`;
  });
}

function getImageSet(config) {
  if (config.images.length > 0) {
    return config.images.map((name) => getAssetPath(config.imageBase, name));
  }

  return Array.from({ length: config.pairs }, (_, index) => {
    const color = (index * 35) % 360;
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
        <rect width="100%" height="100%" fill="hsl(${color} 65% 55%)"/>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  });
}

function renderLevelCovers() {
  levelButtons.forEach((button) => {
    const level = Number(button.dataset.level);
    const config = levels[level];
    const coverPath = getAssetPath(config.imageBase, config.coverImage);
    button.setAttribute("aria-label", `${config.title} memory game`);
    button.classList.remove("with-cover", "level-button-placeholder");
    if (coverPath) {
      button.classList.add("with-cover");
      button.innerHTML = `<img alt="" src="${coverPath}">`;
      return;
    }
    button.classList.add("level-button-placeholder");
    button.innerHTML = "";
  });
}

function getAssetPath(basePath, fileName) {
  if (!basePath || !fileName) {
    return "";
  }
  return `${basePath}${encodeURIComponent(fileName)}`;
}

function shuffle(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function handleCardClick(event) {
  const card = event.currentTarget;
  if (card === firstCard || card.classList.contains("matched")) {
    return;
  }

  if (mismatchPending && mismatchedPair) {
    clearTimeout(mismatchTimer);
    mismatchedPair[0].classList.remove("flipped");
    mismatchedPair[1].classList.remove("flipped");
    mismatchPending = false;
    mismatchedPair = null;
    mismatchTimer = null;
    firstCard = null;
    secondCard = null;
    lockBoard = false;
  }

  if (lockBoard) {
    return;
  }

  card.classList.add("flipped");
  playSound(cardSound);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  checkForMatch();
}

function checkForMatch() {
  const isMatch = firstCard.dataset.value === secondCard.dataset.value;
  if (isMatch) {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    matches += 1;
    mismatchPending = false;
    mismatchedPair = null;
    mismatchTimer = null;
    resetTurn();
    if (matches === levels[currentLevel].pairs) {
      onLevelFinished();
    }
    return;
  }

  mismatchPending = true;
  mismatchedPair = [firstCard, secondCard];

  mismatchTimer = setTimeout(() => {
    if (mismatchPending && mismatchedPair) {
      mismatchPending = false;
      mismatchedPair[0].classList.remove("flipped");
      mismatchedPair[1].classList.remove("flipped");
      mismatchedPair = null;
      resetTurn();
    }
  }, 1500);
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  mismatchPending = false;
  mismatchedPair = null;
  mismatchTimer = null;
}

function onLevelFinished() {
  showPopup();

  if (currentLevel >= unlockedLevels && currentLevel < 4) {
    unlockedLevels = currentLevel + 1;
    localStorage.setItem("memoUnlockedLevels", String(unlockedLevels));
    updateLevelLocks();
  }

  const progressBar = nextButton.querySelector(".progress-bar");
  progressBar.style.transition = "none";
  progressBar.style.width = "0%";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      progressBar.style.transition = "width 4s linear";
      progressBar.style.width = "100%";
    });
  });

  nextTimer = setTimeout(() => {
    nextButton.click();
  }, 4000);
}

function showPopup() {
  finishPopup.classList.remove("hidden");
}

function hidePopup() {
  finishPopup.classList.add("hidden");
}

function clearPopupTimers() {
  if (nextTimer) {
    clearTimeout(nextTimer);
    nextTimer = null;
  }
  const progressBar = nextButton.querySelector(".progress-bar");
  if (progressBar) {
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
  }
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  if (!board.classList.contains("board") || !gameScreen.classList.contains("active")) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    const level = currentLevel;
    const config = levels[level];
    const wrap = document.querySelector(".board-wrap");
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(wrap);
    const paddingX = parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    const paddingY = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    const availableW = wrapRect.width - paddingX;
    const availableH = wrapRect.height - paddingY;
    const margin = 28;
    const aspect = getBoardAspect(config.pairs);

    let w = availableW - margin * 2;
    let h = w / aspect;
    if (h > availableH - margin * 2) {
      h = availableH - margin * 2;
      w = h * aspect;
    }

    board.style.width = `${Math.max(w, 0)}px`;
    board.style.height = `${Math.max(h, 0)}px`;
  }, 100);
});

if (typeof module !== 'undefined') {
  module.exports = { levels, shuffle, getAssetPath, getBoardAspect, getBoardAspectCss };
}
