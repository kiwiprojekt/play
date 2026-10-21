/**
 * @jest-environment jsdom
 */
"use strict";

// Minimal DOM required by memo/script.js at load time
const MEMO_HTML = require("fs")
  .readFileSync(require("path").join(__dirname, "../memo/index.html"), "utf8")
  .split("<body>")[1]
  .split("</body>")[0];

let memo;

beforeAll(() => {
  document.body.innerHTML = MEMO_HTML;

  // Mock Audio (not supported in jsdom)
  global.Audio = jest.fn().mockImplementation(() => ({
    currentTime: 0,
    play: jest.fn().mockResolvedValue(undefined),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
    })),
  });

  jest.resetModules();
  memo = require("../memo/script.js");
});

// ─── levels config ────────────────────────────────────────────────────────

describe("levels config", () => {
  it("has 4 levels", () => {
    expect(Object.keys(memo.levels)).toHaveLength(4);
  });

  it("level 1 has 6 pairs", () => expect(memo.levels[1].pairs).toBe(6));
  it("level 2 has 8 pairs", () => expect(memo.levels[2].pairs).toBe(8));
  it("level 3 has 10 pairs", () => expect(memo.levels[3].pairs).toBe(10));
  it("level 4 has 12 pairs", () => expect(memo.levels[4].pairs).toBe(12));

  it("each level has required fields", () => {
    Object.values(memo.levels).forEach((lvl) => {
      expect(lvl).toHaveProperty("pairs");
      expect(lvl).toHaveProperty("images");
      expect(lvl).toHaveProperty("imageBase");
      expect(lvl).toHaveProperty("coverImage");
      expect(lvl).toHaveProperty("backImage");
    });
  });

  it("each level has the correct number of images", () => {
    Object.values(memo.levels).forEach((lvl) => {
      expect(lvl.images).toHaveLength(lvl.pairs);
    });
  });
});

// ─── shuffle() ────────────────────────────────────────────────────────────

