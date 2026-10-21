const mazeMenu = document.getElementById("mainMenu");
const mazeScreen = document.getElementById("gameScreen");
const mazeCanvas = document.getElementById("maze");
const mazeDialog = document.getElementById("finishPopup");
const mazeRenderer = new MazeRenderer(mazeCanvas);
let mazeRun = null;
let mazeLevel = 1;
let moving = false;
let pointerStart = null;
let resizeFrame = null;
let nextMazeTimer = null;

function cancelNextMaze() {
  clearTimeout(nextMazeTimer);
  nextMazeTimer = null;
  mazeDialog.removeAttribute("data-auto-advance");
}

function scheduleNextMaze() {
  cancelNextMaze();
  if (mazeLevel === MazeConfig.sizes.length) return;
  mazeDialog.setAttribute("data-auto-advance", "");
  nextMazeTimer = setTimeout(() => {
    if (mazeDialog.open) document.getElementById("nextButton").click();
  }, 4000);
}

function startMaze(level) {
  cancelNextMaze();
  mazeRenderer.cancel();
  mazeLevel = level;
  moving = false;
  pointerStart = null;
  const [cols, rows] = MazeConfig.sizes[level - 1];
  mazeRun = new MazeRun(new MazeGenerator(cols, rows).generate());
  mazeDialog.close();
  mazeMenu.hidden = true;
  mazeScreen.hidden = false;
  document.getElementById("levelLabel").textContent =
    `${level} · ${MazeConfig.names[level - 1]}`;
  mazeRenderer.setRun(mazeRun);
  updateDirections();
  mazeCanvas.focus();
}

function showMazeMenu() {
  cancelNextMaze();
  mazeRenderer.cancel();
  moving = false;
  pointerStart = null;
  mazeDialog.close();
  mazeScreen.hidden = true;
  mazeMenu.hidden = false;
  renderMazeLevels();
  document.querySelector(`[data-level="${mazeLevel}"]`)?.focus();
}

function moveShip(direction) {
  if (!mazeRun || moving || mazeScreen.hidden || mazeDialog.open) return;
  const from = { ...mazeRun.position };
  if (!mazeRun.move(direction)) return;
  moving = true;
  KiwiPlay.effect("assets/rumble2.ogg");
  mazeRenderer.animate(from, () => {
    moving = false;
    updateDirections();
    if (mazeRun.complete) finishMaze();
  });
}

function updateDirections() {
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.disabled = !mazeRun.canMove(button.dataset.direction);
  });
  const { x, y } = mazeRun.position;
  document.getElementById("positionStatus").textContent =
    KiwiPlay.language === "pl"
      ? `Rakieta: wiersz ${y + 1}, kolumna ${x + 1}. Gwiazda: wiersz ${mazeRun.rows}, kolumna ${mazeRun.cols}.`
      : `Rocket: row ${y + 1}, column ${x + 1}. Star: row ${mazeRun.rows}, column ${mazeRun.cols}.`;
}

function completedMazes() {
  const saved = KiwiPlay.storage.get("spaceMazeCompletedLevels");
  if (saved !== null) {
    try {
      const levels = JSON.parse(saved);
      return new Set(
        Array.isArray(levels)
          ? levels.filter(
              (level) => Number.isInteger(level) && level >= 1 && level <= 20,
            )
          : [],
      );
    } catch (_) {
      return new Set();
    }
  }
  // Older versions unlocked levels in order, so their frontier represents every earlier maze.
  const frontier = Math.max(
    0,
    Math.min(20, Number(KiwiPlay.storage.get("spaceMazeCompleted", "0")) || 0),
  );
  return new Set(Array.from({ length: frontier }, (_, index) => index + 1));
}

