'use strict';

const MazeGenerator = require('../space-maze/js/mazeGenerator.js');

describe('MazeGenerator', () => {
  // ─── constructor / init ─────────────────────────────────────────────────

  describe('constructor', () => {
    it('stores cols and rows', () => {
      const gen = new MazeGenerator(6, 5);
      expect(gen.cols).toBe(6);
      expect(gen.rows).toBe(5);
    });

    it('creates a grid with the correct number of rows', () => {
      const gen = new MazeGenerator(4, 3);
      expect(gen.grid).toHaveLength(3);
    });

    it('creates rows with the correct number of columns', () => {
      const gen = new MazeGenerator(4, 3);
      gen.grid.forEach((row) => expect(row).toHaveLength(4));
    });

    it('every cell starts unvisited with all walls intact', () => {
      const gen = new MazeGenerator(3, 3);
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const cell = gen.grid[y][x];
          expect(cell.visited).toBe(false);
          expect(cell.walls).toEqual({
            top: true,
            right: true,
            bottom: true,
            left: true,
          });
          expect(cell.x).toBe(x);
          expect(cell.y).toBe(y);
        }
      }
    });
  });

  // ─── generate() ────────────────────────────────────────────────────────

  describe('generate()', () => {
    it('returns the grid', () => {
      const gen = new MazeGenerator(5, 5);
      const grid = gen.generate();
      expect(grid).toBe(gen.grid);
    });

    it('marks every cell as visited (spanning tree covers all cells)', () => {
      const gen = new MazeGenerator(6, 6);
      gen.generate();
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
          expect(gen.grid[y][x].visited).toBe(true);
        }
      }
    });

    it('every cell has at least one open wall (no isolated cells)', () => {
      const gen = new MazeGenerator(5, 5);
      gen.generate();
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const openCount = Object.values(gen.grid[y][x].walls).filter(
            (w) => !w,
          ).length;
          expect(openCount).toBeGreaterThan(0);
        }
      }
    });

    it('walls are symmetric between horizontally adjacent cells', () => {
      const gen = new MazeGenerator(6, 6);
      gen.generate();
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 5; x++) {
          expect(gen.grid[y][x].walls.right).toBe(
            gen.grid[y][x + 1].walls.left,
          );
        }
      }
    });

    it('walls are symmetric between vertically adjacent cells', () => {
      const gen = new MazeGenerator(6, 6);
      gen.generate();
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 6; x++) {
          expect(gen.grid[y][x].walls.bottom).toBe(
            gen.grid[y + 1][x].walls.top,
          );
        }
      }
    });

    it('produces a perfect maze (N cells → exactly N-1 passages)', () => {
      const cols = 5;
      const rows = 5;
      const gen = new MazeGenerator(cols, rows);
      gen.generate();
      let passages = 0;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if (x < cols - 1 && !gen.grid[y][x].walls.right) passages++;
          if (y < rows - 1 && !gen.grid[y][x].walls.bottom) passages++;
        }
      }
      expect(passages).toBe(cols * rows - 1);
    });

    it('works for non-square grids', () => {
      const gen = new MazeGenerator(8, 4);
      gen.generate();
      expect(gen.grid).toHaveLength(4);
      gen.grid.forEach((row) => expect(row).toHaveLength(8));
    });
  });

  // ─── getCell() ──────────────────────────────────────────────────────────

  describe('getCell()', () => {
    it('returns the correct cell for valid coordinates', () => {
      const gen = new MazeGenerator(5, 4);
      const cell = gen.getCell(3, 2);
      expect(cell).not.toBeNull();
      expect(cell.x).toBe(3);
      expect(cell.y).toBe(2);
    });

    it('returns null for x < 0', () => {
      expect(new MazeGenerator(4, 4).getCell(-1, 0)).toBeNull();
    });
    it('returns null for y < 0', () => {
      expect(new MazeGenerator(4, 4).getCell(0, -1)).toBeNull();
    });
    it('returns null for x >= cols', () => {
      expect(new MazeGenerator(4, 4).getCell(4, 0)).toBeNull();
    });
    it('returns null for y >= rows', () => {
      expect(new MazeGenerator(4, 4).getCell(0, 4)).toBeNull();
    });
  });

  // ─── getStartCell() / getEndCell() ──────────────────────────────────────

  describe('getStartCell()', () => {
    it('returns top-left {x:0, y:0}', () => {
      expect(new MazeGenerator(5, 5).getStartCell()).toEqual({ x: 0, y: 0 });
    });
  });

  describe('getEndCell()', () => {
    it('returns bottom-right corner', () => {
      expect(new MazeGenerator(5, 5).getEndCell()).toEqual({ x: 4, y: 4 });
    });

    it('reflects cols and rows correctly', () => {
      expect(new MazeGenerator(8, 6).getEndCell()).toEqual({ x: 7, y: 5 });
    });
  });
});
