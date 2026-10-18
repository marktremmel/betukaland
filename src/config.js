/*
 * Betűkaland: global configuration.
 * Everything a teacher or developer is likely to tweak lives here:
 * screen size, regions and their keys, keyboard layout, finger colours,
 * star thresholds, speed targets, music per scene.
 */
window.BK = window.BK || {};

BK.VERSION = '0.9.5';

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

// How to type a mark that is not on a plain key (shown under the Pumpkin King's
// bubbles). The child's computer is chosen in Settings ("Jelek súgója"):
// Mac or PC, Hungarian or English keyboard; Mac Hungarian is the default.
// An empty string means a plain key; a mark missing from a list is not sent.
BK.KEY_HINT_SETS = [
  { id: 'mac-hu', name: 'Mac magyar', en: 'Mac Hungarian' },
  { id: 'pc-hu', name: 'PC magyar', en: 'PC Hungarian' },
  { id: 'pc-us', name: 'PC angol', en: 'PC English' },
  { id: 'mac-us', name: 'Mac angol', en: 'Mac English' },
];
(function () {
  var huShift = { '!': 'Shift + 4', '%': 'Shift + 5', '/': 'Shift + 6', '=': 'Shift + 7', '(': 'Shift + 8', ')': 'Shift + 9',
    '?': 'Shift + ,', ':': 'Shift + .', '-': '', ',': '' };
  var usAll = { '!': 'Shift + 1', '@': 'Shift + 2', '#': 'Shift + 3', '$': 'Shift + 4', '%': 'Shift + 5', '&': 'Shift + 7',
    '(': 'Shift + 9', ')': 'Shift + 0', '?': 'Shift + /', ':': 'Shift + ;', '<': 'Shift + ,', '>': 'Shift + .',
    '=': '', ';': '', '/': '', '-': '', ',': '' };
  BK.KEY_HINTS = {
    'mac-hu': Object.assign({}, huShift, { '@': 'Option + Q', '#': 'Option + Shift + 3', '$': 'Option + 4', '€': 'Option + E',
      '&': 'Option + 1', '<': 'Option + Shift + Y', '>': 'Option + Shift + X', ';': 'Option + .' }),
    'pc-hu': Object.assign({}, huShift, { '@': 'AltGr + V', '#': 'AltGr + X', '$': 'AltGr + É', '€': 'AltGr + U',
      '&': 'AltGr + C', '<': 'AltGr + Í', '>': 'AltGr + Y', ';': 'AltGr + ,' }),
    'pc-us': usAll,
    'mac-us': Object.assign({}, usAll, { '€': 'Option + Shift + 2' }),
  };
})();
BK.hintSet = function (p) { p = p || BK.state.profile; return (p && p.settings && p.settings.kbHint) || 'mac-hu'; };
// '' = plain key, null = this computer cannot make it
BK.keyHint = function (ch, p) {
  var h = BK.KEY_HINTS[BK.hintSet(p)] || BK.KEY_HINTS['mac-hu'];
  return h[ch] === undefined ? null : h[ch];
};
// the key to light up on the screen keyboard for a hinted mark ("Option + Shift + 3" -> "3")
BK.hintKey = function (ch) {
  var h = BK.keyHint(ch);
  if (!h) return null;
  var k = h.split('+').pop().trim().toLowerCase();
  return k;
};
// The marks the Pumpkin King sends, by grade band (the US keyboard has no €)
BK.HW_SPECIALS = { '3-4': ['!', '?', ':', '-', '(', ')', ',', '@'], '5-6': ['#', '$', '€', '&', ';', '/', '<', '>', '=', '%'] };

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

