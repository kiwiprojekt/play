class MazeGenerator {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = [];
        this.init();
    }

    init() {
        for (let y = 0; y < this.rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.cols; x++) {
                this.grid[y][x] = {
                    x: x,
                    y: y,
                    walls: { top: true, right: true, bottom: true, left: true },
                    visited: false
                };
            }
        }
    }

    generate() {
        const stack = [];
        const startCell = this.grid[0][0];
        startCell.visited = true;
        stack.push(startCell);

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = this.getUnvisitedNeighbors(current);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                this.removeWall(current, next);
                next.visited = true;
                stack.push(next);
            }
        }

        return this.grid;
    }

    getUnvisitedNeighbors(cell) {
        const neighbors = [];
        const { x, y } = cell;

        if (y > 0 && !this.grid[y - 1][x].visited) neighbors.push(this.grid[y - 1][x]);
        if (x < this.cols - 1 && !this.grid[y][x + 1].visited) neighbors.push(this.grid[y][x + 1]);
        if (y < this.rows - 1 && !this.grid[y + 1][x].visited) neighbors.push(this.grid[y + 1][x]);
        if (x > 0 && !this.grid[y][x - 1].visited) neighbors.push(this.grid[y][x - 1]);

        return neighbors;
    }

    removeWall(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        if (dx === 1) { a.walls.right = false; b.walls.left = false; }
        if (dx === -1) { a.walls.left = false; b.walls.right = false; }
        if (dy === 1) { a.walls.bottom = false; b.walls.top = false; }
        if (dy === -1) { a.walls.top = false; b.walls.bottom = false; }
    }

    getCell(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
        return this.grid[y][x];
    }

    getStartCell() {
        return { x: 0, y: 0 };
    }

    getEndCell() {
        return { x: this.cols - 1, y: this.rows - 1 };
    }
}
