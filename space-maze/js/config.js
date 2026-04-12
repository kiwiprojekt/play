const STAR_NAMES = [
    "Proxima",
    "Sirius",
    "Vega",
    "Polaris",
    "Rigel",
    "Betelgeuse",
    "Altair",
    "Antares",
    "Deneb",
    "Arcturus",
    "Capella",
    "Aldebaran",
    "Spica",
    "Regulus",
    "Fomalhaut",
    "Canopus",
    "Bellatrix",
    "Procyon",
    "Achernar",
    "Castor"
];

const CONFIG = {
    baseWidth: window.innerWidth,
    baseHeight: window.innerHeight,
    mazePadding: 80,
    wallThickness: 10,
    cellSize: 40,
    playerSize: 30,
    goalSize: 35,
    get soundMuted() {
        return localStorage.getItem('soundMuted') === 'true';
    },
    set soundMuted(value) {
        localStorage.setItem('soundMuted', value ? 'true' : 'false');
    },
    wallColors: [0x2861DF, 0xF6D768, 0xDF584F, 0xEAE7D9],
    difficulty: {
        1: { cols: 6, rows: 5 },
        2: { cols: 7, rows: 5 },
        3: { cols: 7, rows: 6 },
        4: { cols: 8, rows: 6 },
        5: { cols: 8, rows: 7 },
        6: { cols: 9, rows: 7 },
        7: { cols: 9, rows: 8 },
        8: { cols: 10, rows: 8 },
        9: { cols: 10, rows: 9 },
        10: { cols: 11, rows: 9 },
        11: { cols: 11, rows: 10 },
        12: { cols: 12, rows: 10 },
        13: { cols: 12, rows: 11 },
        14: { cols: 13, rows: 11 },
        15: { cols: 13, rows: 12 },
        16: { cols: 14, rows: 12 },
        17: { cols: 14, rows: 13 },
        18: { cols: 15, rows: 13 },
        19: { cols: 15, rows: 14 },
        20: { cols: 16, rows: 14 }
    }
};
