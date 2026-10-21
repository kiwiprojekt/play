/** @jest-environment jsdom */
const fs = require("fs");
const path = require("path");
const MazeGenerator = require("../space-maze/js/mazeGenerator.js");
const { MazeRun, DIRECTIONS } = require("../space-maze/js/run.js");
let renderer;

beforeAll(() => {
  document.body.innerHTML = fs
    .readFileSync(path.join(__dirname, "../space-maze/index.html"), "utf8")
    .split("<body>")[1]
    .split("</body>")[0];
  global.KiwiPlay = require("../shared/play.js");
  global.MazeConfig = require("../space-maze/js/config.js");
  global.MazeGenerator = MazeGenerator;
  global.MazeRun = MazeRun;
  // The browser checks exercise canvas rendering. These tests isolate navigation/state.
  global.MazeRenderer = class {
    constructor() {
      renderer = this;
    }
    cancel() {}
    resize() {}
    setRun(run) {
      this.run = run;
    }
    animate(from, done) {
      done();
    }
  };
  require("../space-maze/js/main.js");
});

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  document.getElementById("backButton").click();
});

afterEach(() => {
  document.getElementById("backButton").click();
  jest.clearAllTimers();
  jest.useRealTimers();
});

function completeCurrentMaze() {
  const run = renderer.run;
  const pending = [{ x: 0, y: 0, steps: [] }];
  const seen = new Set(["0,0"]);
  while (pending.length) {
    const current = pending.shift();
    if (current.x === run.cols - 1 && current.y === run.rows - 1) {
      current.steps.forEach((direction) =>
        document.querySelector(`[data-direction="${direction}"]`).click(),
      );
      return;
    }
    for (const [direction, step] of Object.entries(DIRECTIONS)) {
      if (run.grid[current.y][current.x].walls[direction]) continue;
      const x = current.x + step.x,
        y = current.y + step.y;
      if (!seen.has(`${x},${y}`)) {
        seen.add(`${x},${y}`);
        pending.push({ x, y, steps: [...current.steps, direction] });
      }
    }
  }
  throw new Error("No path to goal");
}

it("finishing maze 1 offers maze 2 without skipping a level", () => {
  document.querySelector('[data-level="1"]').click();
  completeCurrentMaze();
  expect(document.getElementById("finishPopup").open).toBe(true);
  document.getElementById("nextButton").click();
  expect(document.getElementById("levelLabel").textContent).toBe("2 · Sirius");
  expect(renderer.run.position).toEqual({ x: 0, y: 0 });
  expect(document.getElementById("finishPopup").open).toBe(false);
});
it("all 20 mazes remain available and the final maze can be replayed", () => {
  document.getElementById("backButton").click();
  expect(document.querySelectorAll(".star-level")).toHaveLength(20);
  document.querySelector('[data-level="20"]').click();
  completeCurrentMaze();
  expect(document.getElementById("nextButton").textContent).toBe("↻");
  document.getElementById("nextButton").click();
  expect(document.getElementById("levelLabel").textContent).toBe("20 · Castor");
});

it("records only the mazes actually completed when levels are played out of order", () => {
  document.querySelector('[data-level="1"]').click();
  completeCurrentMaze();
  document.getElementById("backButton").click();
  document.querySelector('[data-level="20"]').click();
  completeCurrentMaze();
  expect(
    JSON.parse(localStorage.getItem("spaceMazeCompletedLevels")).sort(
      (a, b) => a - b,
    ),
  ).toEqual([1, 20]);
  document.getElementById("backButton").click();
  expect(document.querySelectorAll(".completed")).toHaveLength(2);
});

it("migrates progress from the older sequential unlock model", () => {
  localStorage.setItem("spaceMazeCompleted", "3");
  document.getElementById("backButton").click();
  expect(document.querySelectorAll(".completed")).toHaveLength(3);
  document.querySelector('[data-level="5"]').click();
  completeCurrentMaze();
  expect(JSON.parse(localStorage.getItem("spaceMazeCompletedLevels"))).toEqual([
    1, 2, 3, 5,
  ]);
});

it("invalid saved progress cannot block the menu", () => {
  localStorage.setItem("spaceMazeCompletedLevels", "broken");
  document.getElementById("backButton").click();
  expect(document.querySelectorAll(".completed")).toHaveLength(0);
  expect(document.querySelectorAll(".star-level")).toHaveLength(20);
});

it("resumes a move interrupted by browser navigation", () => {
  document.querySelector('[data-level="1"]').click();
  let pending;
  renderer.animate = (from, done) => { pending = done; };
  const direction = Object.keys(DIRECTIONS).find((key) => renderer.run.canMove(key));
  document.querySelector(`[data-direction="${direction}"]`).click();
  expect(pending).toBeDefined();
  const moved = { ...renderer.run.position };
  window.dispatchEvent(new Event("pagehide"));
  const restored = new Event("pageshow");
  Object.defineProperty(restored, "persisted", { value: true });
  window.dispatchEvent(restored);
  expect(renderer.run.position).toEqual(moved);
  const back = { top: "bottom", bottom: "top", left: "right", right: "left" }[direction];
  renderer.animate = (from, done) => done();
  document.querySelector(`[data-direction="${back}"]`).click();
  expect(renderer.run.position).toEqual({ x: 0, y: 0 });
});

