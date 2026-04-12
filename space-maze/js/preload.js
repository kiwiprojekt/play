class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        this.load.image('ship', 'assets/ship.png');
        this.load.image('fire', 'assets/ship_fire.png');
        this.load.image('star', 'assets/star.png');
        this.load.image('starGold', 'assets/star_gold.png');
        this.load.image('starGlow', 'assets/star_glow.png');
        this.load.image('starLocked', 'assets/star_silver.png');
        this.load.image('bg', 'assets/backgrounds/bg.png');
        this.load.image('bg1', 'assets/backgrounds/bg1.png');
        this.load.audio('rumble', 'assets/rumble2.ogg');
        this.load.audio('laser', 'assets/laser3.ogg');
        this.load.audio('pickup', 'assets/pickup3.ogg');
        this.load.audio('lose', 'assets/lose3.ogg');
        this.load.once('complete', () => {
            document.fonts.ready.then(() => {
                this.time.delayedCall(100, () => {
                    this.scene.start('MenuScene');
                });
            });
        });
    }

    create() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const graphics = this.add.graphics();
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, w);
            const y = Phaser.Math.Between(0, h);
            const size = Phaser.Math.FloatBetween(1, 3);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            graphics.fillStyle(0xffffff, alpha);
            graphics.fillCircle(x, y, size);
        }
    }
}