// Halloween Night (switched on in the Teacher screen): four stages on a night
// road, played with the keys of the child's newest region (see levelgen
// "halloween"). Each creature names the drawn sprite and a stand-in from the
// library with a tint, used until the drawn one is in assets/manifest.js.
BK.HW_CREATURES = {
  ghost:   { art: 'hw_ghost_float', stand: 'mush', tint: 0xe8e0ff },
  pumpkin: { art: 'hw_pumpkin_walk', stand: 'mush', tint: 0xffa04a },
  cat:     { art: 'hw_cat_walk', stand: 'frog', tint: 0x8a70c0 },
  bat:     { art: 'hw_bat_fly', stand: 'crow' },
  mummy:   { art: 'hw_mummy_walk', stand: 'toad', tint: 0xf0e0c0 },
  king:    { art: 'hw_king_idle', stand: 'babydragon', tint: 0xffa860 },
};
BK.HALLOWEEN = {
  stages: [
    { name: 'Tökös ösvény', en: 'Pumpkin Path', walkers: ['ghost', 'pumpkin'], flyers: [], sky: 3 },
    { name: 'Ködös erdő', en: 'Misty Woods', walkers: ['cat', 'ghost'], flyers: ['bat'], sky: 3 },
    { name: 'Denevérhíd', en: 'Bat Bridge', walkers: ['pumpkin', 'cat', 'ghost'], flyers: ['bat'], sky: 3, mini: 'mummy' },
    { name: 'A Tökkirály kertje', en: 'The Pumpkin King\'s Garden', walkers: ['ghost', 'pumpkin', 'cat'], flyers: ['bat'], sky: 7,
      boss: 'king', bossName: 'Tökkirály', bossNameEn: 'Pumpkin King',
      bossIntro: 'Itt a morcos Tökkirály! Kapd el a jeleit!', bossIntroEn: 'Here is the grumpy Pumpkin King! Catch his marks!',
      bossOutro: 'A Tökkirály elneveti magát!', bossOutroEn: 'The Pumpkin King bursts out laughing!' },
  ],
  look: { backdrop: null, ground: 'ground', groundTint: 0x8070b0, decor: null, music: ['m_moon'], bossMusic: 'm_boss' },
  pet: 'bat',             // the reward for making the King smile
};
// A region-like object for a Halloween stage (the keys stay those of regionId)
BK.halloweenRegion = function (regionId, stage) {
  var st = BK.HALLOWEEN.stages[stage], en = BK.uiLang === 'en';
  var r = Object.assign({}, BK.REGIONS[regionId - 1], BK.HALLOWEEN.look);
  var pick = function (id) {
    var c = BK.HW_CREATURES[id], drawn = window.BK_MANIFEST && BK_MANIFEST.sprites[c.art];
    var key = drawn ? 'hw_' + id : c.stand;
    if (drawn) BK.CREATURES[key] = c.art;
    return { key: key, tint: drawn ? undefined : c.tint };
  };
  r.decor = window.BK_MANIFEST && BK_MANIFEST.sprites.hw_decor ? ['hw_decor'] : null;
  r.decorChance = 0.9;   // pumpkins, lanterns... or the usual trees
  r.tints = {};
  var list = function (ids) { return ids.map(function (id) { var c = pick(id); if (c.tint) r.tints[c.key] = c.tint; return c.key; }); };
  r.walkers = list(st.walkers);
  r.flyers = list(st.flyers);
  r.flyer = r.flyers[0];
  r.mini = st.mini ? list([st.mini])[0] : r.mini;
  r.miniTint = st.mini ? r.tints[r.mini] : undefined;
  r.miniName = BK.L('Egy ügyetlen múmia', 'A clumsy mummy');
  if (st.boss) { r.boss = list([st.boss])[0]; r.bossTint = r.tints[r.boss]; }
  r.bossName = en ? st.bossNameEn : st.bossName;
  r.bossIntro = en ? st.bossIntroEn : st.bossIntro;
  r.bossOutro = en ? st.bossOutroEn : st.bossOutro;
  r.sky = [st.sky || 3];
  r.bdTint = null;
  r.name = en ? st.en : st.name;
  r.theme = 'halloween';
  r.stories = false;       // the story regions write the boss from stories; here the themed sentences do
  return r;
};

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

