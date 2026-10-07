/*
 * Betűkaland: global configuration.
 * Everything a teacher or developer is likely to tweak lives here:
 * screen size, regions and their keys, keyboard layout, finger colours,
 * star thresholds, speed targets, music per scene.
 */
window.BK = window.BK || {};

BK.VERSION = '0.6.1';

// Test mode for the teacher: open the game with ?debug at the end of the address.
// Every region and level is open; in a level Tab finishes the current word and
// Ctrl+Enter finishes the whole level. Profiles and saves work as usual.
BK.DEBUG = typeof location !== 'undefined' && /[?&]debug\b/.test(location.search);
BK.SAVE_KEY = 'betukaland.v1';

// Base canvas. The game is drawn at this size and scaled by a whole number.
BK.W = 384;
BK.H = 216;

// Vertical layout of the level screen (pixels in base resolution)
BK.GROUND_Y = 124;      // top of the ground strip
BK.KB_TOP = 146;        // top of the on-screen keyboard panel
BK.HERO_X = 64;
BK.TARGET_X = 236;      // where an encounter stops

// ---------------------------------------------------------------------------
// Keyboards. The game reads the CHARACTER typed (event.key), not the key
// position, so any machine works; the layout only decides what the on-screen
// keyboard looks like, which finger is shown, and whether accented letters
// can be taught. Each child picks it in Settings (Hungarian by default).
//   hu: standard Hungarian QWERTZ (ISO). The Mac magyar layout is the same for
//       every key the game teaches.
//   us: English (US) QWERTY. No accented letters: every á é í ó ö ő ú ü ű is
//       left out of the lessons, and Region 5 becomes a review region.
// ---------------------------------------------------------------------------
BK.LAYOUTS = {
  hu: {
    id: 'hu', name: 'Magyar', accents: true,
    rows: [
      { offset: 0,  keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'ö', 'ü', 'ó'] },
      { offset: 8,  keys: ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'ő', 'ú'] },
      { offset: 11, keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'é', 'á', 'ű'] },
      { offset: 3,  keys: ['í', 'y', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '-'] },
    ],
    // characters produced with Shift: shifted char -> base key
    shift: { '§': '0', "'": '1', '"': '2', '+': '3', '!': '4', '%': '5', '/': '6', '=': '7', '(': '8', ')': '9',
      '?': ',', ':': '.', '_': '-' },
    // fingers: 0..3 left pinky..index, 4..7 right index..pinky, 8 thumbs
    fingers: { 0: '0 1 q a í y', 1: '2 w s x', 2: '3 e d c', 3: '4 5 r t f g v b',
      4: '6 7 z u h j n m', 5: '8 i k ,', 6: '9 o l .', 7: 'ö ü ó p ő ú é á ű -' },
  },
  us: {
    id: 'us', name: 'English (US)', accents: false,
    rows: [
      { offset: 0,  keys: ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='] },
      { offset: 8,  keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'] },
      { offset: 11, keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"] },
      { offset: 19, keys: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'] },
    ],
    shift: { '~': '`', '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
      '_': '-', '+': '=', '{': '[', '}': ']', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' },
    fingers: { 0: '` 1 q a z', 1: '2 w s x', 2: '3 e d c', 3: '4 5 r t f g v b',
      4: '6 7 y u h j n m', 5: '8 i k ,', 6: '9 o l .', 7: "0 - = p [ ] ; ' /" },
  },
};
BK.ACCENTS = 'áéíóöőúüűÁÉÍÓÖŐÚÜŰ';
BK.layoutOf = function (p) { return BK.LAYOUTS[(p && p.settings && p.settings.layout) || 'hu'] || BK.LAYOUTS.hu; };
// Make a layout the active one: BK.layout, BK.KB_ROWS, BK.SHIFT_MAP, BK.FINGER_OF
BK.setLayout = function (id) {
  var L = BK.LAYOUTS[id] || BK.LAYOUTS.hu;
  BK.layout = L;
  BK.KB_ROWS = L.rows;
  BK.SHIFT_MAP = L.shift;
  BK.FINGER_OF = { ' ': 8 };
  Object.keys(L.fingers).forEach(function (f) {
    L.fingers[f].split(' ').forEach(function (k) { if (k) BK.FINGER_OF[k] = +f; });
  });
};
BK.setLayout('hu');

// Fingers: 0..3 left pinky..index, 4..7 right index..pinky, 8 thumbs
BK.FINGER_NAMES = ['bal kisujj', 'bal gyűrűsujj', 'bal középső ujj', 'bal mutatóujj',
  'jobb mutatóujj', 'jobb középső ujj', 'jobb gyűrűsujj', 'jobb kisujj', 'hüvelykujj'];
BK.FINGER_COLOURS = [0xeb7896, 0xf5aa50, 0xf0dc5a, 0x78c86e, 0x64bedc, 0x8296f0, 0xbe82e6, 0xf08cc8, 0xc8bcb4];

// ---------------------------------------------------------------------------
// Regions. "keys" are the NEW lowercase keys of the region; a region also
// has every key of earlier regions. "capitals" turns on Shift for letters.
// ---------------------------------------------------------------------------
BK.REGIONS = [
  { id: 1, name: 'Napos rét', keys: 'asdfjklé', sky: [1, 5, 2, 1],
    walkers: ['frog', 'mush'], flyers: ['gull'], mini: 'toad',
    boss: 'frogknight', bossName: 'Béka Lovag', bossIntro: 'Itt a Béka Lovag! Írd be a mondatait!', bossOutro: 'Megszelídítetted a Béka Lovagot!',
    music: ['m_level1', 'm_level2', 'm_level3'], playable: true },
  { id: 2, name: 'Homokos part', keys: 'ghqwertzuiop', backdrop: 'beach', bdOffset: 84, ground: 'ground_sand', decor: ['palm'],
    walkers: ['crab', 'sandbug'], flyers: ['gull'], mini: 'shell',
    boss: 'bigbird', bossName: 'Kócos Sirály', bossIntro: 'Leszállt a Kócos Sirály!', bossOutro: 'A Kócos Sirály elrepült a barátaihoz!',
    music: ['m_party', 'm_level1', 'm_party'], playable: true },
  { id: 3, name: 'Kagylós öböl', keys: 'yxcvbnm,.-', backdrop: 'beach', bdOffset: 84, bdTint: [0xffd8c0, 0xffc8b0], ground: 'ground_sand', decor: ['palm'],
    walkers: ['starfish', 'octopus', 'crab'], flyers: ['gull'], mini: 'shell', miniTint: 0xc0d0ff,
    boss: 'bigbird', bossTint: 0x9fb4ff, bossName: 'Viharmadár', bossIntro: 'Megjött a Viharmadár!', bossOutro: 'Elállt a vihar!',
    music: ['m_70s', 'm_level2', 'm_70s'], playable: true },
  { id: 4, name: 'Hegyi ösvény', keys: '', capitals: true, backdrop: 'mountain', bdOffset: 76, ground: 'ground_stone', decor: [],
    walkers: ['frog', 'mush', 'sandbug'], tint: 0xd8ccff, flyers: ['gull'], mini: 'toad', miniTint: 0xc8c0ff,
    boss: 'babydragon', bossName: 'Sárkányfióka', bossIntro: 'Egy Sárkányfióka a hegytetőn!', bossOutro: 'A Sárkányfióka hazarepült!',
    music: ['m_journey', 'm_level3', 'm_journey'], playable: true },
  { id: 5, name: 'Vörös kanyon', keys: 'áíóöőúüű', backdrop: 'canyon', bdOffset: 76, ground: 'ground_rock', decor: [],
    walkers: ['crab', 'sandbug', 'starfish'], tint: 0xffc8a0, flyers: ['gull'], mini: 'toad', miniTint: 0xffb890,
    boss: 'bigbird', bossTint: 0xffa868, bossName: 'Napmadár', bossIntro: 'Feltűnt a Napmadár!', bossOutro: 'A Napmadár lenyugodott!',
    music: ['m_desert', 'm_party', 'm_desert'], playable: true },
  { id: 6, name: 'Alkonyerdő', keys: '0123456789?!:()"', backdrop: 'moon', bdOffset: 24, ground: 'ground_moss', decor: [],
    walkers: ['mush', 'frog', 'octopus'], flyers: ['gull'], mini: 'slime',
    boss: 'babydragon', bossTint: 0xb8a0ff, bossName: 'Esti Sárkány', bossIntro: 'Előbújt az Esti Sárkány!', bossOutro: 'Az Esti Sárkány elaludt!',
    music: ['m_moon', 'm_70s', 'm_moon'], playable: true },
  { id: 7, name: 'Felhővár', keys: '', stories: true, sky: [8, 2, 4], ground: 'ground_sand', groundTint: 0xf0ecff, decor: [],
    walkers: ['frog', 'mush', 'crab', 'starfish', 'sandbug'], flyers: ['gull'], mini: 'bigbird', miniTint: 0xe0d8ff,
    boss: 'dragon', bossName: 'Felhősárkány', bossIntro: 'A Felhővár őre: a Felhősárkány!', bossOutro: 'Te lettél a Felhővár hőse!',
    bossMusic: 'm_final', music: ['m_sky', 'm_level3', 'm_sky'], playable: true },
];

// Phases used inside a region: level index -> phase mix
BK.LEVEL_PHASES = [
  ['letters', 'syllables'],    // level 1
  ['syllables', 'words'],      // level 2
  ['words', 'pairs'],          // level 3 (+ mini-boss with a sentence)
  ['sentences'],               // boss
];

// Typing amount per level (characters), by grade band. 2-4 minutes of play.
BK.LEVEL_CHARS = { '3-4': 80, '5-6': 130 };

// Stars: accuracy first, speed second
BK.STARS = { two: 0.92, three: 0.96 };
// Speed target (WPM) for the third star, by band; +2 per later region
BK.SPEED_TARGET = { '3-4': 7, '5-6': 11 };
BK.speedTarget = function (band, regionId) {
  return (BK.SPEED_TARGET[band] || 8) + (regionId - 1) * 2;
};

// Crowns: mastery goal on every level of a region whose boss is beaten
BK.CROWN = { acc: 0.97, plus: 4 };      // accuracy, and WPM above the region's 3-star speed
BK.crownEarned = function (res) { return res.acc >= BK.CROWN.acc && res.wpm >= (res.target || 0) + BK.CROWN.plus; };

// Endless road: creatures keep coming, a little faster each time
// speed: how fast the next creature comes closer (pixels per second; the road is 320 px)
BK.ENDLESS = { hearts: 3, speed0: { '3-4': 20, '5-6': 26 }, speedUp: 0.8, speedMax: 70 };

// Placement test: pass a stage with this accuracy (and minimum WPM by band)
BK.PLACEMENT_ACC = 0.9;
BK.PLACEMENT_WPM = { '3-4': 4, '5-6': 6 };

// Fonts a child can choose in Settings. All three have every Hungarian letter.
// The files are embedded in assets/fonts/fonts.js (key = id).
BK.FONTS = [
  { id: 'andika', name: 'Andika', family: 'Andika' },                       // made for beginning readers (default)
  { id: 'atkinson', name: 'Atkinson', family: 'Atkinson Hyperlegible' },    // maximum legibility, low vision
  { id: 'lexend', name: 'Lexend', family: 'Lexend' },                       // wide, airy letters for reading fluency
];
BK.fontId = 'andika';
Object.defineProperty(BK, 'FONT', { get: function () {
  var f = BK.FONTS.filter(function (x) { return x.id === BK.fontId; })[0] || BK.FONTS[0];
  return '"' + f.family + '", "Trebuchet MS", Verdana, sans-serif';
} });

// Scene music
BK.MUSIC = { title: 'm_title', map: 'm_map', boss: 'm_boss', chill: 'm_chill', test: 'm_test' };

// Shop catalogue: outfits (recoloured hero) and pets
BK.OUTFITS = [
  { id: 'base', name: 'Klasszikus', price: 0 },
  { id: 'blue', name: 'Égkék', price: 20 },
  { id: 'mint', name: 'Menta', price: 30 },
  { id: 'pink', name: 'Rózsaszín', price: 30 },
  { id: 'night', name: 'Éjszakai', price: 45 },
  { id: 'gold', name: 'Arany', price: 80 },
];
BK.PETS = [
  { id: 'crabkid', name: 'Rákocska', word: 'rák', sprite: 'crabkid_walk', price: 25 },
  { id: 'sandbug', name: 'Homokbogár', word: 'bogár', sprite: 'sandbug_walk', price: 35 },
  { id: 'gull', name: 'Sirály', word: 'sirály', sprite: 'gull_fly', price: 50, flies: true },
];

// Collectible items: frames of the Addin food sheet "icons_food" (20 columns, 16 px)
BK.ITEMS = [
  { id: 'apple', name: 'alma', frame: 29 },
  { id: 'cherry', name: 'cseresznye', frame: 41 },
  { id: 'strawberry', name: 'eper', frame: 46 },
  { id: 'banana', name: 'banán', frame: 47 },
  { id: 'watermelon', name: 'görögdinnye', frame: 32 },
  { id: 'grapes', name: 'szőlő', frame: 34 },
  { id: 'pear', name: 'körte', frame: 31 },
  { id: 'carrot', name: 'répa', frame: 27 },
  { id: 'orange', name: 'narancs', frame: 44 },
  { id: 'mushroom', name: 'gomba', frame: 52 },
  { id: 'cheese', name: 'sajt', frame: 57 },
  { id: 'egg', name: 'tojás', frame: 58 },
  { id: 'croissant', name: 'kifli', frame: 110 },
  { id: 'cookie', name: 'keksz', frame: 111 },
  { id: 'donut', name: 'fánk', frame: 126 },
  { id: 'cupcake', name: 'muffin', frame: 135 },
  { id: 'lollipop', name: 'nyalóka', frame: 148 },
  { id: 'icecream', name: 'fagyi', frame: 178 },
  { id: 'cake', name: 'torta', frame: 172 },
  { id: 'macaron', name: 'macaron', frame: 197 },
  { id: 'candycane', name: 'cukorpálca', frame: 202 },
  { id: 'pizza', name: 'pizza', frame: 102 },
];

// Playable heroes. The figure a child picks is the one that walks through the
// levels (and the profile picture). idle/run are animation keys; outfits add
// a colour suffix (frog_walk_gold). "creature": the enemy of the same kind is
// left out of that child's levels, so a frog never meets a frog.
BK.HEROES = [
  { id: 'bunny', name: 'Nyuszi', idle: 'bunny_idle', run: 'bunny_run' },
  { id: 'berie', name: 'Berie', idle: 'berie_idle', run: 'berie_run' },
  { id: 'frog', name: 'Béka', idle: 'frog_taunt', run: 'frog_walk', creature: 'frog' },
  { id: 'mush', name: 'Gomba', idle: 'mush_walk', run: 'mush_walk', creature: 'mush' },
  { id: 'crab', name: 'Rák', idle: 'crab_walk', run: 'crab_walk', creature: 'crab' },
  { id: 'gull', name: 'Sirály', idle: 'gull_fly', run: 'gull_fly', creature: 'gull', flies: true },
];
BK.heroOf = function (p) { return BK.HEROES[(p && p.avatar) || 0] || BK.HEROES[0]; };
// key of an animation in the profile's outfit colour
BK.outfitKey = function (key, p) { return (p && p.outfit && p.outfit !== 'base') ? key + '_' + p.outfit : key; };

// Which way the creatures look in the source art. Enemies must face left
// (towards the hero), pets must face right. true = faces left already.
BK.FACES_LEFT = { babydragon: false, slime: false, bunny: false, frog: false, mush: false, toad: false, bigbird: false, sandbug: false,
  crab: false, crabkid: false, gull: true, frogknight: true, dragon: true, starfish: false, octopus: false, shell: false, karou: false };

// Names shown when a mini-boss appears ("X állja az utat!")
BK.CREATURE_NAMES = { toad: 'Varangy', shell: 'Kagylókirály', slime: 'Zselé', bigbird: 'Óriásmadár', octopus: 'Polip' };
