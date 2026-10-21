const DIRECTIONS = {
  top: { x: 0, y: -1, angle: 0 },
  right: { x: 1, y: 0, angle: Math.PI / 2 },
  bottom: { x: 0, y: 1, angle: Math.PI },
  left: { x: -1, y: 0, angle: -Math.PI / 2 },
};
class MazeRun {
  constructor(grid) {
    this.grid = grid;
    this.rows = grid.length;
    this.cols = grid[0].length;
    this.position = { x: 0, y: 0 };
    this.direction = "top";
    this.visited = new Set(["0,0"]);
    this.complete = false;
  }
  canMove(direction) {
    const step = DIRECTIONS[direction];
    if (!step || this.complete) return false;
    const { x, y } = this.position;
    const nx = x + step.x,
      ny = y + step.y;
    return (
      nx >= 0 &&
      nx < this.cols &&
      ny >= 0 &&
      ny < this.rows &&
      !this.grid[y][x].walls[direction]
    );
  }
  move(direction) {
    if (!this.canMove(direction)) return false;
    const step = DIRECTIONS[direction];
    this.position = {
      x: this.position.x + step.x,
      y: this.position.y + step.y,
    };
    this.direction = direction;
    this.visited.add(`${this.position.x},${this.position.y}`);
    this.complete =
      this.position.x === this.cols - 1 && this.position.y === this.rows - 1;
    return true;
  }
}
if (typeof module !== "undefined") module.exports = { MazeRun, DIRECTIONS };
