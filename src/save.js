/*
 * Saving: profiles in localStorage, save codes, save files.
 *
 * localStorage key "betukaland.v1" holds:
 *   { version: 1, profiles: [...], teacher: { pinHash }, lastProfile }
 * A profile is created by newProfile() below; see that function for fields.
 *
 * Save code: progress packed into bits, written in Crockford base32
 * (no I, L, O, U, so it is hard to mistype), grouped by 4, with a checksum.
 * Save file: the full profile as JSON (.json), nothing lost.
 */
BK.save = (function () {
  var mem = null;          // in-memory copy (also used if localStorage is blocked)
  var storageOk = true;

  function blank() { return { version: 1, profiles: [], teacher: { pinHash: null }, lastProfile: null }; }

  function load() {
    if (mem) return mem;
    try {
      var raw = window.localStorage.getItem(BK.SAVE_KEY);
      mem = raw ? JSON.parse(raw) : blank();
    } catch (e) {
      storageOk = false;
      mem = blank();
    }
    if (!mem.profiles) mem = blank();
    mem.profiles.forEach(upgrade);
    return mem;
  }

  function persist() {
    try {
      window.localStorage.setItem(BK.SAVE_KEY, JSON.stringify(mem));
      storageOk = true;
    } catch (e) { storageOk = false; }
    return storageOk;
  }

  function newProfile(nick, avatar, grade, lang) {
    var p = {
      id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      nick: nick, avatar: avatar, grade: grade, lang: lang,
      created: BK.util.today(), lastPlayed: null,
      placed: null,                       // region suggested by the placement test
      settings: { keyboard: true, fingers: true, music: true, sfx: true, speedRun: false, rest: true, shiftTip: true, kbHint: 'mac-hu' },
      progress: {},                       // regionId -> { stars: [l1, l2, l3, boss] }
      coins: 0,
      items: {},                          // item id -> count
      outfits: ['base'], outfit: 'base',
      pets: [], pet: null,
      fx: BK.FX_DEFAULT(),                // the shop's magic shots
      arena: {},                          // boss arena results
      keys: {},                           // per-key stats, see adaptive.js
      history: [],                        // last 100 levels
      best: { wpm: 0, acc: 0 },
      bestTimes: {},                      // speed run: "r-l" -> ms
      daily: null,                        // date of last finished daily challenge
    };
    upgrade(p);
    return p;
  }

  // Fill in fields added in later versions so old saves keep working
  function upgrade(p) {
    p.settings = Object.assign({ keyboard: true, fingers: true, music: true, sfx: true, speedRun: false, rest: true, shiftTip: true, kbHint: 'mac-hu' }, p.settings || {});
    p.figures = p.figures || [];          // figures that must be owned (Halloween ones)
    p.progress = p.progress || {};
    BK.REGIONS.forEach(function (r) {
      if (!p.progress[r.id]) p.progress[r.id] = { stars: [0, 0, 0, 0] };
    });
    p.items = p.items || {}; p.keys = p.keys || {}; p.history = p.history || [];
    p.outfits = p.outfits || ['base']; p.pets = p.pets || [];
    p.best = p.best || { wpm: 0, acc: 0 }; p.bestTimes = p.bestTimes || {}; p.stories = p.stories || {};
    p.best.endless = p.best.endless || 0;
    // story stars from before v0.6.2 were stored without the language: move English ones
    if (p.lang === 'en' && window.BK_STORIES_EN) BK_STORIES_EN.forEach(function (st) {
      var huToo = (window.BK_STORIES_HU || []).some(function (h) { return h.id === st.id; });
      if (p.stories[st.id] && !huToo && !p.stories['en:' + st.id]) { p.stories['en:' + st.id] = p.stories[st.id]; delete p.stories[st.id]; }
    });
    p.crowns = p.crowns || {};             // regionId -> [l1, l2, l3, boss] 1 = crown earned
    p.fx = p.fx || BK.FX_DEFAULT();
    // v0.9.0 shapes: the dot became the (free) wave, the box became code, the old wave the comet
    var ren = { dot: 'wave', box: 'code', wave: 'comet' };
    if (!p.fx.v) {
      p.fx.owned = p.fx.owned.map(function (o) { return ren[o] || o; });
      if (ren[p.fx.shape]) p.fx.shape = ren[p.fx.shape];
      if (p.fx.owned.indexOf('wave') < 0) p.fx.owned.push('wave');
      p.fx.v = 2;
    }
    p.fx.tone = p.fx.tone || 0;
    p.fx.impact = p.fx.impact || 'spark';          // v0.10: impacts
    p.fx.glow = p.fx.glow || 'g_none';             // v0.10.1: light on the word bubble
    p.fx.kb = p.fx.kb || 'kb_classic';             // v0.12: keyboard look and effects
    p.fx.kbOn = p.fx.kbOn || [];
    ['spark', 'g_none', 'kb_classic'].forEach(function (k) { if (p.fx.owned.indexOf(k) < 0) p.fx.owned.push(k); });
    p.dishes = p.dishes || {};                     // kitchen: dish id -> how many
    p.rares = p.rares || {};                       // rare treasures: id -> how many
    p.castle = Object.assign({ props: [], floor: [], frames: 0, framed: [] }, p.castle || {});   // the castle room
    p.emblem = p.emblem || null;                   // the child's own sign (profile page)
    p.pins = p.pins || [];                         // up to three badges pinned to the castle board
    p.menuBg = p.menuBg || 0;                      // menu background (profile page)
    p.tales = p.tales || {};                       // Mesék: id -> { at: next line, done: stars }
    p.arena = p.arena || {};                       // boss arena: id -> { n: stars, h: stars }
    if (!(p.avatar >= 0 && p.avatar < BK.HEROES.length)) p.avatar = 0;   // figure list changed in v0.2
    return p;
  }

  // ---------------------------------------------------------------- progress
  // Story stars are kept per word language: an English and a Hungarian story may share an id
  function storyKey(p, id) { return (p.lang === 'en' ? 'en:' : '') + id; }
  // Every story in a fixed order, for the save code (new stories must be added at the END of the data files)
  function storyOrder() {
    var hu = (window.BK_STORIES_HU || []).map(function (s) { return s.id; });
    var en = (window.BK_STORIES_EN || []).map(function (s) { return 'en:' + s.id; });
    return hu.concat(en);
  }

  // A code or file loaded onto a computer that already has this child: keep the best of both,
  // never lose anything that is only stored locally (history, streak, goals, key details)
  function merge(local, inc) {
    for (var r = 1; r <= 7; r++) {
      var a = local.progress[r].stars, b = (inc.progress[r] || { stars: [] }).stars;
      for (var l = 0; l < 4; l++) a[l] = Math.max(a[l] || 0, b[l] || 0);
      var ic = (inc.crowns || {})[r];
      if (ic) { var lc = local.crowns[r] || (local.crowns[r] = [0, 0, 0, 0]); for (l = 0; l < 4; l++) lc[l] = lc[l] || ic[l] || 0; }
    }
    Object.keys(inc.stories || {}).forEach(function (k) { local.stories[k] = Math.max(local.stories[k] || 0, inc.stories[k]); });
    (inc.outfits || []).forEach(function (o) { if (local.outfits.indexOf(o) < 0) local.outfits.push(o); });
    (inc.pets || []).forEach(function (o) { if (local.pets.indexOf(o) < 0) local.pets.push(o); });
    Object.keys(inc.items || {}).forEach(function (k) { local.items[k] = Math.max(local.items[k] || 0, inc.items[k]); });
    Object.keys(inc.keys || {}).forEach(function (k) { if (!local.keys[k]) local.keys[k] = inc.keys[k]; });
    local.coins = Math.max(local.coins, inc.coins);
    local.best.wpm = Math.max(local.best.wpm, inc.best.wpm || 0);
    local.best.acc = Math.max(local.best.acc, inc.best.acc || 0);
    local.best.endless = Math.max(local.best.endless || 0, inc.best.endless || 0);
    local.placed = Math.max(local.placed || 0, inc.placed || 0) || null;
    local.avatar = inc.avatar;
    (inc.figures || []).forEach(function (f) { if (local.figures.indexOf(f) < 0) local.figures.push(f); });
    if (inc.halloween && (!local.halloween || !local.halloween.stars[3])) local.halloween = inc.halloween;
    ['rest', 'kbHint', 'shiftTip'].forEach(function (k) { if (inc.settings[k] !== undefined) local.settings[k] = inc.settings[k]; });
    if (inc.fx) { (inc.fx.owned || []).forEach(function (o) { if (local.fx.owned.indexOf(o) < 0) local.fx.owned.push(o); }); local.fx.shape = inc.fx.shape; local.fx.colour = inc.fx.colour; local.fx.tone = inc.fx.tone || 0; local.fx.impact = inc.fx.impact || local.fx.impact; local.fx.glow = inc.fx.glow || local.fx.glow; local.fx.kb = inc.fx.kb || local.fx.kb; local.fx.kbOn = inc.fx.kbOn || local.fx.kbOn; }
    ['dishes', 'rares'].forEach(function (k) {
      local[k] = local[k] || {};
      Object.keys(inc[k] || {}).forEach(function (id) { local[k][id] = Math.max(local[k][id] || 0, inc[k][id] || 0); });
    });
    if (inc.castle) {
      local.castle = local.castle || { props: [], floor: [], frames: 0, framed: [] };
      (inc.castle.props || []).forEach(function (id) { if (local.castle.props.indexOf(id) < 0) local.castle.props.push(id); });
      local.castle.frames = Math.max(local.castle.frames || 0, inc.castle.frames || 0);
      if ((inc.castle.floor || []).some(Boolean)) local.castle.floor = inc.castle.floor.slice();
      if ((inc.castle.framed || []).some(Boolean)) local.castle.framed = inc.castle.framed.slice();
      if (inc.castle.inv) {
        local.castle.inv = local.castle.inv || {};
        Object.keys(inc.castle.inv).forEach(function (k) { local.castle.inv[k] = Math.max(local.castle.inv[k] || 0, inc.castle.inv[k]); });
        if ((inc.castle.placed || []).length && !(local.castle.placed || []).length) local.castle.placed = inc.castle.placed.slice();
      }
    }
    if (inc.emblem) local.emblem = inc.emblem;
    if ((inc.pins || []).length) local.pins = inc.pins.slice(0, 3);
    if (inc.menuBg) local.menuBg = inc.menuBg;
    local.arena = local.arena || {};
    Object.keys(inc.arena || {}).forEach(function (k) {
      var a = local.arena[k] || (local.arena[k] = { n: 0, h: 0 }), b = inc.arena[k];
      a.n = Math.max(a.n || 0, b.n || 0); a.h = Math.max(a.h || 0, b.h || 0);
    });              // the figure can change, the code carries the latest choice
    ['layout', 'ui', 'font'].forEach(function (k) { if (inc.settings[k]) local.settings[k] = inc.settings[k]; });
    return local;
  }

  function regionCleared(p, r) { return (p.progress[r].stars[3] || 0) > 0; }
  function levelUnlocked(p, r, l) {
    if (!BK.REGIONS[r - 1].playable) return false;
    if (BK.DEBUG) return true;
    if (r > 1 && !regionOpen(p, r)) return false;
    if (l === 0) return true;
    return (p.progress[r].stars[l - 1] || 0) > 0;
  }
  function regionOpen(p, r) {
    if (r === 1 || BK.DEBUG) return true;
    if (p.placed && r <= p.placed) return true;
    return regionCleared(p, r - 1);
  }
  function totalStars(p) {
    var t = 0;
    Object.keys(p.progress).forEach(function (r) { p.progress[r].stars.forEach(function (s) { t += s; }); });
    return t;
  }
  function currentRegion(p) {
    var cur = 1;
    BK.REGIONS.forEach(function (r) { if (regionOpen(p, r.id)) cur = r.id; });
    return cur;
  }

  function recordLevel(p, res) {
    // res: { r, l, wpm, acc, stars, ms, coins, daily }
    var pr = p.progress[res.r];
    if (res.l >= 0 && res.l <= 3 && !res.daily) pr.stars[res.l] = Math.max(pr.stars[res.l] || 0, res.stars);
    if (res.practice === 'cook' && res.recipeId) {
      // the dish is ready: the treasures it needed are used up
      var rc = BK.RECIPES.find(function (x) { return x.id === res.recipeId; });
      if (rc && rc.needs.every(function (id) { return (p.items[id] || 0) > 0; })) {
        rc.needs.forEach(function (id) { p.items[id]--; if (!p.items[id]) delete p.items[id]; });
        p.dishes = p.dishes || {};
        p.dishes[rc.id] = (p.dishes[rc.id] || 0) + 1;
        res.newDish = rc.id;
      }
    }
    if (res.practice === 'tale' && res.tale) {
      // the place in the tale; a finished tale keeps its stars and can be read again from the start
      p.tales = p.tales || {};
      var tl = p.tales[res.tale.id] || (p.tales[res.tale.id] = { at: 0, done: 0 });
      tl.at = res.tale.to;
      if (res.tale.to >= res.tale.total) { res.taleFinished = !tl.done; tl.done = Math.max(tl.done || 0, res.stars); }
    }
    if (res.practice === 'story' && res.storyId) { var sk = storyKey(p, res.storyId); p.stories[sk] = Math.max(p.stories[sk] || 0, res.stars); }
    // crowns: a mastery goal on every level of a region whose boss is beaten
    res.crownNew = false;
    if (res.l >= 0 && res.l <= 3 && !res.daily && regionCleared(p, res.r) && BK.crownEarned(res)) {
      var cr = p.crowns[res.r] || (p.crowns[res.r] = [0, 0, 0, 0]);
      if (!cr[res.l]) { cr[res.l] = 1; res.crownNew = true; }
    }
    if (res.practice === 'halloween') {
      // Halloween Night: stars per stage on this computer (not in the save code); the King gives a pet
      var hw = p.halloween || (p.halloween = { stars: [0, 0, 0, 0] });
      hw.stars[res.stage] = Math.max(hw.stars[res.stage] || 0, res.stars);
      var pet = BK.HALLOWEEN.pet;
      if (res.stage === 3 && p.pets.indexOf(pet) < 0) { p.pets.push(pet); res.newPet = pet; }
      // ...and a Halloween figure as a gift; the others can be bought in the shop from now on
      p.figures = p.figures || [];
      if (res.stage === 3 && res.stars > 0 && p.figures.indexOf(BK.HW_GIFT) < 0) { p.figures.push(BK.HW_GIFT); res.newFigure = BK.HW_GIFT; }
    }
    if (res.practice === 'arena' && res.arenaId) {
      // the arena: best stars per boss, on normal and on hard
      p.arena = p.arena || {};
      var ar = p.arena[res.arenaId] || (p.arena[res.arenaId] = { n: 0, h: 0 }), hk = res.hard ? 'h' : 'n';
      res.arenaFirst = !ar[hk];
      ar[hk] = Math.max(ar[hk] || 0, res.stars);
    }
    if (res.practice === 'endless') { res.prevEndless = p.best.endless; p.best.endless = Math.max(p.best.endless, res.words || 0); }
    p.coins = Math.min(16000, p.coins + (res.coins || 0));
    p.history.push({ d: BK.util.today(), r: res.r, l: res.l, wpm: Math.round(res.wpm * 10) / 10,
      acc: Math.round(res.acc * 1000) / 1000, stars: res.stars, ms: res.ms, daily: !!res.daily, practice: res.practice || undefined });
    if (p.history.length > 100) p.history.shift();
    var newBest = false;
    if (res.acc >= 0.85 && res.wpm > p.best.wpm) { p.best.wpm = Math.round(res.wpm * 10) / 10; newBest = true; }
    if (res.acc > p.best.acc) p.best.acc = Math.round(res.acc * 1000) / 1000;
    if (res.daily) p.daily = BK.util.today();
    res.goals = BK.goals.update(p, res);
    p.lastPlayed = BK.util.today();
    persist();
    return newBest;
  }

  // ---------------------------------------------------------------- save code
  var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var NICK = 'abcdefghijklmnopqrstuvwxyzáéíóöőúüűABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÖŐÚÜŰ0123456789 -_.!';
  var KEYLIST = 'asdfjkléghqwertzuiopyxcvbnmáíóöőúüű0123456789,.-';

  function Bits() { this.a = []; }
  Bits.prototype.put = function (v, n) { for (var i = n - 1; i >= 0; i--) this.a.push((v >> i) & 1); };
  function Reader(a) { this.a = a; this.i = 0; }
  Reader.prototype.get = function (n) { var v = 0; for (var i = 0; i < n; i++) v = (v << 1) | (this.a[this.i++] || 0); return v; };

  function keyLevel(p, k) {
    var s = p.keys[k];
    if (!s || s.n < 5) return 0;
    var w = BK.adaptive.weakness(p, k);
    return w < 0.2 ? 1 : (w < 0.45 ? 2 : 3);
  }

  function encode(p) {
    // version 10 (v0.12): plus keyboard looks and effects. Version 9 (v0.11): plus kitchen, rare treasures, castle, sign, menu background and finished tales. Version 8 (v0.10.1): plus bubble lights; written as 0 then the version in 5 bits. Version 7 (v0.10): plus impacts and the boss arena. Version 6 (v0.9.5): plus Halloween figures. Version 5 (v0.9.1): magic shots with single colours, RTX and chrome. Version 4 (v0.9): the shop's magic shots. Version 3 (v0.7): two more figure bits. Version 2 (v0.6.2) made codes shorter: the per-key skill levels are left out (the game relearns
    // them in a few rounds) and trailing zeros are dropped. Version 1 codes still load.
    var b = new Bits();
    b.put(0, 3);                            // 0 = look at the next 5 bits (versions 8 and up)
    b.put(11, 5);
    b.put(p.avatar & 7, 3);
    b.put(p.grade === '5-6' ? 1 : 0, 1);
    b.put(p.lang === 'en' ? 1 : 0, 1);
    b.put(p.placed || 0, 3);
    var nick = Array.from(p.nick).filter(function (c) { return NICK.indexOf(c) >= 0; }).slice(0, 12);
    b.put(nick.length, 4);
    nick.forEach(function (c) { b.put(NICK.indexOf(c), 7); });
    b.put(Math.min(p.coins, 16383), 14);
    for (var r = 1; r <= 7; r++) for (var l = 0; l < 4; l++) b.put(p.progress[r].stars[l] || 0, 2);
    var ob = 0; BK.OUTFITS.forEach(function (o, i) { if (p.outfits.indexOf(o.id) >= 0) ob |= 1 << i; }); b.put(ob, 8);
    var pb = 0; BK.PETS.forEach(function (o, i) { if (p.pets.indexOf(o.id) >= 0) pb |= 1 << i; }); b.put(pb, 8);
    b.put(Math.max(0, BK.OUTFITS.findIndex(function (o) { return o.id === p.outfit; })), 3);
    b.put(p.pet ? BK.PETS.findIndex(function (o) { return o.id === p.pet; }) + 1 : 0, 3);
    BK.ITEMS.forEach(function (it) { b.put(Math.min(3, p.items[it.id] || 0), 2); });
    b.put(Math.min(127, Math.round(p.best.wpm)), 7);
    b.put(Math.min(100, Math.round(p.best.acc * 100)), 7);
    // added in v0.6.2 (older codes simply read these as 0): crowns, keyboard, menu language,
    // font, endless-road record, story stars
    for (r = 1; r <= 7; r++) for (l = 0; l < 4; l++) b.put(((p.crowns || {})[r] || [])[l] ? 1 : 0, 1);
    b.put(p.settings.layout === 'us' ? 1 : 0, 1);
    b.put(p.settings.ui === 'en' ? 1 : 0, 1);
    b.put(Math.max(0, BK.FONTS.findIndex(function (f) { return f.id === p.settings.font; })), 2);
    b.put(Math.min(255, (p.best && p.best.endless) || 0), 8);
    b.put((p.avatar >> 3) & 3, 2);          // v3 (v0.7): more than 8 figures
    // v4 (v0.9) / v5 (v0.9.1): magic shots from the shop: owned shapes (7 bits) and colour sets
    // (6 bits), the shape, the colour set and the colour in it (tone) in use
    var fx = p.fx || {}, own = fx.owned || [];
    BK.SHOT_SHAPES.forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); });
    BK.SHOT_COLOURS.forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); });
    b.put(Math.max(0, BK.SHOT_SHAPES.findIndex(function (o) { return o.id === fx.shape; })), 3);
    b.put(Math.max(0, BK.SHOT_COLOURS.findIndex(function (o) { return o.id === fx.colour; })), 3);
    b.put((fx.tone || 0) & 7, 3);
    // v6 (v0.9.5): Halloween figures owned, and whether the Pumpkin King was beaten (opens them in the shop)
    BK.HEROES.filter(function (h) { return h.lock; }).forEach(function (h) { b.put((p.figures || []).indexOf(h.id) >= 0 ? 1 : 0, 1); });
    b.put(p.halloween && p.halloween.stars && p.halloween.stars[3] ? 1 : 0, 1);
    // v7 (v0.9.6): owned impacts and the one in use; the arena: beaten on normal / on hard, per boss
    BK.SHOT_IMPACTS.forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); });
    b.put(Math.max(0, BK.SHOT_IMPACTS.findIndex(function (o) { return o.id === fx.impact; })), 3);
    BK.arenaBosses(p).forEach(function (a) { var r = (p.arena || {})[a.id] || {}; b.put(r.n ? 1 : 0, 1); b.put(r.h ? 1 : 0, 1); });
    // v8 (v0.10.1): bubble lights owned and the one in use
    BK.SHOT_GLOWS.forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); });
    b.put(Math.max(0, BK.SHOT_GLOWS.findIndex(function (o) { return o.id === fx.glow; })), 3);
    // v9 (v0.11): kitchen, rare treasures, castle, sign, menu background, finished tales
    BK.RECIPES.forEach(function (r) { b.put(Math.min(3, (p.dishes || {})[r.id] || 0), 2); });
    BK.RARES.forEach(function (r) { b.put(Math.min(7, (p.rares || {})[r.id] || 0), 3); });
    var cs = p.castle || { props: [], floor: [] };
    BK.CASTLE_PROPS.forEach(function (o) { b.put((cs.props || []).indexOf(o.id) >= 0 ? 1 : 0, 1); });
    // the first seven things on the floor (a rough layout for another computer)
    var fl = cs.placed ? cs.placed.slice().sort(function (a, c) { return a.x - c.x; }).slice(0, 7).map(function (q) { return q.id; }) : (cs.floor || []);
    for (var fi = 0; fi < 7; fi++) b.put(fl[fi] ? BK.CASTLE_PROPS.findIndex(function (o) { return o.id === fl[fi]; }) + 1 : 0, 6);
    b.put(Math.min(4, cs.frames || 0), 3);
    var em = p.emblem;
    b.put(em ? 1 : 0, 1);
    if (em) { b.put(em.field, 3); b.put(em.fc, 4); b.put(em.pattern, 3); b.put(em.pc, 4); b.put(em.symbol, 4); b.put(em.sc, 4); }
    b.put(p.menuBg || 0, 4);
    BK.TALES.forEach(function (t) { b.put(((p.tales || {})[t.id] || {}).done ? 1 : 0, 1); });
    // v10 (v0.12): keyboard looks and effects, the look in use, the effects switched on
    BK.KB_THEMES.forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); });
    b.put(Math.max(0, BK.KB_THEMES.findIndex(function (o) { return o.id === fx.kb; })), 4);
    BK.KB_EFFECTS.slice(0, 3).forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); b.put((fx.kbOn || []).indexOf(o.id) >= 0 ? 1 : 0, 1); });
    // castle store: how many of each thing (the layout itself stays on this computer); pinned badges
    var inv = (p.castle && p.castle.inv) || {};
    BK.CASTLE_PROPS.forEach(function (o) { b.put(Math.min(7, inv[o.id] || ((cs.props || []).indexOf(o.id) >= 0 ? 1 : 0)), 3); });
    for (var pi = 0; pi < 3; pi++) { var bi = BK.BADGES ? BK.BADGES.findIndex(function (x) { return x.id === (p.pins || [])[pi]; }) : -1; b.put(bi + 1, 5); }
    // v11 (v0.12.1): keyboard effects added later (moving waves), the Shift tip switch
    BK.KB_EFFECTS.slice(3).forEach(function (o) { b.put(own.indexOf(o.id) >= 0 ? 1 : 0, 1); b.put((fx.kbOn || []).indexOf(o.id) >= 0 ? 1 : 0, 1); });
    b.put(p.settings.shiftTip === false ? 1 : 0, 1);
    storyOrder().forEach(function (k) { b.put(Math.min(3, (p.stories || {})[k] || 0), 2); });
    while (b.a.length > 5 && b.a.lastIndexOf(1) < b.a.length - 5) b.a.length -= 5;   // drop trailing zero groups
    while (b.a.length % 5) b.a.push(0);
    var sum = 0; for (var i = 0; i < b.a.length; i += 5) sum = (sum * 31 + parseInt(b.a.slice(i, i + 5).join(''), 2)) % 1024;
    b.put(sum, 10);
    var out = '';
    for (i = 0; i < b.a.length; i += 5) out += B32[parseInt(b.a.slice(i, i + 5).join(''), 2)];
    return out.match(/.{1,4}/g).join('-');
  }

  function decode(code) {
    var clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    if (clean.length < 20) throw new Error('short');
    var bits = [];
    for (var i = 0; i < clean.length; i++) {
      var v = B32.indexOf(clean[i]); if (v < 0) throw new Error('char');
      for (var j = 4; j >= 0; j--) bits.push((v >> j) & 1);
    }
    var body = bits.slice(0, bits.length - 10);
    var sum = 0; for (i = 0; i + 5 <= body.length; i += 5) sum = (sum * 31 + parseInt(body.slice(i, i + 5).join(''), 2)) % 1024;
    var check = parseInt(bits.slice(bits.length - 10).join(''), 2);
    if (sum !== check) throw new Error('checksum');
    var rd = new Reader(body);
    var ver = rd.get(3);
    if (ver === 0) ver = rd.get(5);          // version 8 and up
    if (ver < 1 || ver > 11) throw new Error('version');
    var avatar = rd.get(3), grade = rd.get(1) ? '5-6' : '3-4', lang = rd.get(1) ? 'en' : 'hu', placed = rd.get(3) || null;
    var nl = rd.get(4), nick = '';
    for (i = 0; i < nl; i++) nick += NICK[rd.get(7)] || '';
    var p = newProfile(nick || 'Játékos', avatar, grade, lang);
    p.placed = placed;
    p.coins = rd.get(14);
    for (var r = 1; r <= 7; r++) for (var l = 0; l < 4; l++) p.progress[r].stars[l] = rd.get(2);
    var ob = rd.get(8); p.outfits = BK.OUTFITS.filter(function (o, i) { return (ob >> i) & 1; }).map(function (o) { return o.id; });
    if (p.outfits.indexOf('base') < 0) p.outfits.unshift('base');
    var pb = rd.get(8); p.pets = BK.PETS.filter(function (o, i) { return (pb >> i) & 1; }).map(function (o) { return o.id; });
    p.outfit = (BK.OUTFITS[rd.get(3)] || BK.OUTFITS[0]).id;
    var pi = rd.get(3); p.pet = pi ? BK.PETS[pi - 1].id : null;
    BK.ITEMS.forEach(function (it) { var c = rd.get(2); if (c) p.items[it.id] = c; });
    var LV = { 1: { acc: 0.97, ms: 450 }, 2: { acc: 0.9, ms: 800 }, 3: { acc: 0.8, ms: 1200 } };
    if (ver === 1) Array.from(KEYLIST).forEach(function (k) { var v = rd.get(2); if (v) p.keys[k] = { n: 10, acc: LV[v].acc, ms: LV[v].ms }; });
    p.best.wpm = rd.get(7); p.best.acc = rd.get(7) / 100;
    for (r = 1; r <= 7; r++) {
      var cr = [0, 0, 0, 0], any = false;
      for (l = 0; l < 4; l++) { cr[l] = rd.get(1); if (cr[l]) any = true; }
      if (any) p.crowns[r] = cr;
    }
    if (rd.get(1)) p.settings.layout = 'us';
    var ui = rd.get(1), fi = rd.get(2);
    // a code from before v0.6.2 has none of this: keep the local defaults then
    p.settings.ui = ui ? 'en' : null;
    p.settings.font = fi ? BK.FONTS[fi].id : null;
    p.best.endless = rd.get(8);
    if (ver >= 3) { p.avatar |= rd.get(2) << 3; if (p.avatar >= BK.HEROES.length) p.avatar = 0; }
    if (ver >= 4) {
      // shapes are read by position (v4's dot, box, wave are now wave, code, comet); v4 had 4 colour sets
      var own = [], nc = ver >= 7 ? BK.SHOT_COLOURS.length : ver >= 5 ? 6 : 4;   // v7 added neon
      BK.SHOT_SHAPES.forEach(function (o) { if (rd.get(1)) own.push(o.id); });
      BK.SHOT_COLOURS.slice(0, nc).forEach(function (o) { if (rd.get(1)) own.push(o.id); });
      ['wave', 'classic', 'spark'].forEach(function (k) { if (own.indexOf(k) < 0) own.push(k); });
      var si = BK.SHOT_SHAPES[rd.get(3)] || BK.SHOT_SHAPES[0], ci = BK.SHOT_COLOURS[rd.get(ver >= 5 ? 3 : 2)] || BK.SHOT_COLOURS[0];
      var tone = ver >= 5 ? rd.get(3) : 0;
      p.fx = { v: 2, owned: own, shape: own.indexOf(si.id) >= 0 ? si.id : 'wave', colour: own.indexOf(ci.id) >= 0 ? ci.id : 'classic',
        tone: ci.cols && tone < ci.cols.length ? tone : 0, impact: 'spark' };
    }
    if (ver >= 6) {
      p.figures = [];
      BK.HEROES.filter(function (h) { return h.lock; }).forEach(function (h) { if (rd.get(1)) p.figures.push(h.id); });
      if (rd.get(1)) p.halloween = { stars: [1, 1, 1, 1] };
    }
    if (ver >= 7) {
      BK.SHOT_IMPACTS.forEach(function (o) { if (rd.get(1) && p.fx.owned.indexOf(o.id) < 0) p.fx.owned.push(o.id); });
      var ii = BK.SHOT_IMPACTS[rd.get(3)] || BK.SHOT_IMPACTS[0];
      p.fx.impact = p.fx.owned.indexOf(ii.id) >= 0 ? ii.id : 'spark';
      p.arena = {};
      BK.arenaBosses(p).forEach(function (a) { var nn = rd.get(1), hh = rd.get(1); if (nn || hh) p.arena[a.id] = { n: nn, h: hh }; });
    }
    p.fx.glow = 'g_none';
    if (p.fx.owned.indexOf('g_none') < 0) p.fx.owned.push('g_none');
    if (ver >= 8) {
      BK.SHOT_GLOWS.forEach(function (o) { if (rd.get(1) && p.fx.owned.indexOf(o.id) < 0) p.fx.owned.push(o.id); });
      var gi = BK.SHOT_GLOWS[rd.get(3)] || BK.SHOT_GLOWS[0];
      p.fx.glow = p.fx.owned.indexOf(gi.id) >= 0 ? gi.id : 'g_none';
    }
    if (ver >= 9) {
      p.dishes = {}; BK.RECIPES.forEach(function (r) { var v = rd.get(2); if (v) p.dishes[r.id] = v; });
      p.rares = {}; BK.RARES.forEach(function (r) { var v = rd.get(3); if (v) p.rares[r.id] = v; });
      p.castle = { props: [], floor: [], frames: 0, framed: [] };
      BK.CASTLE_PROPS.forEach(function (o) { if (rd.get(1)) p.castle.props.push(o.id); });
      for (var fi = 0; fi < 7; fi++) { var ix = rd.get(6); p.castle.floor[fi] = ix && BK.CASTLE_PROPS[ix - 1] ? BK.CASTLE_PROPS[ix - 1].id : null; }
      p.castle.frames = rd.get(3);
      if (rd.get(1)) p.emblem = { field: rd.get(3), fc: rd.get(4), pattern: rd.get(3), pc: rd.get(4), symbol: rd.get(4), sc: rd.get(4), letter: (p.nick || 'A').charAt(0).toUpperCase() };
      p.menuBg = rd.get(4);
      p.tales = {}; BK.TALES.forEach(function (t) { if (rd.get(1)) p.tales[t.id] = { at: 0, done: 1 }; });
    }
    p.fx.kb = 'kb_classic'; p.fx.kbOn = [];
    if (p.fx.owned.indexOf('kb_classic') < 0) p.fx.owned.push('kb_classic');
    if (ver >= 10) {
      BK.KB_THEMES.forEach(function (o) { if (rd.get(1) && p.fx.owned.indexOf(o.id) < 0) p.fx.owned.push(o.id); });
      var ki = BK.KB_THEMES[rd.get(4)] || BK.KB_THEMES[0];
      p.fx.kb = p.fx.owned.indexOf(ki.id) >= 0 ? ki.id : 'kb_classic';
      BK.KB_EFFECTS.slice(0, 3).forEach(function (o) { var ow = rd.get(1), on = rd.get(1); if (ow && p.fx.owned.indexOf(o.id) < 0) p.fx.owned.push(o.id); if (ow && on) p.fx.kbOn.push(o.id); });
      p.castle.inv = {}; p.castle.placed = null;
      BK.CASTLE_PROPS.forEach(function (o) { var v = rd.get(3); if (v) { p.castle.inv[o.id] = v; if (p.castle.props.indexOf(o.id) < 0) p.castle.props.push(o.id); } });
      p.pins = []; for (var pi = 0; pi < 3; pi++) { var bi = rd.get(5); if (bi && BK.BADGES && BK.BADGES[bi - 1]) p.pins.push(BK.BADGES[bi - 1].id); }
    }
    if (ver >= 11) {
      BK.KB_EFFECTS.slice(3).forEach(function (o) { var ow = rd.get(1), on = rd.get(1); if (ow && p.fx.owned.indexOf(o.id) < 0) p.fx.owned.push(o.id); if (ow && on) p.fx.kbOn.push(o.id); });
      if (rd.get(1)) p.settings.shiftTip = false;
    }
    storyOrder().forEach(function (k) { var v = rd.get(2); if (v) p.stories[k] = v; });
    return p;
  }

  // ---------------------------------------------------------------- teacher PIN
  // Only keeps curious children out; it is not real security.
  function pinHash(pin) {
    var h = BK.util.hash('betukaland:' + pin);
    for (var i = 0; i < 500; i++) h = BK.util.hash(h.toString(36) + pin);
    return h.toString(36);
  }

  return {
    load: load,
    persist: persist,
    storageOk: function () { return storageOk; },
    newProfile: newProfile,
    upgrade: upgrade,
    profiles: function () { return load().profiles; },
    get: function (id) { return load().profiles.find(function (p) { return p.id === id; }) || null; },
    add: function (p) { load().profiles.push(p); load().lastProfile = p.id; persist(); return p; },
    remove: function (id) { var s = load(); s.profiles = s.profiles.filter(function (p) { return p.id !== id; }); persist(); },
    replace: function (p) {
      var s = load(), i = s.profiles.findIndex(function (q) { return q.id === p.id; });
      if (i >= 0) s.profiles[i] = p; else s.profiles.push(p);
      persist();
    },
    setLast: function (id) { load().lastProfile = id; persist(); },
    font: function (v) { if (v !== undefined) { load().font = v; persist(); } return load().font || 'andika'; },
    uiLang: function (v) { if (v !== undefined) { load().uiLang = v; persist(); } return load().uiLang || 'hu'; },
    regionOpen: regionOpen, regionCleared: regionCleared, levelUnlocked: levelUnlocked,
    merge: merge,
    totalStars: totalStars, currentRegion: currentRegion, recordLevel: recordLevel, storyKey: storyKey,
    encode: encode, decode: decode,
    toFile: function (p) { return JSON.stringify({ app: 'betukaland', version: 1, profile: p }, null, 1); },
    fromFile: function (text) {
      var o = JSON.parse(text);
      if (!o || o.app !== 'betukaland' || !o.profile) throw new Error('not a save file');
      return upgrade(o.profile);
    },
    pinHash: pinHash,
    teacher: function () { return load().teacher; },
    // Halloween Night on this computer (Teacher screen switch)
    // the teacher's switch: Exit on the map also downloads the child's save file (default on)
    autoFile: function (v) { var t = load().teacher; if (v !== undefined) { t.autoFile = !!v; persist(); } return t.autoFile !== false; },
    fileName: function (p) { return 'betukaland-' + p.nick.replace(/[^\p{L}0-9]+/gu, '_') + '-' + BK.util.today() + '.json'; },
    halloween: function (v) { var t = load().teacher; if (v !== undefined) { t.halloween = !!v; persist(); } return !!t.halloween; },
  };
})();
