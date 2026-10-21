const letterSettings =
  typeof module !== "undefined" ? require("./settings.js") : LetterSettings;
const letterData =
  typeof module !== "undefined" ? require("./letters.js") : LetterData;
const letterRuntime =
  typeof module !== "undefined" ? require("../shared/play.js") : KiwiPlay;
const {
  LETTERS,
  LETTERS_PL,
  ALL_LETTERS,
  ALL_LOWERCASE,
  ALL_PL_LETTERS,
  ALL_PL_LOWERCASE,
  LEVEL_ORDER,
  ROUNDS_PER_GAME,
} = letterData;
const mainMenu = document.getElementById("mainMenu");
const gameScreen = document.getElementById("gameScreen");
const targetEl = document.getElementById("target");
const cardsEl = document.getElementById("cards");
const scoreEl = document.getElementById("score");
const progressEl = document.getElementById("progress");
const popup = document.getElementById("popup");
let currentLevel = "easy";
let isInfinite = false;
let score = 0;
let isProcessing = false;
let usedBaseLetters = new Set();
let lastTargetBase = null;
let roundTimer = null;
let speechTimer = null;
let wrongTimers = new Set();

function isHandwritten(
  isUpper,
  level = currentLevel,
  infinite = isInfinite,
  mode = letterSettings.getFontMode(),
) {
  if (mode === "serif") return false;
  if (mode === "hand") return true;
  return (
    level === "fun" ||
    level === "mixed" ||
    ((level === "wild" || infinite) && !isUpper)
  );
}

function getAvailableLetters() {
  const polish = letterSettings.getLanguage() === "pl";
  if (isInfinite)
    return polish
      ? [...ALL_PL_LETTERS, ...ALL_PL_LOWERCASE]
      : [...ALL_LETTERS, ...ALL_LOWERCASE];
  const letters = polish ? LETTERS_PL : LETTERS;
  if (currentLevel === "medium") return [...letters.easy, ...letters.medium];
  if (currentLevel === "hard")
    return [...letters.easy, ...letters.medium, ...letters.hard];
  return letters[currentLevel] || letters.easy;
}

function getCardCount() {
  if (isInfinite) return Math.floor(Math.random() * 4) + 3;
  return (
    { easy: 3, medium: 4, hard: 5, fun: 4, mixed: 5, wild: 6 }[currentLevel] ||
    3
  );
}

function applyFontClasses() {
  if (!targetEl || !cardsEl) return;
  [targetEl, ...cardsEl.children].forEach((element) => {
    const handwritten = isHandwritten(
      element.textContent === element.textContent.toUpperCase(),
    );
    element.classList.toggle(
      element === targetEl ? "handwritten-target" : "handwritten-card",
      handwritten,
    );
  });
}

function cancelRound() {
  clearTimeout(roundTimer);
  clearTimeout(speechTimer);
  wrongTimers.forEach(clearTimeout);
  wrongTimers.clear();
  window.speechSynthesis?.cancel();
  isProcessing = false;
}

function generateRound() {
  const restoreFocus = cardsEl?.contains(document.activeElement);
  cancelRound();
  const letters = getAvailableLetters();
  let pool = letters.filter(
    (letter) => !usedBaseLetters.has(letter.toUpperCase()),
  );
  if (!pool.length) {
    usedBaseLetters.clear();
    pool = letters.filter((letter) => letter.toUpperCase() !== lastTargetBase);
  }
  const target = pool[Math.floor(Math.random() * pool.length)];
  lastTargetBase = target.toUpperCase();
  usedBaseLetters.add(lastTargetBase);
  const upper = target === target.toUpperCase();
  const answer = upper ? target.toLowerCase() : target.toUpperCase();
  // One case per answer row, and one card per letter. No duplicate-looking choices.
  const candidates = [
    ...new Set(
      letters.map((letter) =>
        upper ? letter.toLowerCase() : letter.toUpperCase(),
      ),
    ),
  ].filter((letter) => letter !== answer);
  const choices = letterRuntime.shuffle([
    answer,
    ...letterRuntime.shuffle(candidates).slice(0, getCardCount() - 1),
  ]);
  if (targetEl) {
    targetEl.textContent = target;
    targetEl.setAttribute("aria-label", `${letterRuntime.t("Hear letter")} ${target}`);
  }
  if (cardsEl) {
    const fragment = document.createDocumentFragment();
    choices.forEach((letter) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "answer-card";
      card.textContent = letter;
      card.addEventListener("click", () =>
        handleCardClick(card, letter === answer),
      );
      fragment.append(card);
    });
    cardsEl.replaceChildren(fragment);
    cardsEl.style.setProperty("--choices", choices.length);
  }
  applyFontClasses();
  if (restoreFocus) targetEl.focus({ preventScroll: true });
  if (document.body.classList.contains("in-game"))
    speechTimer = setTimeout(() => speakLetter(target), 180);
}

function handleCardClick(card, correct) {
  if (isProcessing) return;
  if (!correct) {
    card.classList.add("wrong");
    document.getElementById("roundHint").textContent =
      letterRuntime.t("Have another look. You can do it!");
    const timer = setTimeout(() => {
      card.classList.remove("wrong");
      wrongTimers.delete(timer);
    }, 400);
    wrongTimers.add(timer);
    return;
  }
  isProcessing = true;
  card.classList.add("correct");
  card.setAttribute("aria-label", `${card.textContent}. ${letterRuntime.t("A match!")}`);
  letterRuntime.tone(true);
  letterRuntime.celebrate(card);
  score++;
  if (scoreEl) scoreEl.textContent = score;
  if (progressEl)
    progressEl.style.width = `${(score / ROUNDS_PER_GAME) * 100}%`;
  document.getElementById("roundHint").textContent = letterRuntime.t("A match!");
  roundTimer = setTimeout(() => {
    if (!isInfinite && score >= ROUNDS_PER_GAME) {
      document.getElementById("popupScore").textContent =
        `${score} / ${ROUNDS_PER_GAME}`;
      popup.showModal();
    } else {
      document.getElementById("roundHint").textContent =
        letterRuntime.t("Find the matching letter");
      generateRound();
    }
  }, 750);
}

