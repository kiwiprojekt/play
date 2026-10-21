const levels = {
  1: {
    code: "01",
    title: "Transportation",
    pairs: 6,
    imageBase: "assets/01/",
    coverImage: "cover.webp",
    backImage: "back.webp",
    images: [
      "PNG image.webp",
      "PNG image 2.webp",
      "PNG image 3.webp",
      "PNG image 4.webp",
      "PNG image 5.webp",
      "PNG image 6.webp",
    ],
  },
  2: {
    code: "02",
    title: "Dinosaurs",
    pairs: 8,
    imageBase: "assets/02/",
    coverImage: "cover.webp",
    backImage: "back.webp",
    images: [
      "PNG image.webp",
      "PNG image 2.webp",
      "PNG image 3.webp",
      "PNG image 4.webp",
      "PNG image 5.webp",
      "PNG image 6.webp",
      "PNG image 7.webp",
      "PNG image 8.webp",
    ],
  },
  3: {
    code: "03",
    title: "Tools",
    pairs: 10,
    imageBase: "assets/03/",
    coverImage: "cover.webp",
    backImage: "back.webp",
    images: [
      "PNG image 2.webp",
      "PNG image 3.webp",
      "PNG image 4.webp",
      "PNG image 5.webp",
      "PNG image 6.webp",
      "PNG image 7.webp",
      "PNG image 8.webp",
      "PNG image 9.webp",
      "PNG image 10.webp",
      "PNG image 11.webp",
    ],
  },
  4: {
    code: "04",
    title: "African Animals",
    pairs: 12,
    imageBase: "assets/04/",
    coverImage: "cover.webp",
    backImage: "back.webp",
    images: [
      "PNG image.webp",
      "PNG image 2.webp",
      "PNG image 3.webp",
      "PNG image 4.webp",
      "PNG image 5.webp",
      "PNG image 6.webp",
      "PNG image 7.webp",
      "PNG image 8.webp",
      "PNG image 9.webp",
      "PNG image 10.webp",
      "PNG image 11.webp",
      "PNG image 12.webp",
    ],
  },
};

const memoRuntime =
  typeof module !== "undefined" ? require("../shared/play.js") : KiwiPlay;
const { shuffle } = memoRuntime;
const mainScreen = document.getElementById("mainScreen");
const gameScreen = document.getElementById("gameScreen");
const board = document.getElementById("board");
const levelLabel = document.getElementById("levelLabel");
const finishPopup = document.getElementById("finishPopup");
const progress = document.getElementById("matchProgress");
let currentLevel = 1;
let pairChoice = "all";
let pairCount = 3;
let firstCard = null;
let secondCard = null;
let matches = 0;
let mismatchTimer = null;
let layoutFrame = null;

function getAssetPath(base, file) {
  return base && file ? base + encodeURIComponent(file) : "";
}

function resetTurn() {
  clearTimeout(mismatchTimer);
  mismatchTimer = null;
  firstCard = null;
  secondCard = null;
}

function showMain() {
  resetTurn();
  finishPopup.close();
  gameScreen.classList.remove("active");
  mainScreen.classList.add("active");
  document.querySelector(`[data-level="${currentLevel}"]`)?.focus();
}

function startLevel(level) {
  resetTurn();
  memoRuntime.effect("assets/stoneHit4.ogg");
  currentLevel = level;
  matches = 0;
  pairCount =
    pairChoice === "all"
      ? levels[level].pairs
      : Math.min(Number(pairChoice), levels[level].pairs);
  finishPopup.close();
  mainScreen.classList.remove("active");
  gameScreen.classList.add("active");
  levelLabel.textContent = levels[level].title;
  updateProgress();
  buildBoard();
  document.getElementById("backButton").focus();
}

function updateProgress() {
  if (progress) progress.textContent = `${matches} / ${pairCount}`;
}

function buildBoard() {
  const config = levels[currentLevel];
  const selected = shuffle(config.images).slice(0, pairCount);
  const cards = shuffle([...selected, ...selected]);
  const fragment = document.createDocumentFragment();
  cards.forEach((value, index) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";
    card.dataset.value = value;
    card.dataset.picture = `${config.title} picture ${config.images.indexOf(value) + 1}`;
    card.setAttribute("aria-label", `Card ${index + 1}. Turn over`);
    card.innerHTML = `<span class="card-inner" aria-hidden="true">
      <span class="card-face card-back"><img alt="" draggable="false" src="${getAssetPath(config.imageBase, config.backImage)}"></span>
      <span class="card-face card-front"><img alt="" draggable="false" src="${getAssetPath(config.imageBase, value)}"></span>
    </span>`;
    fragment.append(card);
  });
  board.replaceChildren(fragment);
  resizeBoard();
}

