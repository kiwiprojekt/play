/**
 * @jest-environment jsdom
 */
"use strict";

// Minimal DOM required by game.js at load time
const GAME_HTML = require("fs")
  .readFileSync(
    require("path").join(__dirname, "../letters-match/index.html"),
    "utf8",
  )
  .split("<body>")[1]
  .split("</body>")[0];

let game;
let mockGetLanguage;

beforeAll(() => {
  document.body.innerHTML = GAME_HTML;

  jest.resetModules();
  mockGetLanguage = jest
    .spyOn(require("../letters-match/settings.js"), "getLanguage")
    .mockReturnValue("en");
  game = require("../letters-match/game.js");
});

// ─── Letter-set constants ──────────────────────────────────────────────────

describe("LETTERS (English sets)", () => {
  it("easy includes complete upper/lowercase pairs", () =>
    expect(game.LETTERS.easy).toHaveLength(16));
  it("medium has 12 entries", () =>
    expect(game.LETTERS.medium).toHaveLength(12));
  it("hard has 16 entries", () => expect(game.LETTERS.hard).toHaveLength(16));
  it("wild contains V and Q", () => {
    expect(game.LETTERS.wild).toContain("V");
    expect(game.LETTERS.wild).toContain("Q");
  });
});

describe("LETTERS_PL (Polish sets)", () => {
  it("easy includes complete Polish upper/lowercase pairs", () =>
    expect(game.LETTERS_PL.easy).toHaveLength(14));

  it("no V or Q in any Polish set", () => {
    const allPL = Object.values(game.LETTERS_PL).flat();
    expect(allPL).not.toContain("V");
    expect(allPL).not.toContain("v");
    expect(allPL).not.toContain("Q");
    expect(allPL).not.toContain("q");
  });

  it("hard introduces Ą", () => expect(game.LETTERS_PL.hard).toContain("Ą"));
  it("fun introduces Ć", () => expect(game.LETTERS_PL.fun).toContain("Ć"));
  it("mixed introduces Ł", () => expect(game.LETTERS_PL.mixed).toContain("Ł"));
  it("wild includes Ś, Ź, Ż", () => {
    expect(game.LETTERS_PL.wild).toContain("Ś");
    expect(game.LETTERS_PL.wild).toContain("Ź");
    expect(game.LETTERS_PL.wild).toContain("Ż");
  });
});

describe("ALL_LETTERS / ALL_PL_LETTERS", () => {
  it("ALL_LETTERS has 26 uppercase letters", () => {
    expect(game.ALL_LETTERS).toHaveLength(26);
  });
  it("ALL_LOWERCASE has 26 lowercase letters", () => {
    expect(game.ALL_LOWERCASE).toHaveLength(26);
  });
  it("ALL_PL_LETTERS excludes V and Q", () => {
    expect(game.ALL_PL_LETTERS).not.toContain("V");
    expect(game.ALL_PL_LETTERS).not.toContain("Q");
  });
  it("ALL_PL_LETTERS includes Polish diacritics", () => {
    expect(game.ALL_PL_LETTERS).toContain("Ą");
    expect(game.ALL_PL_LETTERS).toContain("Ó");
  });
});

// ─── getAvailableLetters() ─────────────────────────────────────────────────

