const MazeGenerator = require("../space-maze/js/mazeGenerator.js");
const { MazeRun, DIRECTIONS } = require("../space-maze/js/run.js");
const { sizes } = require("../space-maze/js/config.js");

function solve(run) {
  const queue = [{ x: 0, y: 0, path: [] }];
  const seen = new Set(["0,0"]);
  for (let i = 0; i < queue.length; i++) {
    const { x, y, path } = queue[i];
    if (x === run.cols - 1 && y === run.rows - 1) return path;
    for (const [direction, step] of Object.entries(DIRECTIONS)) {
      if (run.grid[y][x].walls[direction]) continue;
      const nx = x + step.x,
        ny = y + step.y;
      const key = `${nx},${ny}`;
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ x: nx, y: ny, path: [...path, direction] });
      }
    }
  }
  throw new Error("The maze has no path to the star");
}

describe("maze movement", () => {
  it.each(sizes.map((size, index) => [index + 1, ...size]))(
    "level %i has a traversable %i × %i maze",
    (level, cols, rows) => {
      for (let sample = 0; sample < 3; sample++) {
        const run = new MazeRun(new MazeGenerator(cols, rows).generate());
        const path = solve(run);
        path.forEach((direction) => expect(run.move(direction)).toBe(true));
        expect(run.complete).toBe(true);
        expect(run.position).toEqual({ x: cols - 1, y: rows - 1 });
        Object.keys(DIRECTIONS).forEach((direction) =>
          expect(run.move(direction)).toBe(false),
        );
      }
    },
  );
  it("rejects walls and invalid directions without changing progress", () => {
    const run = new MazeRun(new MazeGenerator(3, 3).generate());
    ["top", "left", "diagonal", undefined].forEach((direction) =>
      expect(run.move(direction)).toBe(false),
    );
    expect(run.position).toEqual({ x: 0, y: 0 });
    expect(run.visited).toEqual(new Set(["0,0"]));
  });
});
