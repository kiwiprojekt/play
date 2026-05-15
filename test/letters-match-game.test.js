/**
 * @jest-environment jsdom
 */
'use strict';

// Minimal DOM required by game.js at load time
const GAME_HTML = `
  <div id="mainMenu"></div>
  <div id="gameScreen"></div>
  <div id="target"></div>
  <div id="cards"></div>
  <span id="score">0</span>
  <div id="progress" style="width:0%"></div>
  <div id="popup"></div>
  <span id="popupScore"></span>
  <button id="backBtn"></button>
  <button id="popupBack"></button>
  <button id="popupNext"></button>
  <div id="langSelector"></div>
`;

let game;
let mockGetLanguage;

beforeAll(() => {
  document.body.innerHTML = GAME_HTML;

  // game.js calls into settings.js globals — provide them here
  mockGetLanguage = jest.fn(() => 'en');
  global.getLanguage = mockGetLanguage;
  global.setLanguage = jest.fn();
  global.STORAGE_PREFIX = 'letterMatch_';
  global.getStorage = (key) => localStorage.getItem('letterMatch_' + key);
  global.setStorage = (key, value) => localStorage.setItem('letterMatch_' + key, value);

  jest.resetModules();
  game = require('../letters-match/game.js');
});

// ─── Letter-set constants ──────────────────────────────────────────────────

describe('LETTERS (English sets)', () => {
  it('easy has 14 entries', () => expect(game.LETTERS.easy).toHaveLength(14));
  it('medium has 12 entries', () => expect(game.LETTERS.medium).toHaveLength(12));
  it('hard has 16 entries', () => expect(game.LETTERS.hard).toHaveLength(16));
  it('wild contains V and Q', () => {
    expect(game.LETTERS.wild).toContain('V');
    expect(game.LETTERS.wild).toContain('Q');
  });
});

describe('LETTERS_PL (Polish sets)', () => {
  it('easy has 14 entries', () => expect(game.LETTERS_PL.easy).toHaveLength(14));

  it('no V or Q in any Polish set', () => {
    const allPL = Object.values(game.LETTERS_PL).flat();
    expect(allPL).not.toContain('V');
    expect(allPL).not.toContain('v');
    expect(allPL).not.toContain('Q');
    expect(allPL).not.toContain('q');
  });

  it('hard introduces Ą', () => expect(game.LETTERS_PL.hard).toContain('Ą'));
  it('fun introduces Ć', () => expect(game.LETTERS_PL.fun).toContain('Ć'));
  it('mixed introduces Ł', () => expect(game.LETTERS_PL.mixed).toContain('Ł'));
  it('wild includes Ś, Ź, Ż', () => {
    expect(game.LETTERS_PL.wild).toContain('Ś');
    expect(game.LETTERS_PL.wild).toContain('Ź');
    expect(game.LETTERS_PL.wild).toContain('Ż');
  });
});

describe('ALL_LETTERS / ALL_PL_LETTERS', () => {
  it('ALL_LETTERS has 26 uppercase letters', () => {
    expect(game.ALL_LETTERS).toHaveLength(26);
  });
  it('ALL_LOWERCASE has 26 lowercase letters', () => {
    expect(game.ALL_LOWERCASE).toHaveLength(26);
  });
  it('ALL_PL_LETTERS excludes V and Q', () => {
    expect(game.ALL_PL_LETTERS).not.toContain('V');
    expect(game.ALL_PL_LETTERS).not.toContain('Q');
  });
  it('ALL_PL_LETTERS includes Polish diacritics', () => {
    expect(game.ALL_PL_LETTERS).toContain('Ą');
    expect(game.ALL_PL_LETTERS).toContain('Ó');
  });
});

// ─── getAvailableLetters() ─────────────────────────────────────────────────