// Shop: the magic the hero sends at each correct key. A shape and a colour,
// bought separately (the wave and the classic yellow are free). The order is
// fixed: the save code stores them by position, so new ones go at the END.
// (v0.9.0 had dot, box and wave at positions 0, 2 and 4.)
BK.SHOT_SHAPES = [
  { id: 'wave', name: 'Hullám', en: 'Wave', price: 0 },
  { id: 'star', name: 'Csillag', en: 'Star', price: 30 },
  { id: 'code', name: 'Kód', en: 'Code', price: 40 },
  { id: 'sparkle', name: 'Szikra', en: 'Sparkle', price: 40 },
  { id: 'comet', name: 'Üstökös', en: 'Comet', price: 50 },
  { id: 'bolt', name: 'Villám', en: 'Lightning', price: 60 },
  { id: 'grav', name: 'Gravihullám', en: 'Grav wave', price: 80 },
];
// Colour sets. In "basic" and "pastel" the child picks one of the colours
// (fx.tone); rainbow changes colour with every shot; RTX adds glow and lens
// flares; chrome shines like metal.
BK.SHOT_COLOURS = [
  { id: 'classic', name: 'Klasszikus', en: 'Classic', price: 0, cols: [0xfff2a0] },
  { id: 'basic', name: 'Alapszínek', en: 'Basic', price: 25, pick: true,
    cols: [0xff4a4a, 0xff9a2a, 0xffd23c, 0x4ad17a, 0x3ad0e0, 0x4a8aff, 0xa86aff, 0xff5ab4] },
  { id: 'pastel', name: 'Pasztell', en: 'Pastel', price: 35, pick: true,
    cols: [0xffb8b8, 0xffd2a8, 0xfff0a8, 0xc8f2b4, 0xb4ecf0, 0xb8d4ff, 0xdcc6ff, 0xffc4e4] },
  { id: 'rainbow', name: 'Szivárvány', en: 'Rainbow', price: 60, rainbow: true },
  { id: 'rtx', name: 'RTX', en: 'RTX', price: 80, cols: [0xfff8e8], rtx: true },
  { id: 'chrome', name: 'Króm', en: 'Chrome', price: 70, cols: [0xc8d0dc], chrome: true },
];
BK.FX_DEFAULT = function () { return { v: 2, shape: 'wave', colour: 'classic', tone: 0, owned: ['wave', 'classic'] }; };

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
  // Halloween Night reward, not for sale: the drawn bat, or the library crow until it exists
  (window.BK_MANIFEST && BK_MANIFEST.sprites.hw_bat_fly)
    ? { id: 'bat', name: 'Denevér', word: 'denevér', sprite: 'hw_bat_fly', price: 0, flies: true, reward: true }
    : { id: 'bat', name: 'Varjú', word: 'varjú', sprite: 'crow_fly', price: 0, flies: true, reward: true },
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
  // the 4.B animals (art/animals, see tools/clean_ai_sprites.py)
  { id: 'cheetah', name: 'Gepárd', idle: 'cheetah_idle', run: 'cheetah_run' },
  { id: 'panda', name: 'Panda', idle: 'panda_idle', run: 'panda_run' },
  { id: 'firefox', name: 'Tűzróka', idle: 'firefox_idle', run: 'firefox_run' },
  { id: 'roach', name: 'Csótány', idle: 'roach_idle', run: 'roach_run' },
  { id: 'tiger', name: 'Tigris', idle: 'tiger_idle', run: 'tiger_run' },
  { id: 'seahorse', name: 'Csikóhal', idle: 'seahorse_idle', run: 'seahorse_run', flies: true },
  { id: 'polar', name: 'Jegesmedve', idle: 'polar_idle', run: 'polar_run' },
  // Halloween figures: in the shop once the Pumpkin King smiles (lock); the ghost is the gift
  { id: 'hwghost', name: 'Szellemke', idle: 'hw_ghost_float', run: 'hw_ghost_float', flies: true, creature: 'hw_ghost', lock: 'halloween', price: 0 },
  { id: 'hwpumpkin', name: 'Tökfej', idle: 'hw_pumpkin_walk', run: 'hw_pumpkin_walk', creature: 'hw_pumpkin', lock: 'halloween', price: 60 },
  { id: 'hwcat', name: 'Boszicica', idle: 'hw_cat_walk', run: 'hw_cat_walk', creature: 'hw_cat', lock: 'halloween', price: 60 },
  { id: 'hwmummy', name: 'Múmia', idle: 'hw_mummy_walk', run: 'hw_mummy_walk', creature: 'hw_mummy', lock: 'halloween', price: 80 },
  { id: 'hwbat', name: 'Denevérke', idle: 'hw_bat_fly', run: 'hw_bat_fly', flies: true, creature: 'hw_bat', lock: 'halloween', price: 80 },
];
// Can this child play this figure? Locked ones must be owned (bought or given).
BK.heroOwned = function (p, h) { return !h.lock || ((p && p.figures) || []).indexOf(h.id) >= 0; };
BK.heroUnlocked = function (p, h) { return !h.lock || !!(p && p.halloween && p.halloween.stars && p.halloween.stars[3]); };
BK.HW_GIFT = 'hwghost';
// a new profile chooses from the figures everyone has (the locked ones come last in the list)
BK.N_FREE_HEROES = BK.HEROES.filter(function (h) { return !h.lock; }).length;
BK.heroOf = function (p) { var h = BK.HEROES[(p && p.avatar) || 0] || BK.HEROES[0]; return BK.heroOwned(p, h) ? h : BK.HEROES[0]; };
// key of an animation in the profile's outfit colour
BK.outfitKey = function (key, p) {
  var k = (p && p.outfit && p.outfit !== 'base') ? key + '_' + p.outfit : key;
  return window.BK_MANIFEST && !BK_MANIFEST.sprites[k] ? key : k;   // figures without outfit colours (Halloween ones) stay as they are
};

// Which way the creatures look in the source art. Enemies must face left
// (towards the hero), pets must face right. true = faces left already.
BK.FACES_LEFT = { crow: true, babydragon: false, slime: false, bunny: false, frog: false, mush: false, toad: false, bigbird: false, sandbug: false,
  crab: false, crabkid: false, gull: true, frogknight: true, dragon: true, starfish: false, octopus: false, shell: false, karou: false };

// Names shown when a mini-boss appears ("X állja az utat!")
BK.CREATURE_NAMES = { toad: 'Varangy', shell: 'Kagylókirály', slime: 'Zselé', bigbird: 'Óriásmadár', octopus: 'Polip' };