// Keep the original compact grids: 4×3 for transport, 4×4, 5×4, and 6×4.
// Portrait uses the transposed grid. Card size then fits both actual bounds.
function getBoardLayout(count, width, height, gap) {
  const landscape = width >= height;
  width = Math.min(width, 1100);
  let columns = Math.ceil(Math.sqrt(count));
  while (count % columns !== 0) columns++;
  if (!landscape) columns = count / columns;
  const rows = count / columns;
  const size = Math.max(
    0,
    Math.min(
      (width - gap * (columns - 1)) / columns,
      (height - gap * (rows - 1)) / rows,
    ),
  );
  return { columns, rows, size };
}

function resizeBoard() {
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => {
    const wrap = document.querySelector(".board-wrap");
    if (!wrap || !gameScreen.classList.contains("active")) return;
    const gap = parseFloat(getComputedStyle(board).gap) || 10;
    const { columns, size } = getBoardLayout(
      pairCount * 2,
      wrap.clientWidth,
      Math.max(0, wrap.clientHeight - 32),
      gap,
    );
    board.style.setProperty("--columns", columns);
    board.style.width = `${Math.max(0, size * columns + gap * (columns - 1))}px`;
  });
}

function hideMismatch() {
  [firstCard, secondCard].forEach((item) => {
    item.classList.remove("flipped");
    item.setAttribute(
      "aria-label",
      `Card ${Array.from(board.children).indexOf(item) + 1}. Turn over`,
    );
  });
  resetTurn();
}

function handleCardClick(event) {
  const card = event.target.closest(".card");
  if (!card || card === firstCard || card === secondCard || card.disabled)
    return;
  if (mismatchTimer) hideMismatch();
  card.classList.add("flipped");
  card.setAttribute("aria-label", card.dataset.picture);
  memoRuntime.effect("assets/rockHit1.ogg");
  if (!firstCard) {
    firstCard = card;
    return;
  }
  secondCard = card;
  if (firstCard.dataset.value === secondCard.dataset.value) {
    [firstCard, secondCard].forEach((item) => {
      item.classList.add("matched");
      item.disabled = true;
      item.setAttribute("aria-label", `${item.dataset.picture}. Matched`);
    });
    matches++;
    resetTurn();
    updateProgress();
    memoRuntime.tone(true);
    memoRuntime.celebrate(card);
    if (matches === pairCount) finishPopup.showModal();
    return;
  }
  mismatchTimer = setTimeout(hideMismatch, 1200);
}

board.addEventListener("click", handleCardClick);
document.querySelectorAll(".level-button").forEach((button) => {
  const level = Number(button.dataset.level);
  const config = levels[level];
  button.setAttribute("aria-label", `${config.title} memory game`);
  button.innerHTML = `<img src="${getAssetPath(config.imageBase, config.coverImage)}" alt="" width="640" height="400"><span>${config.title}</span>`;
  button.addEventListener("click", () => startLevel(level));
});
document.querySelectorAll("[data-pairs]").forEach((button) => {
  button.addEventListener("click", () => {
    pairChoice = button.dataset.pairs;
    document
      .querySelectorAll("[data-pairs]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
  });
});
document.getElementById("backButton").addEventListener("click", showMain);
document.getElementById("exitButton").addEventListener("click", showMain);
document
  .getElementById("nextButton")
  .addEventListener("click", () =>
    startLevel(currentLevel < 4 ? currentLevel + 1 : 1),
  );
document
  .getElementById("replayButton")
  .addEventListener("click", () => startLevel(currentLevel));
finishPopup.addEventListener("cancel", showMain);
window.addEventListener("resize", resizeBoard);
if (typeof ResizeObserver !== "undefined") {
  new ResizeObserver(resizeBoard).observe(
    document.querySelector(".board-wrap"),
  );
}
window.addEventListener("pagehide", () => {
  [firstCard, secondCard].filter(Boolean).forEach((card) => {
    card.classList.remove("flipped");
    card.setAttribute("aria-label", `Card ${Array.from(board.children).indexOf(card) + 1}. Turn over`);
  });
  resetTurn();
});

if (typeof module !== "undefined")
  module.exports = {
    levels,
    shuffle,
    getAssetPath,
    getBoardLayout,
    startLevel,
    showMain,
  };