describe("shuffle()", () => {
  it("returns an array of the same length", () => {
    expect(memo.shuffle([1, 2, 3, 4])).toHaveLength(4);
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    memo.shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it("contains the same elements (different order may occur)", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(memo.shuffle(arr).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("handles an empty array", () => {
    expect(memo.shuffle([])).toEqual([]);
  });

  it("handles a single-element array", () => {
    expect(memo.shuffle([42])).toEqual([42]);
  });
});

// ─── getAssetPath() ───────────────────────────────────────────────────────

describe("getAssetPath()", () => {
  it('returns "" when base is empty', () => {
    expect(memo.getAssetPath("", "file.png")).toBe("");
  });

  it('returns "" when fileName is empty', () => {
    expect(memo.getAssetPath("assets/", "")).toBe("");
  });

  it("concatenates base and URI-encoded fileName", () => {
    expect(memo.getAssetPath("assets/01/", "PNG image.png")).toBe(
      "assets/01/PNG%20image.png",
    );
  });

  it("leaves names without special chars unchanged", () => {
    expect(memo.getAssetPath("assets/", "cover.png")).toBe("assets/cover.png");
  });
});

describe("responsive boards", () => {
  it.each([6, 12, 16, 20, 24])(
    "fits %i cards in a small portrait viewport",
    (count) => {
      const { columns, size } = memo.getBoardLayout(count, 350, 470, 10);
      expect(size).toBeGreaterThanOrEqual(60);
      expect(columns * size + (columns - 1) * 10).toBeLessThanOrEqual(350);
      const rows = count / columns;
      expect(rows * size + (rows - 1) * 10).toBeLessThanOrEqual(470);
    },
  );
});

describe("memory round lifecycle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    memo.showMain();
    document.querySelector('[data-pairs="all"]').click();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  it("starts with every pair, and all themes are available", () => {
    document
      .querySelectorAll(".level-button")
      .forEach((button) => expect(button.disabled).toBe(false));
    memo.startLevel(4);
    const cards = [...document.querySelectorAll(".card")];
    expect(cards).toHaveLength(24);
    const values = cards.map((card) => card.dataset.value);
    expect(new Set(values).size).toBe(12);
    new Set(values).forEach((value) =>
      expect(values.filter((item) => item === value)).toHaveLength(2),
    );
  });
  it("a pending mismatch cannot mutate the next game", () => {
    memo.startLevel(1);
    const first = document.querySelector(".card");
    const other = [...document.querySelectorAll(".card")].find(
      (card) => card.dataset.value !== first.dataset.value,
    );
    first.click();
    other.click();
    memo.showMain();
    memo.startLevel(2);
    const nextFirst = document.querySelector(".card");
    nextFirst.click();
    jest.advanceTimersByTime(1500);
    expect(nextFirst.classList.contains("flipped")).toBe(true);
  });
  it("matches are disabled, remain visible, and completion never advances automatically", () => {
    memo.startLevel(1);
    const groups = new Map();
    document.querySelectorAll(".card").forEach((card) => {
      if (!groups.has(card.dataset.value)) groups.set(card.dataset.value, []);
      groups.get(card.dataset.value).push(card);
    });
    groups.forEach((cards) => {
      cards[0].click();
      cards[1].click();
      cards.forEach((card) => expect(card.disabled).toBe(true));
    });
    expect(document.getElementById("finishPopup").open).toBe(true);
    jest.advanceTimersByTime(10000);
    expect(document.getElementById("finishPopup").open).toBe(true);
    expect(document.querySelectorAll(".matched")).toHaveLength(12);
  });
});

it.each([
  [1280, 550, 4, 3],
  [3840, 2000, 4, 3],
  [350, 470, 3, 4],
])(
  "transport uses a compact grid at %i × %i",
  (width, height, columns, rows) => {
    const layout = memo.getBoardLayout(12, width, height, 12);
    expect(layout.columns).toBe(columns);
    expect(layout.rows).toBe(rows);
    expect(layout.size * rows + 12 * (rows - 1)).toBeLessThanOrEqual(height);
  },
);
it("still supports a smaller three-pair board", () => {
  document.querySelector('[data-pairs="3"]').click();
  memo.startLevel(1);
  expect(document.querySelectorAll(".card")).toHaveLength(6);
  memo.showMain();
  document.querySelector('[data-pairs="all"]').click();
});

it("a third card dismisses a mismatch immediately without a stale timer", () => {
  jest.useFakeTimers();
  memo.startLevel(1);
  const unique = [
    ...new Map(
      [...document.querySelectorAll(".card")].map((card) => [
        card.dataset.value,
        card,
      ]),
    ).values(),
  ];
  unique[0].click();
  unique[1].click();
  unique[2].click();
  expect(unique[0].classList.contains("flipped")).toBe(false);
  expect(unique[1].classList.contains("flipped")).toBe(false);
  expect(unique[2].classList.contains("flipped")).toBe(true);
  jest.advanceTimersByTime(1500);
  expect(unique[2].classList.contains("flipped")).toBe(true);
  memo.showMain();
  jest.clearAllTimers();
  jest.useRealTimers();
});

it("offers replay and the next theme independently", () => {
  memo.startLevel(2);
  document.getElementById("nextButton").click();
  expect(document.getElementById("levelLabel").textContent).toBe("Tools");
  document.getElementById("replayButton").click();
  expect(document.getElementById("levelLabel").textContent).toBe("Tools");
  memo.startLevel(4);
  document.getElementById("nextButton").click();
  expect(document.getElementById("levelLabel").textContent).toBe("Transportation");
  memo.showMain();
});

it("returning from browser navigation does not leave stray face-up cards", () => {
  memo.startLevel(1);
  const first = document.querySelector(".card");
  first.click();
  window.dispatchEvent(new Event("pagehide"));
  expect(first.classList.contains("flipped")).toBe(false);
  expect(first.getAttribute("aria-label")).toBe("Card 1. Turn over");
  first.click();
  expect(first.classList.contains("flipped")).toBe(true);
  memo.showMain();
});