describe('getAvailableLetters()', () => {
  beforeEach(() => mockGetLanguage.mockReturnValue('en'));

  it('easy EN — returns LETTERS.easy exactly', () => {
    game._setState({ currentLevel: 'easy', isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS.easy);
  });

  it('medium EN — returns 14 letters (easy + first 2 of medium)', () => {
    game._setState({ currentLevel: 'medium', isInfinite: false });
    expect(game.getAvailableLetters()).toHaveLength(14);
  });

  it('hard EN — combines easy + medium + hard', () => {
    game._setState({ currentLevel: 'hard', isInfinite: false });
    const expected = [
      ...game.LETTERS.easy,
      ...game.LETTERS.medium,
      ...game.LETTERS.hard,
    ];
    expect(game.getAvailableLetters()).toEqual(expected);
  });

  it('fun EN — returns LETTERS.fun', () => {
    game._setState({ currentLevel: 'fun', isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS.fun);
  });

  it('wild EN — returns LETTERS.wild', () => {
    game._setState({ currentLevel: 'wild', isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS.wild);
  });

  it('infinite EN — returns all 52 EN letters', () => {
    game._setState({ currentLevel: null, isInfinite: true });
    expect(game.getAvailableLetters()).toEqual([
      ...game.ALL_LETTERS,
      ...game.ALL_LOWERCASE,
    ]);
  });

  it('easy PL — returns LETTERS_PL.easy', () => {
    mockGetLanguage.mockReturnValue('pl');
    game._setState({ currentLevel: 'easy', isInfinite: false });
    expect(game.getAvailableLetters()).toEqual(game.LETTERS_PL.easy);
  });

  it('hard PL — combines PL sets and includes Ą', () => {
    mockGetLanguage.mockReturnValue('pl');
    game._setState({ currentLevel: 'hard', isInfinite: false });
    expect(game.getAvailableLetters()).toContain('Ą');
  });

  it('infinite PL — returns all Polish letters', () => {
    mockGetLanguage.mockReturnValue('pl');
    game._setState({ currentLevel: null, isInfinite: true });
    expect(game.getAvailableLetters()).toEqual([
      ...game.ALL_PL_LETTERS,
      ...game.ALL_PL_LOWERCASE,
    ]);
  });
});

// ─── getCardCount() ───────────────────────────────────────────────────────

describe('getCardCount()', () => {
  it('easy → 3', () => {
    game._setState({ currentLevel: 'easy', isInfinite: false });
    expect(game.getCardCount()).toBe(3);
  });
  it('medium → 4', () => {
    game._setState({ currentLevel: 'medium', isInfinite: false });
    expect(game.getCardCount()).toBe(4);
  });
  it('hard → 5', () => {
    game._setState({ currentLevel: 'hard', isInfinite: false });
    expect(game.getCardCount()).toBe(5);
  });
  it('fun → 4', () => {
    game._setState({ currentLevel: 'fun', isInfinite: false });
    expect(game.getCardCount()).toBe(4);
  });
  it('mixed → 5', () => {
    game._setState({ currentLevel: 'mixed', isInfinite: false });
    expect(game.getCardCount()).toBe(5);
  });
  it('wild → 6', () => {
    game._setState({ currentLevel: 'wild', isInfinite: false });
    expect(game.getCardCount()).toBe(6);
  });
  it('infinite → between 3 and 6 (sampled 50×)', () => {
    game._setState({ currentLevel: null, isInfinite: true });
    for (let i = 0; i < 50; i++) {
      const count = game.getCardCount();
      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(6);
    }
  });
});

// ─── constants ────────────────────────────────────────────────────────────

describe('LEVEL_ORDER / ROUNDS_PER_GAME', () => {
  it('LEVEL_ORDER has 7 levels ending with "infinite"', () => {
    expect(game.LEVEL_ORDER).toHaveLength(7);
    expect(game.LEVEL_ORDER[6]).toBe('infinite');
  });
  it('ROUNDS_PER_GAME is 10', () => {
    expect(game.ROUNDS_PER_GAME).toBe(10);
  });
});

// ─── no-repeat letters per level ─────────────────────────────────────────

describe('generateRound() — no-repeat letters per level', () => {
  beforeEach(() => {
    mockGetLanguage.mockReturnValue('en');
    // Reset used-letter tracking before each test
    game._setState({ usedBaseLetters: [], lastTargetBase: null });
  });

  function getTargetBase() {
    return document.getElementById('target').textContent.toUpperCase();
  }

  it('hard EN — 21 consecutive rounds have no consecutive duplicate base letter', () => {
    game._setState({ currentLevel: 'hard', isInfinite: false, usedBaseLetters: [], lastTargetBase: null });
    let prev = null;
    for (let i = 0; i < 21; i++) {
      game.generateRound();
      const base = getTargetBase();
      expect(base).not.toBe(prev);
      prev = base;
    }
  });

  it('hard EN — within first 21 unique-base-letter rounds, no base repeats until cycle restarts', () => {
    // hard pool has 21 unique base letters (easy 7 + medium 6 + hard 8 = 21)
    game._setState({ currentLevel: 'hard', isInfinite: false, usedBaseLetters: [], lastTargetBase: null });
    const seen = new Set();
    for (let i = 0; i < 21; i++) {
      game.generateRound();
      const base = getTargetBase();
      expect(seen.has(base)).toBe(false);
      seen.add(base);
    }
    // On the 22nd round the cycle restarts — it must differ from round 21's base
    const lastBase = getTargetBase();
    game.generateRound();
    expect(getTargetBase()).not.toBe(lastBase);
  });

  it('fun EN — 10 rounds never repeat consecutive base letters', () => {
    // fun pool has only 8 unique base letters, so repeats are necessary after round 8
    game._setState({ currentLevel: 'fun', isInfinite: false, usedBaseLetters: [], lastTargetBase: null });
    let prev = null;
    for (let i = 0; i < 10; i++) {
      game.generateRound();
      const base = getTargetBase();
      expect(base).not.toBe(prev);
      prev = base;
    }
  });

  it('_setState resets usedBaseLetters and lastTargetBase correctly', () => {
    game._setState({ currentLevel: 'easy', isInfinite: false, usedBaseLetters: ['A', 'B'], lastTargetBase: 'B' });
    const state = game._getState();
    expect(state.usedBaseLetters.has('A')).toBe(true);
    expect(state.usedBaseLetters.has('B')).toBe(true);
    expect(state.lastTargetBase).toBe('B');
  });

  it('usedBaseLetters grows after each generateRound call', () => {
    game._setState({ currentLevel: 'hard', isInfinite: false, usedBaseLetters: [], lastTargetBase: null });
    game.generateRound();
    expect(game._getState().usedBaseLetters.size).toBe(1);
    game.generateRound();
    expect(game._getState().usedBaseLetters.size).toBe(2);
    game.generateRound();
    expect(game._getState().usedBaseLetters.size).toBe(3);
  });
});
