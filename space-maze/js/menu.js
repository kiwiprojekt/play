class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    init(data) {
        this.fromGame = data.fromGame || false;
    }

    create() {
        this.setupResize();
        this.drawScene();
        this.events.on('resize', () => this.drawScene());
        this.createMuteButton();
        if (this.fromGame) {
            this.sound.play('lose', { volume: 0.5 });
        }
    }

    drawScene() {
        this.children.removeAll();
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.unlockedLevel = this.getUnlockedLevel();
        this.completedLevel = this.getCompletedLevel();
        this.createBackButton();
        this.createBackground(w, h);
        this.createStars(w, h);
        this.drawMilkyWay(w, h);
        this.createTitle(w, h);
        this.createLevelButtons(w, h);
        this.createInstructions(w, h);
    }

    createBackButton() {
        const backBg = this.add.graphics();
        backBg.fillStyle(0x000000, 0.3);
        backBg.fillRoundedRect(10, 10, 110, 40, 8);
        backBg.setDepth(5);

        const backBtn = this.add.text(20, 25, '🥝 KiwiPlay', {
            fontSize: '18px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#888888'
        }).setInteractive({ useHandCursor: true });
        backBtn.setDepth(6);

        backBtn.on('pointerover', () => backBtn.setColor('#ffffff'));
        backBtn.on('pointerout', () => backBtn.setColor('#888888'));
        backBtn.on('pointerdown', () => {
            window.location.href = 'https://play.kiwiprojekt.pl';
        });
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

    setupResize() {
        window.addEventListener('resize', () => {
            this.drawScene();
        });
    }

    createBackground(w, h) {
        const bg = this.add.image(w / 2, h / 2, 'bg1');
        bg.setDisplaySize(w, h);
        bg.setDepth(0);
    }

    createStars(w, h) {
        const graphics = this.add.graphics();
        graphics.setDepth(1);
        for (let i = 0; i < 300; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.2, 0.9);
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
    }

    drawMilkyWay(w, h) {
        const centerX = w / 2;
        const centerY = h / 2 + 30;
        
        const graphics = this.add.graphics();
        graphics.setDepth(2);

        for (let arm = 0; arm < 2; arm++) {
            const armOffset = arm * Math.PI;
            graphics.lineStyle(60 - arm * 20, 0x4a4ae0, 0.15);
            
            let path = [];
            for (let t = 0; t < 4 * Math.PI; t += 0.1) {
                const angle = t * 0.8 + armOffset;
                const radius = 30 + t * 35;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.6;
                path.push({ x, y });
            }
            
            for (let i = 0; i < path.length - 1; i++) {
                graphics.lineBetween(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
            }
        }
    }

    getUnlockedLevel() {
        const saved = localStorage.getItem('spaceMazeUnlocked');
        return parseInt(saved) || 1;
    }

    getCompletedLevel() {
        const saved = localStorage.getItem('spaceMazeCompleted');
        return parseInt(saved) || 0;
    }

    saveUnlockedLevel(level) {
        if (level > this.unlockedLevel) {
            this.unlockedLevel = level;
            localStorage.setItem('spaceMazeUnlocked', level.toString());
        }
    }

    getSpiralPosition(index, total, w, h) {
        const centerX = w / 2;
        const centerY = h / 2 + 30;
        
        const angle = index * 0.8 + Math.PI * 0.5;
        const radius = 50 + index * 28;
        
        return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius * 0.6
        };
    }

    createTitle(w, h) {
        this.add.text(w / 2, 60, 'SPACE MAZE', {
            fontSize: '52px',
            fontFamily: "'sairaStencil', Arial Black",
            color: '#ffe600',
            stroke: '#004422',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(w / 2, 110, 'NAVIGATE THE GALAXY', {
            fontSize: '22px',
            fontFamily: "'sairaStencil', Arial",
            color: '#aaaaaa'
        }).setOrigin(0.5);
    }

    createLevelButtons(w, h) {
        const buttonSize = 56;

        for (let level = 1; level <= 20; level++) {
            const pos = this.getSpiralPosition(level - 1, 20, w, h);
            this.createLevelButton(pos.x, pos.y, level, buttonSize);
        }
    }

    createLevelButton(x, y, level, size) {
        const container = this.add.container(x, y);
        const isCompleted = level <= this.completedLevel;
        const isUnlocked = level <= this.unlockedLevel;

        let starType = 'starLocked';
        if (isCompleted) {
            starType = 'starGold';
        } else if (isUnlocked) {
            starType = 'starGlow';
        }

        const star = this.add.image(0, 0, starType);
        star.setScale(size / 250);

        const text = this.add.text(0, 0, level.toString(), {
            fontSize: '22px',
            fontFamily: "'sairaStencil', Arial Black",
            color: isUnlocked ? '#000000' : '#888888'
        }).setOrigin(0.5);

        container.add([star, text]);
        container.setSize(size * 1.2, size * 1.2);
        container.setDepth(10);

        if (isUnlocked) {
            container.setInteractive({ useHandCursor: true });

            container.on('pointerover', () => {
                star.setScale(size / 250 * 1.15);
                this.showLevelInfo(level);
            });

            container.on('pointerout', () => {
                star.setScale(size / 250);
                this.hideLevelInfo();
            });

            container.on('pointerdown', () => {
                this.startGame(level);
            });
        }
    }

    getDifficultyColor(level) {
        if (level <= 5) return { main: 0x2ecc71, hover: 0x50fa7b, border: 0x27ae60 };
        if (level <= 10) return { main: 0x3498db, hover: 0x5dade2, border: 0x2980b9 };
        if (level <= 15) return { main: 0x9b59b6, hover: 0xaf7ac5, border: 0x8e44ad };
        return { main: 0xe74c3c, hover: 0xec7063, border: 0xc0392b };
    }

    showLevelInfo(level) {
        if (this.levelInfoText) this.levelInfoText.destroy();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const difficulty = CONFIG.difficulty[level];
        this.levelInfoText = this.add.text(w / 2, h - 50, 
            `${STAR_NAMES[level - 1].toUpperCase()}  •  GRID: ${difficulty.cols}x${difficulty.rows}`, {
            fontSize: '20px',
            fontFamily: "'sairaStencil', Arial",
            color: '#ffff00'
        }).setOrigin(0.5).setDepth(100);
    }

    hideLevelInfo() {
        if (this.levelInfoText) {
            this.levelInfoText.destroy();
            this.levelInfoText = null;
        }
    }

    createInstructions(w, h) {
        this.add.text(w / 2, h - 15, 
            'CLICK A STAR TO START  •  ARROW KEYS OR MOUSE TO NAVIGATE', {
            fontSize: '14px',
            fontFamily: "'sairaStencil', Arial",
            color: '#888888'
        }).setOrigin(0.5);
    }

    startGame(level) {
        this.sound.play('pickup', { volume: 0.5 });
        this.scene.start('GameScene', { level: level });
    }
}
