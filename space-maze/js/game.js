class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.level = data.level || 1;
        this.difficulty = CONFIG.difficulty[this.level];
        this.maze = null;
        this.cellSize = 0;
        this.mazeOffsetX = 0;
        this.mazeOffsetY = 0;
        this.player = null;
        this.goal = null;
        this.playerCell = { x: 0, y: 0 };
        this.lastDirection = 'top';
        this.isGameOver = false;
        this.moveQueue = [];
        this.isAnimating = false;
        this.wallGraphics = null;
        this.currentMoveDirection = null;
    }

    create() {
        this.drawScene();
        this.createMuteButton();
    }

    drawScene() {
        this.children.removeAll();
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.createBackground(w, h);
        this.createStars(w, h);
        this.createMaze(w, h);
        this.createGoal();
        this.createPlayer();
        this.createUI();
        this.setupInput();
    }

    createMuteButton() {
        const w = window.innerWidth;
        const muteBg = this.add.graphics();
        muteBg.fillStyle(0x000000, 0.3);
        muteBg.fillRoundedRect(w - 130, 10, 120, 50, 8);
        muteBg.setDepth(5);

        const muteBtn = this.add.text(w - 110, 25, CONFIG.soundMuted ? 'sound: off' : 'sound: on ', {
            fontSize: '18px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#888888'
        }).setInteractive({ useHandCursor: true });
        muteBtn.setDepth(6);
        this.muteBtn = muteBtn;
        this.sound.mute = CONFIG.soundMuted;

        muteBtn.on('pointerover', () => muteBtn.setColor('#ffffff'));
        muteBtn.on('pointerout', () => muteBtn.setColor('#888888'));
        muteBtn.on('pointerdown', () => {
            CONFIG.soundMuted = !CONFIG.soundMuted;
            this.sound.mute = CONFIG.soundMuted;
            muteBtn.setText(CONFIG.soundMuted ? 'sound: off' : 'sound: on ');
        });
    }

    playSound(key, options) {
        try {
            this.sound.play(key, options);
        } catch (e) {}
    }

    createBackground(w, h) {
        const bg = this.add.image(w / 2, h / 2, 'bg');
        bg.setDisplaySize(w, h);
    }

    createStars(w, h) {
        const graphics = this.add.graphics();
        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.FloatBetween(1, 2.5);
            const alpha = Phaser.Math.FloatBetween(0.3, 0.8);
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
    }

    createMaze(w, h) {
        const mazeGen = new MazeGenerator(this.difficulty.cols, this.difficulty.rows);
        this.maze = mazeGen.generate();

        const maxMazeWidth = w - CONFIG.mazePadding * 2;
        const maxMazeHeight = h - CONFIG.mazePadding * 2 - 50;

        this.cellSize = Math.min(
            Math.floor(maxMazeWidth / this.difficulty.cols),
            Math.floor(maxMazeHeight / this.difficulty.rows)
        );

        const mazeWidth = this.cellSize * this.difficulty.cols;
        const mazeHeight = this.cellSize * this.difficulty.rows;

        this.mazeOffsetX = (w - mazeWidth) / 2;
        this.mazeOffsetY = ((h - 50) - mazeHeight) / 2;

        this.drawMaze(w, h);
    }

    drawMaze(w, h) {
        if (this.wallGraphics) this.wallGraphics.destroy();

        this.wallGraphics = this.add.graphics();
        this.wallGraphics.setDepth(1);

        this.wallGraphics.fillStyle(0x000000, 0.3);
        this.wallGraphics.fillRect(
            this.mazeOffsetX,
            this.mazeOffsetY,
            this.difficulty.cols * this.cellSize,
            this.difficulty.rows * this.cellSize
        );

        const wallColor = CONFIG.wallColors[Math.floor(Math.random() * CONFIG.wallColors.length)];
        const wallThickness = CONFIG.wallThickness;
        const wla = wallThickness / 2;
        this.wallGraphics.lineStyle(wallThickness, wallColor, 1);

        for (let y = 0; y < this.difficulty.rows; y++) {
            for (let x = 0; x < this.difficulty.cols; x++) {
                const cell = this.maze[y][x];
                const px = this.mazeOffsetX + x * this.cellSize;
                const py = this.mazeOffsetY + y * this.cellSize;

                if (cell.walls.top) {
                    this.wallGraphics.lineBetween(px - wla, py, px + this.cellSize + wla, py);
                }
                if (cell.walls.right) {
                    this.wallGraphics.lineBetween(px + this.cellSize, py - wla, px + this.cellSize, py + this.cellSize + wla);
                }
                if (cell.walls.bottom) {
                    this.wallGraphics.lineBetween(px - wla, py + this.cellSize, px + this.cellSize + wla, py + this.cellSize);
                }
                if (cell.walls.left) {
                    this.wallGraphics.lineBetween(px, py - wla, px, py + this.cellSize + wla);
                }
            }
        }
    }

    createPlayer() {
        const startPos = this.getCellCenter(0, 0);
        const size = this.cellSize * 0.7;

        this.playerFire = this.add.image(startPos.x, startPos.y, 'fire');
        this.playerFire.setDisplaySize(size, size);
        this.playerFire.setOrigin(0.5);
        this.playerFire.setVisible(false);
        this.playerFire.setDepth(5);

        this.player = this.add.image(startPos.x, startPos.y, 'ship');
        this.player.setDisplaySize(size, size);
        this.player.setOrigin(0.5);
        this.player.angle = 0;
        this.player.setDepth(10);

        this.swivelAngle = 0;
        this.swivelSpeed = 0.05;

        this.playerSize = size;
        this.playerCell = { x: 0, y: 0 };
        this.lastDirection = 'top';
    }

    createGoal() {
        const endPos = this.getCellCenter(this.difficulty.cols - 1, this.difficulty.rows - 1);
        const size = this.cellSize * 0.35;

        this.goal = this.add.image(endPos.x, endPos.y, 'star');
        this.goal.setDisplaySize(size, size);
        this.goal.setOrigin(0.5);
        this.goal.setDepth(10);

        this.tweens.add({
            targets: this.goal,
            angle: 360,
            duration: 12000,
            repeat: -1,
            ease: 'Linear'
        });
    }

    getCellCenter(cellX, cellY) {
        return {
            x: this.mazeOffsetX + cellX * this.cellSize + this.cellSize / 2,
            y: this.mazeOffsetY + cellY * this.cellSize + this.cellSize / 2
        };
    }

    createUI() {
        const w = window.innerWidth;

        const backBg = this.add.graphics();
        backBg.fillStyle(0x000000, 0.3);
        backBg.fillRoundedRect(10, 10, 120, 50, 8);
        backBg.setDepth(5);

        const backButton = this.add.text(20, 25, '← GALAXY', {
            fontSize: '18px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#888888'
        }).setInteractive({ useHandCursor: true });
        backButton.setDepth(6);

        backButton.on('pointerover', () => backButton.setColor('#ffffff'));
        backButton.on('pointerout', () => backButton.setColor('#888888'));
        backButton.on('pointerdown', () => {
            this.scene.stop();
            this.scene.start('MenuScene', { fromGame: true });
        });

        this.add.text(w / 2, 30, STAR_NAMES[this.level - 1].toUpperCase(), {
            fontSize: '26px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#ffe600'
        }).setOrigin(0.5).setDepth(6);

        this.add.text(w / 2, 58, `LEVEL ${this.level}`, {
            fontSize: '14px',
            fontFamily: "'sairaStencil', Arial",
            color: '#888888'
        }).setOrigin(0.5).setDepth(6);
    }

    setupInput() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = {
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
        };

        this.input.on('pointerdown', (pointer) => {
            if (this.isGameOver) return;
            this.handleClick(pointer.x, pointer.y);
        });
    }

    handleClick(clickX, clickY) {
        const cellX = Math.floor((clickX - this.mazeOffsetX) / this.cellSize);
        const cellY = Math.floor((clickY - this.mazeOffsetY) / this.cellSize);

        if (cellX < 0 || cellX >= this.difficulty.cols || cellY < 0 || cellY >= this.difficulty.rows) return;

        let dx = cellX - this.playerCell.x;
        let dy = cellY - this.playerCell.y;

        if (Math.abs(dx) + Math.abs(dy) !== 1) return;

        let direction = null;
        if (dx === 1 && !this.canMove(this.playerCell.x, this.playerCell.y, 'right')) return;
        if (dx === -1 && !this.canMove(this.playerCell.x, this.playerCell.y, 'left')) return;
        if (dy === 1 && !this.canMove(this.playerCell.x, this.playerCell.y, 'bottom')) return;
        if (dy === -1 && !this.canMove(this.playerCell.x, this.playerCell.y, 'top')) return;

        if (dx === 1) direction = 'right';
        else if (dx === -1) direction = 'left';
        else if (dy === 1) direction = 'bottom';
        else if (dy === -1) direction = 'top';

        if (direction) this.queueMove(direction);
    }

    canMove(cellX, cellY, direction) {
        const cell = this.maze[cellY][cellX];
        return !cell.walls[direction];
    }

    queueMove(direction) {
        if (this.isGameOver) return;

        if (!this.isAnimating) {
            this.executeMove(direction);
        } else if (this.moveQueue.length < 1) {
            const lastDir = this.getLastQueuedOrCurrentDirection();
            if (!this.isOppositeDirection(direction, lastDir)) {
                this.moveQueue.push(direction);
            }
        }
    }

    getLastQueuedOrCurrentDirection() {
        if (this.moveQueue.length > 0) {
            return this.moveQueue[this.moveQueue.length - 1];
        }
        return this.lastDirection;
    }

    isOppositeDirection(dir1, dir2) {
        const opposites = {
            'left': 'right',
            'right': 'left',
            'top': 'bottom',
            'bottom': 'top'
        };
        return opposites[dir1] === dir2;
    }

    isKeyDown(direction) {
        switch (direction) {
            case 'left': return this.cursors.left.isDown || this.wasd.left.isDown;
            case 'right': return this.cursors.right.isDown || this.wasd.right.isDown;
            case 'top': return this.cursors.up.isDown || this.wasd.up.isDown;
            case 'bottom': return this.cursors.down.isDown || this.wasd.down.isDown;
            default: return false;
        }
    }

    executeMove(direction) {
        const cell = this.maze[this.playerCell.y][this.playerCell.x];
        if (cell.walls[direction]) return;

        this.currentMoveDirection = direction;
        let newX = this.playerCell.x;
        let newY = this.playerCell.y;

        switch (direction) {
            case 'right': newX++; break;
            case 'left': newX--; break;
            case 'bottom': newY++; break;
            case 'top': newY--; break;
        }

        const targetPos = this.getCellCenter(newX, newY);
        const targetRotation = this.getRotationForDirection(direction);
        const finalRotation = this.getShortestRotation(this.player.angle, targetRotation);

        this.isAnimating = true;
        this.playerFire.setPosition(this.player.x, this.player.y);
        this.playerFire.setAngle(this.player.angle);
        this.playerFire.setVisible(true);

        this.playSound('rumble', { volume: 0.5 });

        this.tweens.add({
            targets: [this.player, this.playerFire],
            x: targetPos.x,
            y: targetPos.y,
            angle: finalRotation,
            duration: 400,
            ease: 'Linear.easeNone',
            onComplete: () => {
                this.playerFire.setVisible(false);
                this.isAnimating = false;
                this.playerCell = { x: newX, y: newY };
                this.lastDirection = direction;
                this.currentMoveDirection = null;

                if (newX === this.difficulty.cols - 1 && newY === this.difficulty.rows - 1) {
                    this.playSound('laser', { volume: 0.5 });
                    this.popEffect(targetPos.x, targetPos.y);
                    this.time.delayedCall(400, () => this.winGame());
                } else if (this.moveQueue.length > 0) {
                    const nextDir = this.moveQueue.shift();
                    this.executeMove(nextDir);
                } else if (this.isKeyDown(direction)) {
                    this.queueMove(direction);
                }
            }
        });
    }

    popEffect(x, y) {
        if (this.goal) {
            this.tweens.add({
                targets: this.goal,
                scale: 2,
                alpha: 0,
                duration: 300,
                ease: 'Quad.easeOut',
                onComplete: () => this.goal.destroy()
            });
        }

        const ring = this.add.graphics();
        ring.x = x;
        ring.y = y;
        ring.lineStyle(4, 0xffdd00, 1);
        ring.strokeCircle(0, 0, this.playerSize * 0.5);

        this.tweens.add({
            targets: ring,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 400,
            ease: 'Quad.easeOut',
            onComplete: () => ring.destroy()
        });
    }

    getRotationForDirection(direction) {
        switch (direction) {
            case 'right': return 90;
            case 'left': return -90;
            case 'top': return 0;
            case 'bottom': return 180;
            default: return 0;
        }
    }

    getShortestRotation(currentAngle, targetAngle) {
        let diff = targetAngle - currentAngle;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        return currentAngle + diff;
    }

    winGame() {
        this.isGameOver = true;
        this.completeLevel();
        this.unlockNextLevel();
        const nextLevel = Math.min(this.level + 1, 20);
        this.showEndScreen(true, nextLevel);
    }

    completeLevel() {
        const saved = localStorage.getItem('spaceMazeCompleted');
        const current = parseInt(saved) || 0;
        if (this.level >= current) {
            localStorage.setItem('spaceMazeCompleted', String(this.level));
        }
    }

    unlockNextLevel() {
        const saved = localStorage.getItem('spaceMazeUnlocked');
        const current = parseInt(saved) || 1;
        if (this.level >= current) {
            localStorage.setItem('spaceMazeUnlocked', String(this.level + 1));
        }
    }

    showEndScreen(won, level) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const starName = STAR_NAMES[level - 1].toUpperCase();
        this.autoAdvanced = false;

        const overlay = this.add.graphics();
        overlay.setDepth(100);
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, w, h);

        this.add.text(w / 2, h / 2 - 70, 'MISSION COMPLETE!', {
            fontSize: '42px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#ffe600'
        }).setOrigin(0.5).setDepth(100);

        this.add.text(w / 2, h / 2 - 20, starName, {
            fontSize: '32px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(100);

        this.add.text(w / 2, h / 2 + 15, 'NAVIGATED SUCCESSFULLY!', {
            fontSize: '20px',
            fontFamily: "'sairaStencil', Arial",
            color: '#aaaaaa'
        }).setOrigin(0.5).setDepth(100);

        const buttonY = h / 2 + 120;
        const buttonSize = 100;
        const spacing = 10;
        
        this.createCircleButton(w / 2 - spacing - buttonSize, buttonY, '←', 0x888888, buttonSize, 'back');
        
        if (won && level < 20) {
            this.createProgressButton(w / 2 + spacing + buttonSize, buttonY, '→', 0x2ecc71, buttonSize, 'next');

            this.time.delayedCall(4000, () => {
                if (!this.autoAdvanced) {
                    this.autoAdvanced = true;
                    this.scene.start('GameScene', { level: level + 1 });
                }
            });
        }

        this.events.on('next', () => {
            this.scene.start('GameScene', { level: level + 1 });
        });
        this.events.on('back', () => {
            this.scene.start('MenuScene', { fromGame: true });
        });
    }

    createProgressButton(x, y, text, color, size, eventName) {
        const container = this.add.container(x, y);
        container.setDepth(100);
        
        const bgCircle = this.add.graphics();
        bgCircle.fillStyle(0x333333, 1);
        bgCircle.fillCircle(0, 0, size / 2);

        const progressCircle = this.add.graphics();

        const iconText = this.add.text(0, 0, text, {
            fontSize: Math.floor(size * 0.5) + 'px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([bgCircle, progressCircle, iconText]);
        container.setSize(size, size);
        container.setInteractive({ useHandCursor: true });

        let progress = 0;
        this.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 4000,
            onUpdate: (tween) => {
                progress = tween.getValue();
                progressCircle.clear();
                progressCircle.lineStyle(6, color, 1);
                progressCircle.beginPath();
                progressCircle.arc(0, 0, size / 2 - 8, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + progress * 3.6), false);
                progressCircle.strokePath();
            }
        });

        container.on('pointerover', () => {
            bgCircle.clear();
            bgCircle.fillStyle(Phaser.Display.Color.ValueToColor(color).darken(20).color, 1);
            bgCircle.fillCircle(0, 0, size / 2);
        });

        container.on('pointerout', () => {
            bgCircle.clear();
            bgCircle.fillStyle(0x333333, 1);
            bgCircle.fillCircle(0, 0, size / 2);
        });

        container.on('pointerdown', () => {
            this.autoAdvanced = true;
            this.events.emit(eventName);
        });

        return container;
    }

    createCircleButton(x, y, text, color, size, eventName) {
        const container = this.add.container(x, y);
        container.setDepth(100);

        const btnBg = this.add.graphics();
        btnBg.fillStyle(color, 1);
        btnBg.fillCircle(0, 0, size / 2);

        const btnText = this.add.text(0, 0, text, {
            fontSize: Math.floor(size * 0.5) + 'px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#ffffff'
        }).setOrigin(0.5);

        container.add([btnBg, btnText]);
        container.setSize(size, size);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(Phaser.Display.Color.ValueToColor(color).lighten(20).color, 1);
            btnBg.fillCircle(0, 0, size / 2);
        });

        container.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(color, 1);
            btnBg.fillCircle(0, 0, size / 2);
        });

        container.on('pointerdown', () => {
            this.autoAdvanced = true;
            this.events.emit(eventName);
        });

        return container;
    }

    update() {
        if (this.isGameOver) return;

        if (!this.isAnimating) {
            this.swivelAngle += this.swivelSpeed;
            this.player.angle = this.getShipAngle() + Math.sin(this.swivelAngle) * 5;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.wasd.left)) {
            this.queueMove('left');
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.wasd.right)) {
            this.queueMove('right');
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up)) {
            this.queueMove('top');
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.wasd.down)) {
            this.queueMove('bottom');
        }
    }

    getShipAngle() {
        switch (this.lastDirection) {
            case 'right': return 90;
            case 'left': return -90;
            case 'top': return 0;
            case 'bottom': return 180;
            default: return 0;
        }
    }
}
