/**
 * @jest-environment jsdom
 */
'use strict';

// Minimal DOM required by memo/script.js at load time
const MEMO_HTML = `
  <div id="mainScreen" class="active"></div>
  <div id="gameScreen"></div>
  <div id="board"></div>
  <span id="levelLabel"></span>
  <div id="finishPopup" class="hidden"></div>
  <button id="nextButton"><div class="progress-bar"></div></button>
  <button id="exitButton"></button>
  <button id="muteButton"></button>
  <button id="muteButtonMenu"></button>
  <button class="level-button" data-level="1"></button>
  <button class="level-button" data-level="2"></button>
  <button class="level-button" data-level="3"></button>
  <button class="level-button" data-level="4"></button>
  <button id="backButton"></button>
`;

let memo;

beforeAll(() => {
  document.body.innerHTML = MEMO_HTML;

  // Mock Audio (not supported in jsdom)
  global.Audio = jest.fn().mockImplementation(() => ({
    currentTime: 0,
    play: jest.fn().mockResolvedValue(undefined),
  }));

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: jest.fn(),
    })),
  });

  jest.resetModules();
  memo = require('../memo/script.js');
});

// ─── levels config ────────────────────────────────────────────────────────

describe('levels config', () => {
  it('has 4 levels', () => {
    expect(Object.keys(memo.levels)).toHaveLength(4);
  });

  it('level 1 has 6 pairs', () => expect(memo.levels[1].pairs).toBe(6));
  it('level 2 has 8 pairs', () => expect(memo.levels[2].pairs).toBe(8));
  it('level 3 has 10 pairs', () => expect(memo.levels[3].pairs).toBe(10));
  it('level 4 has 12 pairs', () => expect(memo.levels[4].pairs).toBe(12));

  it('each level has required fields', () => {
    Object.values(memo.levels).forEach((lvl) => {
      expect(lvl).toHaveProperty('pairs');
      expect(lvl).toHaveProperty('images');
      expect(lvl).toHaveProperty('imageBase');
      expect(lvl).toHaveProperty('coverImage');
      expect(lvl).toHaveProperty('backImage');
    });
  });

  it('each level has the correct number of images', () => {
    Object.values(memo.levels).forEach((lvl) => {
      expect(lvl.images).toHaveLength(lvl.pairs);
    });
  });
});

// ─── shuffle() ────────────────────────────────────────────────────────────

describe('shuffle()', () => {
  it('returns an array of the same length', () => {
    expect(memo.shuffle([1, 2, 3, 4])).toHaveLength(4);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    memo.shuffle(arr);
    expect(arr).toEqual(copy);
  });

  it('contains the same elements (different order may occur)', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(memo.shuffle(arr).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it('handles an empty array', () => {
    expect(memo.shuffle([])).toEqual([]);
  });

  it('handles a single-element array', () => {
    expect(memo.shuffle([42])).toEqual([42]);
  });
});

// ─── getAssetPath() ───────────────────────────────────────────────────────

describe('getAssetPath()', () => {
  it('returns "" when base is empty', () => {
    expect(memo.getAssetPath('', 'file.png')).toBe('');
  });

  it('returns "" when fileName is empty', () => {
    expect(memo.getAssetPath('assets/', '')).toBe('');
  });

  it('concatenates base and URI-encoded fileName', () => {
    expect(memo.getAssetPath('assets/01/', 'PNG image.png')).toBe(
      'assets/01/PNG%20image.png',
    );
  });

  it('leaves names without special chars unchanged', () => {
    expect(memo.getAssetPath('assets/', 'cover.png')).toBe('assets/cover.png');
  });
});

// ─── getBoardAspect() ─────────────────────────────────────────────────────

describe('getBoardAspect()', () => {
  it('6 pairs → 4/3', () => expect(memo.getBoardAspect(6)).toBeCloseTo(4 / 3));
  it('10 pairs → 5/4', () => expect(memo.getBoardAspect(10)).toBeCloseTo(5 / 4));
  it('12 pairs → 6/4', () => expect(memo.getBoardAspect(12)).toBeCloseTo(6 / 4));
  it('unknown → 1', () => expect(memo.getBoardAspect(8)).toBe(1));
});

// ─── getBoardAspectCss() ──────────────────────────────────────────────────

describe('getBoardAspectCss()', () => {
  it('6 pairs → "4 / 3"', () => expect(memo.getBoardAspectCss(6)).toBe('4 / 3'));
  it('10 pairs → "5 / 4"', () => expect(memo.getBoardAspectCss(10)).toBe('5 / 4'));
  it('12 pairs → "6 / 4"', () => expect(memo.getBoardAspectCss(12)).toBe('6 / 4'));
  it('unknown → "1 / 1"', () => expect(memo.getBoardAspectCss(8)).toBe('1 / 1'));
});