function finishMaze() {
  const completed = completedMazes();
  completed.add(mazeLevel);
  KiwiPlay.storage.set(
    "spaceMazeCompletedLevels",
    JSON.stringify([...completed]),
  );
  document.getElementById("nextButton").textContent =
    mazeLevel < 20 ? "→" : "↻";
  document
    .getElementById("nextButton")
    .setAttribute("aria-label", KiwiPlay.t(mazeLevel < 20 ? "Next maze" : "Play again"));
  KiwiPlay.effect("assets/laser3.ogg");
  KiwiPlay.celebrate(mazeCanvas);
  mazeDialog.showModal();
  scheduleNextMaze();
}

function renderMazeLevels() {
  const completed = completedMazes();
  const fragment = document.createDocumentFragment();
  MazeConfig.names.forEach((name, index) => {
    const button = document.createElement("button");
    button.className = "star-level";
    button.dataset.level = index + 1;
    button.setAttribute(
      "aria-label",
      `${KiwiPlay.t("Level")} ${index + 1}: ${name}${completed.has(index + 1) ? ". " + KiwiPlay.t("Completed") : ""}`,
    );
    button.innerHTML = `<span aria-hidden="true" class="star-symbol"></span><span class="star-number">${index + 1}</span>${completed.has(index + 1) ? '<span class="completed" aria-hidden="true">✓</span>' : ""}`;
    button.addEventListener("click", () => startMaze(index + 1));
    fragment.append(button);
  });
  document.getElementById("levels").replaceChildren(fragment);
}

document
  .querySelectorAll("[data-direction]")
  .forEach((button) =>
    button.addEventListener("click", () => {
      moveShip(button.dataset.direction);
      mazeCanvas.focus({ preventScroll: true });
    }),
  );
document.getElementById("backButton").addEventListener("click", showMazeMenu);
document.getElementById("exitButton").addEventListener("click", showMazeMenu);
document
  .getElementById("nextButton")
  .addEventListener("click", () =>
    startMaze(mazeLevel < 20 ? mazeLevel + 1 : mazeLevel),
  );
mazeDialog.addEventListener("cancel", showMazeMenu);
const mazeKeys = {
  ArrowUp: "top",
  ArrowDown: "bottom",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "top",
  s: "bottom",
  a: "left",
  d: "right",
};
mazeScreen.addEventListener("keydown", (event) => {
  if (
    mazeScreen.hidden || mazeDialog.open ||
    event.altKey || event.ctrlKey || event.metaKey
  ) return;
  if (mazeKeys[event.key]) {
    event.preventDefault();
    moveShip(mazeKeys[event.key]);
  }
});
mazeCanvas.addEventListener("pointerdown", (event) => {
  if (moving) return;
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  mazeCanvas.setPointerCapture(event.pointerId);
});
mazeCanvas.addEventListener("pointerup", (event) => {
  if (!pointerStart || event.pointerId !== pointerStart.id) return;
  const dx = event.clientX - pointerStart.x,
    dy = event.clientY - pointerStart.y;
  pointerStart = null;
  if (Math.hypot(dx, dy) > 18) {
    moveShip(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "bottom"
          : "top",
    );
    return;
  }
  const cell = mazeRenderer.cellAt(event.clientX, event.clientY);
  const x = cell.x - mazeRun.position.x,
    y = cell.y - mazeRun.position.y;
  if (Math.abs(x) + Math.abs(y) === 1)
    moveShip(x ? (x > 0 ? "right" : "left") : y > 0 ? "bottom" : "top");
});
mazeCanvas.addEventListener("pointercancel", () => {
  pointerStart = null;
});
window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (!mazeScreen.hidden) mazeRenderer.resize();
  });
});
window.addEventListener("pagehide", () => {
  cancelNextMaze();
  mazeRenderer.cancel();
  moving = false;
  pointerStart = null;
});
window.addEventListener("pageshow", (event) => {
  if (!event.persisted || !mazeRun || mazeScreen.hidden) return;
  mazeRenderer.resize();
  updateDirections();
  if (mazeRun.complete && !mazeDialog.open) finishMaze();
  else if (mazeDialog.open) scheduleNextMaze();
});
renderMazeLevels();