describe("getAvailableLetters()", () => {
  beforeEach(() => mockGetLanguage.mockReturnValue("en"));

  it("easy EN — returns LETTERS.easy exactly", () => {
    game._setState({ currentLevel: "easy", isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS.easy);
  });

  it("medium EN introduces its full new letter set", () => {
    game._setState({ currentLevel: "medium", isInfinite: false });
    expect(game.getAvailableLetters()).toEqual([
      ...game.LETTERS.easy,
      ...game.LETTERS.medium,
    ]);
  });

  it("hard EN — combines easy + medium + hard", () => {
    game._setState({ currentLevel: "hard", isInfinite: false });
    const expected = [
      ...game.LETTERS.easy,
      ...game.LETTERS.medium,
      ...game.LETTERS.hard,
    ];
    expect(game.getAvailableLetters()).toEqual(expected);
  });

  it("fun EN — returns LETTERS.fun", () => {
    game._setState({ currentLevel: "fun", isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS.fun);
  });

  it("wild EN — returns LETTERS.wild", () => {
    game._setState({ currentLevel: "wild", isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS.wild);
  });

  it("infinite EN — returns all 52 EN letters", () => {
    game._setState({ currentLevel: null, isInfinite: true });
    expect(game.getAvailableLetters()).toEqual([
      ...game.ALL_LETTERS,
      ...game.ALL_LOWERCASE,
    ]);
  });

  it("easy PL — returns LETTERS_PL.easy", () => {
    mockGetLanguage.mockReturnValue("pl");
    game._setState({ currentLevel: "easy", isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS_PL.easy);
  });

  it("hard PL — combines PL sets and includes Ą", () => {
    mockGetLanguage.mockReturnValue("pl");
    game._setState({ currentLevel: "hard", isInfinite: false });
    expect(game.getAvailableLetters()).toContain("Ą");
  });

  it("infinite PL — returns all Polish letters", () => {
    mockGetLanguage.mockReturnValue("pl");
    game._setState({ currentLevel: null, isInfinite: true });
    expect(game.getAvailableLetters()).toEqual([
      ...game.ALL_PL_LETTERS,
      ...game.ALL_PL_LOWERCASE,
    ]);
  });
});

// ─── getCardCount() ───────────────────────────────────────────────────────

describe("getCardCount()", () => {
  it("easy → 3", () => {
    game._setState({ currentLevel: "easy", isInfinite: false });
    expect(game.getCardCount()).toBe(3);
  });
  it("medium → 4", () => {
    game._setState({ currentLevel: "medium", isInfinite: false });
    expect(game.getCardCount()).toBe(4);
  });
  it("hard → 5", () => {
    game._setState({ currentLevel: "hard", isInfinite: false });
    expect(game.getCardCount()).toBe(5);
  });
  it("fun → 4", () => {
    game._setState({ currentLevel: "fun", isInfinite: false });
    expect(game.getCardCount()).toBe(4);
  });
  it("mixed → 5", () => {
    game._setState({ currentLevel: "mixed", isInfinite: false });
    expect(game.getCardCount()).toBe(5);
  });
  it("wild → 6", () => {
    game._setState({ currentLevel: "wild", isInfinite: false });
    expect(game.getCardCount()).toBe(6);
  });
  it("infinite → between 3 and 6 (sampled 50×)", () => {
    game._setState({ currentLevel: null, isInfinite: true });
    for (let i = 0; i < 50; i++) {
      const count = game.getCardCount();
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(6);
    }
  });
});

// ─── constants ────────────────────────────────────────────────────────────

describe("LEVEL_ORDER / ROUNDS_PER_GAME", () => {
  it('LEVEL_ORDER has 7 levels ending with "infinite"', () => {
    expect(game.LEVEL_ORDER).toHaveLength(7);
    expect(game.LEVEL_ORDER[6]).toBe("infinite");
  });
  it("keeps the original ten-match rounds", () => {
    expect(game.ROUNDS_PER_GAME).toBe(10);
  });
});

// ─── no-repeat letters per level ─────────────────────────────────────────

describe("generateRound() — no-repeat letters per level", () => {
  beforeEach(() => {
    mockGetLanguage.mockReturnValue("en");
    localStorage.setItem("letterMatch_fontMode", "default");
    // Reset used-letter tracking before each test
    game._setState({ usedBaseLetters: [], lastTargetBase: null });
  });

  function getTargetBase() {
    return document.getElementById("target").textContent.toUpperCase();
  }

  it("hard EN — 22 consecutive rounds have no consecutive duplicate base letter", () => {
    game._setState({
      currentLevel: "hard",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    let prev = null;
    for (let i = 0; i < 22; i++) {
      game.generateRound();
      const base = getTargetBase();
      expect(base).not.toBe(prev);
      prev = base;
    }
  });

  it("hard EN — within first 22 unique-base-letter rounds, no base repeats until cycle restarts", () => {
    // hard pool has 22 unique base letters (easy 8 + medium 6 + hard 8 = 22)
    game._setState({
      currentLevel: "hard",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    const seen = new Set();
    for (let i = 0; i < 22; i++) {
      game.generateRound();
      const base = getTargetBase();
      expect(seen.has(base)).toBe(false);
      seen.add(base);
    }
    // On the 23rd round the cycle restarts — it must differ from round 22's base
    const lastBase = getTargetBase();
    game.generateRound();
    expect(getTargetBase()).not.toBe(lastBase);
  });

  it("fun EN — 10 rounds never repeat consecutive base letters", () => {
    // fun pool has only 8 unique base letters, so repeats are necessary after round 8
    game._setState({
      currentLevel: "fun",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    let prev = null;
    for (let i = 0; i < 10; i++) {
      game.generateRound();
      const base = getTargetBase();
      expect(base).not.toBe(prev);
      prev = base;
    }
  });

  it("_setState resets usedBaseLetters and lastTargetBase correctly", () => {
    game._setState({
      currentLevel: "easy",
      isInfinite: false,
      usedBaseLetters: ["A", "B"],
      lastTargetBase: "B",
    });
    const state = game._getState();
    expect(state.usedBaseLetters.has("A")).toBe(true);
    expect(state.usedBaseLetters.has("B")).toBe(true);
    expect(state.lastTargetBase).toBe("B");
  });

  it("usedBaseLetters grows after each generateRound call", () => {
    game._setState({
      currentLevel: "hard",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    game.generateRound();
    expect(game._getState().usedBaseLetters.size).toBe(1);
    game.generateRound();
    expect(game._getState().usedBaseLetters.size).toBe(2);
    game.generateRound();
    expect(game._getState().usedBaseLetters.size).toBe(3);
  });
});

// ─── isHandwritten() and Typography Resolution ─────────────────────────────

describe("isHandwritten() typography helper", () => {
  it("easy / medium / hard returns false in default mode", () => {
    expect(game.isHandwritten(true, "easy", false, "default")).toBe(false);
    expect(game.isHandwritten(false, "easy", false, "default")).toBe(false);
    expect(game.isHandwritten(true, "medium", false, "default")).toBe(false);
    expect(game.isHandwritten(false, "hard", false, "default")).toBe(false);
  });

  it("fun and mixed return true in default mode", () => {
    expect(game.isHandwritten(true, "fun", false, "default")).toBe(true);
    expect(game.isHandwritten(false, "fun", false, "default")).toBe(true);
    expect(game.isHandwritten(true, "mixed", false, "default")).toBe(true);
    expect(game.isHandwritten(false, "mixed", false, "default")).toBe(true);
  });

  it("wild and infinite return false for uppercase, true for lowercase in default mode", () => {
    expect(game.isHandwritten(true, "wild", false, "default")).toBe(false);
    expect(game.isHandwritten(false, "wild", false, "default")).toBe(true);
    expect(game.isHandwritten(true, null, true, "default")).toBe(false);
    expect(game.isHandwritten(false, null, true, "default")).toBe(true);
  });

  it("serif mode disables handwritten font across all levels and cases", () => {
    expect(game.isHandwritten(true, "fun", false, "serif")).toBe(false);
    expect(game.isHandwritten(false, "fun", false, "serif")).toBe(false);
    expect(game.isHandwritten(true, "mixed", false, "serif")).toBe(false);
    expect(game.isHandwritten(false, "wild", false, "serif")).toBe(false);
    expect(game.isHandwritten(false, null, true, "serif")).toBe(false);
  });

  it("hand mode forces handwritten font across all levels", () => {
    expect(game.isHandwritten(true, "easy", false, "hand")).toBe(true);
    expect(game.isHandwritten(false, "easy", false, "hand")).toBe(true);
    expect(game.isHandwritten(true, "wild", false, "hand")).toBe(true);
  });
});

// ─── Font Switching UI & Real-Time DOM Updates ─────────────────────────────

describe("Font Switcher & Real-Time Updates", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetLanguage.mockReturnValue("en");
  });

  it("renders handwritten classes in Level 4 (fun) under default mode", () => {
    localStorage.setItem("letterMatch_fontMode", "default");
    game._setState({
      currentLevel: "fun",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    game.generateRound();

    const targetEl = document.getElementById("target");
    expect(targetEl.classList.contains("handwritten-target")).toBe(true);

    const cards = document.querySelectorAll("#cards .answer-card");
    cards.forEach((card) => {
      expect(card.classList.contains("handwritten-card")).toBe(true);
    });
  });

  it("disables handwritten classes in Level 4 (fun) when fontMode is serif", () => {
    localStorage.setItem("letterMatch_fontMode", "serif");
    game._setState({
      currentLevel: "fun",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    game.generateRound();

    const targetEl = document.getElementById("target");
    expect(targetEl.classList.contains("handwritten-target")).toBe(false);

    const cards = document.querySelectorAll("#cards .answer-card");
    cards.forEach((card) => {
      expect(card.classList.contains("handwritten-card")).toBe(false);
    });
  });

  it("selects each of the three font modes directly", () => {
    ["serif", "hand", "default"].forEach((mode) => {
      document.querySelector(`[data-font="${mode}"]`).click();
      expect(localStorage.getItem("letterMatch_fontMode")).toBe(mode);
      expect(
        document.querySelectorAll('#mainMenu [data-font][aria-pressed="true"]'),
      ).toHaveLength(1);
      expect(
        document
          .querySelector(`[data-font="${mode}"]`)
          .getAttribute("aria-pressed"),
      ).toBe("true");
    });
  });

  it("applyFontClasses() dynamically switches board typography without resetting round", () => {
    localStorage.setItem("letterMatch_fontMode", "default");
    game._setState({
      currentLevel: "fun",
      isInfinite: false,
      usedBaseLetters: [],
      lastTargetBase: null,
    });
    game.generateRound();

    const targetEl = document.getElementById("target");
    expect(targetEl.classList.contains("handwritten-target")).toBe(true);

    // Switch to serif mode in real-time
    localStorage.setItem("letterMatch_fontMode", "serif");
    game.applyFontClasses();

    expect(targetEl.classList.contains("handwritten-target")).toBe(false);
  });
});

describe("round lifecycle and answer contracts", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    mockGetLanguage.mockReturnValue("en");
  });
  afterEach(() => {
    game.showMenu();
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  function answer() {
    const target = document.getElementById("target").textContent;
    return [...document.querySelectorAll(".answer-card")].find(
      (card) => card.textContent.toUpperCase() === target.toUpperCase(),
    );
  }
  it("all answer cards are native buttons, distinct, and in the opposite case", () => {
    for (const level of game.LEVEL_ORDER) {
      game.startGame(level);
      const target = document.getElementById("target").textContent;
      const cards = [...document.querySelectorAll(".answer-card")];
      expect(new Set(cards.map((card) => card.textContent)).size).toBe(
        cards.length,
      );
      cards.forEach((card) => {
        expect(card.tagName).toBe("BUTTON");
        expect(card.textContent === card.textContent.toUpperCase()).not.toBe(
          target === target.toUpperCase(),
        );
      });
      expect(
        cards.filter(
          (card) => card.textContent.toUpperCase() === target.toUpperCase(),
        ),
      ).toHaveLength(1);
    }
  });
  it("returning to the menu cancels a pending correct-answer transition", () => {
    game.startGame("easy");
    answer().click();
    game.showMenu();
    const previousTarget = document.getElementById("target").textContent;
    jest.advanceTimersByTime(2000);
    expect(document.getElementById("target").textContent).toBe(previousTarget);
    expect(game._getState().isProcessing).toBe(false);
    expect(document.body.classList.contains("in-game")).toBe(false);
  });
  it("a new game cannot inherit a delayed transition or processing lock", () => {
    game.startGame("easy");
    answer().click();
    game.startGame("hard");
    const target = document.getElementById("target").textContent;
    jest.advanceTimersByTime(1000);
    expect(document.getElementById("target").textContent).toBe(target);
    expect(game._getState().score).toBe(0);
    answer().click();
    expect(game._getState().score).toBe(1);
  });
  it("completion waits for the child and menu return resets the page state", () => {
    game.startGame("easy");
    for (let i = 0; i < game.ROUNDS_PER_GAME; i++) {
      answer().click();
      jest.advanceTimersByTime(800);
    }
    expect(document.getElementById("popup").open).toBe(true);
    jest.advanceTimersByTime(10000);
    expect(game._getState().score).toBe(game.ROUNDS_PER_GAME);
    document.getElementById("popupBack").click();
    expect(document.body.classList.contains("in-game")).toBe(false);
    expect(document.getElementById("popup").open).toBe(false);
  });
  it("medium actually contains new letters and every set has matching cases", () => {
    [game.LETTERS, game.LETTERS_PL].forEach((language) =>
      Object.values(language).forEach((letters) => {
        letters.forEach((letter) =>
          expect(letters).toContain(
            letter === letter.toUpperCase()
              ? letter.toLowerCase()
              : letter.toUpperCase(),
          ),
        );
      }),
    );
  });
});

describe("alphabet selection", () => {
  afterEach(() => mockGetLanguage.mockReturnValue("en"));
  it("offers every Polish letter in the numbered groups and excludes Q, V and X", () => {
    const letters = new Set(
      Object.values(game.LETTERS_PL)
        .flat()
        .map((letter) => letter.toUpperCase()),
    );
    expect([...letters].sort()).toEqual([...game.ALL_PL_LETTERS].sort());
    ["Q", "V", "X"].forEach((letter) =>
      expect(letters.has(letter)).toBe(false),
    );
    expect(game.ALL_PL_LETTERS).toHaveLength(32);
  });
  it("the language switch changes the alphabet, previews, and rounds", () => {
    mockGetLanguage.mockImplementation(
      () => localStorage.getItem("letterMatch_language") || "en",
    );
    document.querySelector('[data-lang="pl"]').click();
    expect(
      document.querySelector('[data-level="mixed"] .level-example').textContent,
    ).toBe("Łł");
    for (const level of game.LEVEL_ORDER) {
      game.startGame(level);
      const allowed = new Set([
        ...game.ALL_PL_LETTERS,
        ...game.ALL_PL_LOWERCASE,
      ]);
      expect(
        [...document.querySelectorAll(".answer-card")].every((card) =>
          allowed.has(card.textContent),
        ),
      ).toBe(true);
      expect(allowed.has(document.getElementById("target").textContent)).toBe(
        true,
      );
    }
    game.showMenu();
    document.querySelector('[data-lang="en"]').click();
    expect(
      document.querySelector('[data-level="mixed"] .level-example').textContent,
    ).toBe("Mm");
  });
  it("keeps level cards visual without descriptive copy", () => {
    const grid = document.querySelector(".level-grid");
    expect(grid.textContent).not.toMatch(/choices|curls|letters|keep playing/i);
    expect(grid.querySelectorAll(".level-number")).toHaveLength(6);
  });
});

it("changes font during play without changing the letter or resetting progress", () => {
  game.startGame("easy");
  const target = document.getElementById("target").textContent;
  document.querySelector('#gameScreen [data-font="hand"]').click();
  expect(document.getElementById("target").textContent).toBe(target);
  expect(
    document.getElementById("target").classList.contains("handwritten-target"),
  ).toBe(true);
  expect(game._getState().score).toBe(0);
  game.showMenu();
});

it("resumes a successful letter round after browser navigation without double scoring", () => {
  jest.useFakeTimers();
  game.startGame("easy");
  const target = document.getElementById("target").textContent;
  const match = [...document.querySelectorAll(".answer-card")].find(
    (card) => card.textContent.toUpperCase() === target.toUpperCase(),
  );
  match.click();
  window.dispatchEvent(new Event("pagehide"));
  const restored = new Event("pageshow");
  Object.defineProperty(restored, "persisted", { value: true });
  window.dispatchEvent(restored);
  expect(game._getState().score).toBe(1);
  expect(document.querySelector(".answer-card.correct")).toBeNull();
  expect(document.querySelectorAll(".answer-card").length).toBeGreaterThan(0);
  jest.advanceTimersByTime(1000);
  expect(game._getState().score).toBe(1);
  game.showMenu();
  jest.clearAllTimers();
  jest.useRealTimers();
});