it("returns focus to the maze after an on-screen arrow and accepts the next keyboard move", () => {
  document.querySelector('[data-level="1"]').click();
  const direction = Object.keys(DIRECTIONS).find((key) => renderer.run.canMove(key));
  const arrow = document.querySelector(`[data-direction="${direction}"]`);
  arrow.focus();
  arrow.click();
  const canvas = document.getElementById("maze");
  expect(document.activeElement).toBe(canvas);
  const reverse = { top: "ArrowDown", bottom: "ArrowUp", left: "ArrowRight", right: "ArrowLeft" }[direction];
  document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: reverse, bubbles: true, cancelable: true }));
  expect(renderer.run.position).toEqual({ x: 0, y: 0 });
});

it("accepts movement while another game control has focus without intercepting browser shortcuts", () => {
  document.querySelector('[data-level="1"]').click();
  const direction = Object.keys(DIRECTIONS).find((key) => renderer.run.canMove(key));
  const key = { top: "ArrowUp", bottom: "ArrowDown", left: "ArrowLeft", right: "ArrowRight" }[direction];
  const control = document.querySelector('#gameScreen [data-sound]');
  control.focus();
  const shortcut = new KeyboardEvent("keydown", { key, ctrlKey: true, bubbles: true, cancelable: true });
  control.dispatchEvent(shortcut);
  expect(shortcut.defaultPrevented).toBe(false);
  expect(renderer.run.position).toEqual({ x: 0, y: 0 });
  control.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  expect(renderer.run.position).toEqual({ x: DIRECTIONS[direction].x, y: DIRECTIONS[direction].y });
});

it("does not move behind the menu or a completion dialog", () => {
  document.querySelector('[data-level="1"]').click();
  const key = renderer.run.canMove("right") ? "ArrowRight" : "ArrowDown";
  document.getElementById("finishPopup").showModal();
  document.getElementById("maze").dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  expect(renderer.run.position).toEqual({ x: 0, y: 0 });
  document.getElementById("backButton").click();
  document.getElementById("maze").dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
  expect(renderer.run.position).toEqual({ x: 0, y: 0 });
});

it("automatically advances from maze 1 to maze 2 after exactly four seconds", () => {
  document.querySelector('[data-level="1"]').click();
  completeCurrentMaze();
  jest.advanceTimersByTime(3999);
  expect(document.getElementById("finishPopup").open).toBe(true);
  jest.advanceTimersByTime(1);
  expect(document.getElementById("levelLabel").textContent).toBe("2 · Sirius");
  expect(document.getElementById("finishPopup").open).toBe(false);
});

it("manual next cannot make a later maze skip its own countdown", () => {
  document.querySelector('[data-level="1"]').click();
  completeCurrentMaze();
  jest.advanceTimersByTime(2000);
  document.getElementById("nextButton").click();
  completeCurrentMaze();
  jest.advanceTimersByTime(2000);
  expect(document.getElementById("levelLabel").textContent).toBe("2 · Sirius");
  expect(document.getElementById("finishPopup").open).toBe(true);
  jest.advanceTimersByTime(2000);
  expect(document.getElementById("levelLabel").textContent).toBe("3 · Vega");
});

it("menu return cancels auto-advance and the final maze waits for replay", () => {
  document.querySelector('[data-level="1"]').click();
  completeCurrentMaze();
  document.getElementById("exitButton").click();
  jest.advanceTimersByTime(5000);
  expect(document.getElementById("mainMenu").hidden).toBe(false);
  document.querySelector('[data-level="20"]').click();
  completeCurrentMaze();
  jest.advanceTimersByTime(10000);
  expect(document.getElementById("finishPopup").open).toBe(true);
  expect(document.getElementById("levelLabel").textContent).toBe("20 · Castor");
});

it("suspends a completion countdown when leaving and restarts it on browser return", () => {
  document.querySelector('[data-level="1"]').click();
  completeCurrentMaze();
  jest.advanceTimersByTime(1000);
  window.dispatchEvent(new Event("pagehide"));
  jest.advanceTimersByTime(10000);
  expect(document.getElementById("levelLabel").textContent).toBe("1 · Proxima");
  const restored = new Event("pageshow");
  Object.defineProperty(restored, "persisted", { value: true });
  window.dispatchEvent(restored);
  jest.advanceTimersByTime(4000);
  expect(document.getElementById("levelLabel").textContent).toBe("2 · Sirius");
});
