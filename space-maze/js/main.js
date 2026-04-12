const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    parent: 'game-container',
    scene: [PreloadScene, MenuScene, GameScene],
    backgroundColor: 0x0a0a2e,
    audio: {
        disableWebAudio: false
    }
};

const game = new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scene.scenes.forEach(scene => {
        if (scene.events) {
            scene.events.emit('resize');
        }
    });
});
