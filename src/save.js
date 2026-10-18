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
      settings: { keyboard: true, fingers: true, music: true, sfx: true, speedRun: false },
      progress: {},                       // regionId -> { stars: [l1, l2, l3, boss] }
      coins: 0,
      items: {},                          // item id -> count
      outfits: ['base'], outfit: 'base',
      pets: [], pet: null,
      fx: BK.FX_DEFAULT(),                // the shop's magic shots
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
    p.settings = Object.assign({ keyboard: true, fingers: true, music: true, sfx: true, speedRun: false }, p.settings || {});
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
    if (inc.fx) { (inc.fx.owned || []).forEach(function (o) { if (local.fx.owned.indexOf(o) < 0) local.fx.owned.push(o); }); local.fx.shape = inc.fx.shape; local.fx.colour = inc.fx.colour; local.fx.tone = inc.fx.tone || 0; }              // the figure can change, the code carries the latest choice
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
    // version 5 (v0.9.1): magic shots with single colours, RTX and chrome. Version 4 (v0.9): the shop's magic shots. Version 3 (v0.7): two more figure bits. Version 2 (v0.6.2) made codes shorter: the per-key skill levels are left out (the game relearns
    // them in a few rounds) and trailing zeros are dropped. Version 1 codes still load.
    var b = new Bits();
    b.put(5, 3);
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
    if (ver < 1 || ver > 5) throw new Error('version');
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
      var own = [], nc = ver >= 5 ? BK.SHOT_COLOURS.length : 4;
      BK.SHOT_SHAPES.forEach(function (o) { if (rd.get(1)) own.push(o.id); });
      BK.SHOT_COLOURS.slice(0, nc).forEach(function (o) { if (rd.get(1)) own.push(o.id); });
      ['wave', 'classic'].forEach(function (k) { if (own.indexOf(k) < 0) own.push(k); });
      var si = BK.SHOT_SHAPES[rd.get(3)] || BK.SHOT_SHAPES[0], ci = BK.SHOT_COLOURS[rd.get(ver >= 5 ? 3 : 2)] || BK.SHOT_COLOURS[0];
      var tone = ver >= 5 ? rd.get(3) : 0;
      p.fx = { v: 2, owned: own, shape: own.indexOf(si.id) >= 0 ? si.id : 'wave', colour: own.indexOf(ci.id) >= 0 ? ci.id : 'classic',
        tone: ci.cols && tone < ci.cols.length ? tone : 0 };
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
    halloween: function (v) { var t = load().teacher; if (v !== undefined) { t.halloween = !!v; persist(); } return !!t.halloween; },
  };
})();
