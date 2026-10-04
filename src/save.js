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
    if (!(p.avatar >= 0 && p.avatar < BK.HEROES.length)) p.avatar = 0;   // figure list changed in v0.2
    return p;
  }

  // ---------------------------------------------------------------- progress
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
    if (res.practice === 'story' && res.storyId) p.stories[res.storyId] = Math.max(p.stories[res.storyId] || 0, res.stars);
    p.coins = Math.min(16000, p.coins + (res.coins || 0));
    p.history.push({ d: BK.util.today(), r: res.r, l: res.l, wpm: Math.round(res.wpm * 10) / 10,
      acc: Math.round(res.acc * 1000) / 1000, stars: res.stars, ms: res.ms, daily: !!res.daily, practice: res.practice || undefined });
    if (p.history.length > 100) p.history.shift();
    var newBest = false;
    if (res.acc >= 0.85 && res.wpm > p.best.wpm) { p.best.wpm = Math.round(res.wpm * 10) / 10; newBest = true; }
    if (res.acc > p.best.acc) p.best.acc = Math.round(res.acc * 1000) / 1000;
    if (res.daily) p.daily = BK.util.today();
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
    var b = new Bits();
    b.put(1, 3);
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
    Array.from(KEYLIST).forEach(function (k) { b.put(keyLevel(p, k), 2); });
    b.put(Math.min(127, Math.round(p.best.wpm)), 7);
    b.put(Math.min(100, Math.round(p.best.acc * 100)), 7);
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
    if (rd.get(3) !== 1) throw new Error('version');
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
    Array.from(KEYLIST).forEach(function (k) { var v = rd.get(2); if (v) p.keys[k] = { n: 10, acc: LV[v].acc, ms: LV[v].ms }; });
    p.best.wpm = rd.get(7); p.best.acc = rd.get(7) / 100;
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
    regionOpen: regionOpen, regionCleared: regionCleared, levelUnlocked: levelUnlocked,
    totalStars: totalStars, currentRegion: currentRegion, recordLevel: recordLevel,
    encode: encode, decode: decode,
    toFile: function (p) { return JSON.stringify({ app: 'betukaland', version: 1, profile: p }, null, 1); },
    fromFile: function (text) {
      var o = JSON.parse(text);
      if (!o || o.app !== 'betukaland' || !o.profile) throw new Error('not a save file');
      return upgrade(o.profile);
    },
    pinHash: pinHash,
    teacher: function () { return load().teacher; },
  };
})();
