class MazeRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ship = new Image();
    this.ship.src = "assets/ship.webp";
    this.fire = new Image();
    this.fire.src = "assets/ship_fire.webp";
    this.star = new Image();
    this.star.src = "assets/star_gold.webp";
    this.ship.onload = this.fire.onload = this.star.onload = () => this.draw();
    this.frame = null;
    this.run = null;
  }
  resize() {
    if (!this.run) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const gap = 18;
    this.cell = Math.max(
      1,
      Math.min(
        (rect.width - gap * 2) / this.run.cols,
        (rect.height - gap * 2) / this.run.rows,
        110,
      ),
    );
    this.width = this.cell * this.run.cols + gap * 2;
    this.height = this.cell * this.run.rows + gap * 2;
    const density = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * density);
    this.canvas.height = Math.round(this.height * density);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(density, 0, 0, density, 0, 0);
    this.offset = gap;
    this.draw();
  }
  setRun(run) {
    this.cancel();
    this.run = run;
    this.visualPosition = null;
    this.resize();
  }
  draw() {
    if (!this.run || !this.cell) return;
    const ctx = this.ctx,
      size = this.cell,
      inset = this.offset;
    const { cols, rows, grid, position, visited } = this.run;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = "#142440eb";
    ctx.fillRect(inset, inset, cols * size, rows * size);
    ctx.fillStyle = "#9ab6c244";
    visited.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      ctx.beginPath();
      ctx.arc(
        inset + (x + 0.5) * size,
        inset + (y + 0.5) * size,
        size * 0.055,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    ctx.strokeStyle = "#a6d5dc";
    ctx.lineWidth = Math.max(3, Math.min(7, size * 0.07));
    ctx.lineCap = "round";
    ctx.beginPath();
    // Each shared wall is drawn once, in a single path.
    grid.forEach((row, y) =>
      row.forEach((cell, x) => {
        const px = inset + x * size,
          py = inset + y * size;
        if (cell.walls.top) {
          ctx.moveTo(px, py);
          ctx.lineTo(px + size, py);
        }
        if (cell.walls.left) {
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + size);
        }
        if (x === cols - 1 && cell.walls.right) {
          ctx.moveTo(px + size, py);
          ctx.lineTo(px + size, py + size);
        }
        if (y === rows - 1 && cell.walls.bottom) {
          ctx.moveTo(px, py + size);
          ctx.lineTo(px + size, py + size);
        }
      }),
    );
    ctx.stroke();
    Object.entries(DIRECTIONS).forEach(([direction, step]) => {
      if (!this.run.canMove(direction)) return;
      ctx.fillStyle = "#f7cf6860";
      ctx.beginPath();
      ctx.arc(
        inset + (position.x + step.x + 0.5) * size,
        inset + (position.y + step.y + 0.5) * size,
        size * 0.12,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });
    this.drawImage(this.star, cols - 1, rows - 1, 0.8, 0);
    const player = this.visualPosition || position;
    if (this.visualPosition && !KiwiPlay.reducedMotion())
      this.drawImage(this.fire, player.x, player.y, 0.72, DIRECTIONS[this.run.direction].angle);
    this.drawImage(
      this.ship,
      player.x,
      player.y,
      0.72,
      DIRECTIONS[this.run.direction].angle,
    );
  }
  drawImage(image, x, y, scale, angle) {
    if (!image.complete || !image.naturalWidth) return;
    const ctx = this.ctx,
      size = this.cell * scale;
    ctx.save();
    ctx.translate(
      this.offset + (x + 0.5) * this.cell,
      this.offset + (y + 0.5) * this.cell,
    );
    ctx.rotate(angle);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  animate(from, done) {
    const start = performance.now();
    const target = { ...this.run.position };
    const duration = KiwiPlay.reducedMotion() ? 0 : 160;
    const tick = (now) => {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1;
      this.visualPosition = {
        x: from.x + (target.x - from.x) * progress,
        y: from.y + (target.y - from.y) * progress,
      };
      this.draw();
      if (progress < 1) this.frame = requestAnimationFrame(tick);
      else {
        this.frame = null;
        this.visualPosition = null;
        this.draw();
        done();
      }
    };
    this.frame = requestAnimationFrame(tick);
  }
  cancel() {
    cancelAnimationFrame(this.frame);
    this.frame = null;
    this.visualPosition = null;
  }
  cellAt(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.floor((clientX - rect.left - this.offset) / this.cell),
      y: Math.floor((clientY - rect.top - this.offset) / this.cell),
    };
  }
}