function startGame(level) {
  cancelRound();
  currentLevel = level;
  isInfinite = level === "infinite";
  score = 0;
  usedBaseLetters.clear();
  lastTargetBase = null;
  if (scoreEl) scoreEl.textContent = "0";
  if (progressEl) progressEl.style.width = "0%";
  popup.close();
  document.querySelector(".in-game-style").open = false;
  mainMenu.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameScreen.classList.toggle("infinite-mode", isInfinite);
  document.body.classList.add("in-game");
  document.getElementById("roundHint").textContent = letterRuntime.t("Find the matching letter");
  generateRound();
  targetEl.focus();
}

function showMenu() {
  cancelRound();
  popup.close();
  gameScreen.classList.add("hidden");
  mainMenu.classList.remove("hidden");
  document.body.classList.remove("in-game");
  document.querySelector(`[data-level="${currentLevel}"]`)?.focus();
}

let voices = [];
function loadVoices() {
  voices = window.speechSynthesis?.getVoices() || [];
}
loadVoices();
window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
function speakLetter(letter) {
  if (
    !window.speechSynthesis ||
    letterSettings.getMute() ||
    !letter ||
    document.hidden
  )
    return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
    utterance.lang = letterSettings.getLanguage() === "pl" ? "pl-PL" : "en-US";
    utterance.rate = 0.8;
    const voice = voices.find((item) =>
      item.lang.toLowerCase().startsWith(utterance.lang.slice(0, 2)),
    );
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    /* Matching works without a speech voice. */
  }
}

function updateFontUI() {
  const mode = letterSettings.getFontMode();
  document.querySelectorAll("[data-font]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.font === mode));
  });
  document.querySelectorAll(".level-card[data-level]").forEach((card) => {
    const preview = card.querySelector(".level-example");
    if (!preview) return;
    preview.replaceChildren(
      ...[...preview.textContent].map((letter) => {
        const span = document.createElement("span");
        span.textContent = letter;
        span.classList.toggle(
          "hand",
          isHandwritten(
            letter === letter.toUpperCase(),
            card.dataset.level,
            false,
            mode,
          ),
        );
        return span;
      }),
    );
    preview.classList.remove("hand");
  });
  applyFontClasses();
}

document
  .querySelectorAll(".level-card")
  .forEach((card) =>
    card.addEventListener("click", () => startGame(card.dataset.level)),
  );
document.getElementById("backBtn")?.addEventListener("click", showMenu);
document.getElementById("popupBack")?.addEventListener("click", showMenu);
document.getElementById("popupNext")?.addEventListener("click", () => {
  const index = LEVEL_ORDER.indexOf(currentLevel);
  startGame(LEVEL_ORDER[Math.min(index + 1, LEVEL_ORDER.length - 1)]);
});
targetEl?.addEventListener("click", () => speakLetter(targetEl.textContent));
document.querySelectorAll("[data-font]").forEach((button) => {
  button.addEventListener("click", () => {
    letterSettings.setFontMode(button.dataset.font);
    updateFontUI();
  });
});
document.querySelectorAll(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    letterSettings.setLanguage(button.dataset.lang);
    updateLanguages();
  });
});
function updateLanguages() {
  const language = letterSettings.getLanguage();
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.lang === language),
    );
  });
  document.querySelectorAll(".level-card[data-level]").forEach((card) => {
    const index = LEVEL_ORDER.indexOf(card.dataset.level);
    card.setAttribute("aria-label", card.dataset.level === "infinite"
      ? letterRuntime.t("Endless mode") : `${letterRuntime.t("Level")} ${index + 1}`);
    const preview = card.querySelector(".level-example");
    if (preview)
      preview.textContent =
        letterData.LEVEL_PREVIEWS[language][card.dataset.level];
  });
  usedBaseLetters.clear();
  lastTargetBase = null;
  updateFontUI();
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) window.speechSynthesis?.cancel();
});
window.addEventListener("pagehide", cancelRound);
window.addEventListener("pageshow", (event) => {
  if (!event.persisted || !document.body.classList.contains("in-game") || popup.open) return;
  if (!isInfinite && score >= ROUNDS_PER_GAME) {
    document.getElementById("popupScore").textContent = `${score} / ${ROUNDS_PER_GAME}`;
    popup.showModal();
  } else generateRound();
});
popup?.addEventListener("cancel", showMenu);
updateLanguages();
document.getElementById("roundTotal").textContent = ROUNDS_PER_GAME;

if (typeof module !== "undefined")
  module.exports = {
    ...letterData,
    getAvailableLetters,
    getCardCount,
    generateRound,
    isHandwritten,
    applyFontClasses,
    updateFontUI,
    startGame,
    showMenu,
    _setState(state) {
      if ("currentLevel" in state) currentLevel = state.currentLevel;
      if ("isInfinite" in state) isInfinite = state.isInfinite;
      if ("usedBaseLetters" in state)
        usedBaseLetters = new Set(state.usedBaseLetters);
      if ("lastTargetBase" in state) lastTargetBase = state.lastTargetBase;
    },
    _getState() {
      return {
        usedBaseLetters: new Set(usedBaseLetters),
        lastTargetBase,
        score,
        isProcessing,
      };
    },
  };
