/*
 * The child's own page (Profilom), opened from the map menu or the name in the top bar:
 *   Jelvény    - a sign put together from shapes: a field, a pattern and a symbol, in colours.
 *                It shows next to the name and on the flag of the castle.
 *   Háttér     - the sky behind the menus
 *   Kitűzők    - badges for things done (worked out from the progress, nothing to unlock by hand)
 *   Számok     - speed over the last rounds, accuracy, time, tricky keys
 */
BK.EMBLEM_COLOURS = [0xd83c3c, 0xff9a2a, 0xffd23c, 0x4ab34a, 0x2e8fd8, 0x6a4ad8, 0xd84aa8, 0xffffff, 0x3a2a24, 0x8a5a30, 0x9fe0ff, 0xc8c8d0];
BK.emblem = {
  FIELDS: ['shield', 'circle', 'square', 'pennant', 'diamond'],
  PATTERNS: ['none', 'stripe', 'half', 'cross', 'chevron', 'dots'],
  SYMBOLS: ['star', 'heart', 'moon', 'crown', 'bolt', 'sun', 'flower', 'gem', 'arrow', 'letter', 'paw', 'none'],
  NAMES: {
    shield: ['Pajzs', 'Shield'], circle: ['Kör', 'Circle'], square: ['Négyzet', 'Square'], pennant: ['Zászló', 'Pennant'], diamond: ['Rombusz', 'Diamond'],
    none: ['Nincs', 'None'], stripe: ['Csík', 'Stripe'], half: ['Fél', 'Half'], cross: ['Kereszt', 'Cross'], chevron: ['Ék', 'Chevron'], dots: ['Pöttyök', 'Dots'],
    star: ['Csillag', 'Star'], heart: ['Szív', 'Heart'], moon: ['Hold', 'Moon'], crown: ['Korona', 'Crown'], bolt: ['Villám', 'Bolt'], sun: ['Nap', 'Sun'],
    flower: ['Virág', 'Flower'], gem: ['Drágakő', 'Gem'], arrow: ['Nyíl', 'Arrow'], letter: ['Kezdőbetű', 'Initial'], paw: ['Mancs', 'Paw'],
  },
  name: function (id) { var n = BK.emblem.NAMES[id] || [id, id]; return BK.L(n[0], n[1]); },
  make: function (nick) { return { field: 0, fc: 4, pattern: 0, pc: 7, symbol: 0, sc: 2, letter: (nick || 'A').charAt(0).toUpperCase() }; },
  // the outline of a field shape, size s (centre 0,0)
  fieldPts: function (f, s) {
    var h = s / 2;
    if (f === 'shield') return [{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: 0 }, { x: h * 0.6, y: h * 0.6 }, { x: 0, y: h }, { x: -h * 0.6, y: h * 0.6 }, { x: -h, y: 0 }];
    if (f === 'square') return [{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: -h, y: h }];
    if (f === 'pennant') return [{ x: -h, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: 0, y: h * 0.55 }, { x: -h, y: h }];
    if (f === 'diamond') return [{ x: 0, y: -h }, { x: h, y: 0 }, { x: 0, y: h }, { x: -h, y: 0 }];
    var pts = []; for (var i = 0; i < 24; i++) pts.push({ x: Math.cos(i / 24 * Math.PI * 2) * h, y: Math.sin(i / 24 * Math.PI * 2) * h });
    return pts;
  },
  // polygon clipping against a convex outline (Sutherland-Hodgman), so the sign needs no mask
  // and can live inside moving containers
  clip: function (poly, clipPts) {
    var out = poly;
    for (var i = 0; i < clipPts.length && out.length; i++) {
      var A = clipPts[i], B = clipPts[(i + 1) % clipPts.length], inp = out; out = [];
      var side = function (P) { return (B.x - A.x) * (P.y - A.y) - (B.y - A.y) * (P.x - A.x); };
      for (var j = 0; j < inp.length; j++) {
        var P = inp[j], Q = inp[(j + 1) % inp.length], sp = side(P), sq = side(Q);
        if (sp >= 0) out.push(P);
        if ((sp >= 0) !== (sq >= 0)) { var t = sp / (sp - sq); out.push({ x: P.x + (Q.x - P.x) * t, y: P.y + (Q.y - P.y) * t }); }
      }
    }
    return out;
  },
  // convex pieces of a field (the pennant has a notch, so it is two halves)
  pieces: function (f, s) {
    var pts = BK.emblem.fieldPts(f, s), h = s / 2;
    if (f === 'pennant') return [[{ x: -h, y: -h }, { x: 0, y: -h }, { x: 0, y: h * 0.55 }, { x: -h, y: h }], [{ x: 0, y: -h }, { x: h, y: -h }, { x: h, y: h }, { x: 0, y: h * 0.55 }]];
    // clip works with clockwise outlines in screen space (y down)
    return [pts];
  },
  fillClipped: function (g, poly, pieces) {
    pieces.forEach(function (pc) { var q = BK.emblem.clip(poly, pc); if (q.length > 2) g.fillPoints(q, true); });
  },
  shade: function (col, f) {
    var r = (col >> 16) & 255, g = (col >> 8) & 255, b = col & 255;
    var m = function (v) { return Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f)))); };
    return (m(r) << 16) | (m(g) << 8) | m(b);
  },
  // draws the sign with a little depth: shadow, bevel, gloss, raised symbol. Returns a container.
  draw: function (scene, x, y, em, size) {
    em = em || BK.emblem.make();
    var E = BK.emblem, C = BK.EMBLEM_COLOURS, s = size, h = s / 2, c = scene.add.container(x, y);
    var field = E.FIELDS[em.field] || 'shield', pat = E.PATTERNS[em.pattern] || 'none', sym = E.SYMBOLS[em.symbol] || 'star';
    var pts = E.fieldPts(field, s), pcs = E.pieces(field, s), base = C[em.fc], d = Math.max(1, s / 20);
    var g = scene.add.graphics();
    // drop shadow and dark rim
    g.fillStyle(0x000000, 0.3).fillPoints(E.fieldPts(field, s + d * 2).map(function (q) { return { x: q.x + d, y: q.y + d * 1.5 }; }), true);
    g.fillStyle(0x2b1a14, 1).fillPoints(E.fieldPts(field, s + Math.max(2, s / 12)), true);
    // the field: darker edge, base colour inside
    g.fillStyle(E.shade(base, -0.3), 1).fillPoints(pts, true);
    g.fillStyle(base, 1).fillPoints(E.fieldPts(field, s * 0.88), true);
    var inner = E.pieces(field, s * 0.88);
    // the pattern, clipped to the field
    if (pat !== 'none') {
      var pc = C[em.pc], R = function (x0, y0, w, hh) { return [{ x: x0, y: y0 }, { x: x0 + w, y: y0 }, { x: x0 + w, y: y0 + hh }, { x: x0, y: y0 + hh }]; };
      var shapes = [];
      if (pat === 'stripe') shapes.push(R(-h, -s * 0.12, s, s * 0.24));
      else if (pat === 'half') shapes.push(R(0, -h, h, s));
      else if (pat === 'cross') { shapes.push(R(-h, -s * 0.09, s, s * 0.18)); shapes.push(R(-s * 0.09, -h, s * 0.18, s)); }
      else if (pat === 'chevron') shapes.push([{ x: 0, y: -h * 0.1 }, { x: h, y: h }, { x: -h, y: h }]);
      else if (pat === 'dots') for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) if ((dx + dy) % 2 === 0) {
        var cp = []; for (var k = 0; k < 10; k++) cp.push({ x: dx * s * 0.3 + Math.cos(k / 10 * Math.PI * 2) * s * 0.07, y: dy * s * 0.3 + Math.sin(k / 10 * Math.PI * 2) * s * 0.07 });
        shapes.push(cp);
      }
      g.fillStyle(E.shade(pc, -0.3), 1); shapes.forEach(function (q) { E.fillClipped(g, q, pcs); });
      g.fillStyle(pc, 1); shapes.forEach(function (q) { E.fillClipped(g, q, inner); });
    }
    // light from the top left: a soft band on the upper half, shade on the lower right
    g.fillStyle(0xffffff, 0.18); E.fillClipped(g, [{ x: -h, y: -h }, { x: h, y: -h }, { x: -h, y: h * 0.3 }], inner);
    g.fillStyle(0x000000, 0.14); E.fillClipped(g, [{ x: h, y: -h * 0.2 }, { x: h, y: h }, { x: -h * 0.4, y: h }], inner);
    // gloss spot
    var gl = []; for (var k2 = 0; k2 < 12; k2++) gl.push({ x: -h * 0.42 + Math.cos(k2 / 12 * Math.PI * 2) * s * 0.16, y: -h * 0.5 + Math.sin(k2 / 12 * Math.PI * 2) * s * 0.07 });
    g.fillStyle(0xffffff, 0.35); E.fillClipped(g, gl, inner);
    c.add(g);
    // the symbol: shadow, dark outline, colour, a highlight
    var col = C[em.sc], r = s * 0.28;
    var drawSym = function (sg, colour, rr) {
      sg.fillStyle(colour, 1);
      var star = function (n, ro, ri, rot) { var q = []; for (var i = 0; i < n * 2; i++) { var a = (rot === undefined ? -Math.PI / 2 : rot) + i * Math.PI / n, v = i % 2 ? ri : ro; q.push({ x: Math.cos(a) * v, y: Math.sin(a) * v }); } sg.fillPoints(q, true); };
      if (sym === 'star') star(5, rr, rr * 0.42);
      else if (sym === 'heart') { sg.fillCircle(-rr * 0.45, -rr * 0.2, rr * 0.5); sg.fillCircle(rr * 0.45, -rr * 0.2, rr * 0.5); sg.fillTriangle(-rr * 0.93, 0, rr * 0.93, 0, 0, rr * 0.95); }
      else if (sym === 'moon') { var mp = []; for (var i = 0; i <= 16; i++) { var a = Math.PI * 0.35 + i / 16 * Math.PI * 1.55; mp.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); } for (var j = 16; j >= 0; j--) { var b = Math.PI * 0.55 + j / 16 * Math.PI * 1.15; mp.push({ x: rr * 0.35 + Math.cos(b) * rr * 0.75, y: -rr * 0.2 + Math.sin(b) * rr * 0.75 }); } sg.fillPoints(mp, true); }
      else if (sym === 'crown') sg.fillPoints([{ x: -rr, y: rr * 0.6 }, { x: -rr, y: -rr * 0.5 }, { x: -rr * 0.5, y: 0 }, { x: 0, y: -rr * 0.8 }, { x: rr * 0.5, y: 0 }, { x: rr, y: -rr * 0.5 }, { x: rr, y: rr * 0.6 }], true);
      else if (sym === 'bolt') sg.fillPoints([{ x: rr * 0.2, y: -rr }, { x: -rr * 0.6, y: rr * 0.1 }, { x: -rr * 0.05, y: rr * 0.1 }, { x: -rr * 0.3, y: rr }, { x: rr * 0.6, y: -rr * 0.15 }, { x: rr * 0.05, y: -rr * 0.15 }], true);
      else if (sym === 'sun') { star(10, rr, rr * 0.6, 0); sg.fillCircle(0, 0, rr * 0.6); }
      else if (sym === 'flower') { for (var k = 0; k < 5; k++) { var a2 = k / 5 * Math.PI * 2; sg.fillCircle(Math.cos(a2) * rr * 0.55, Math.sin(a2) * rr * 0.55, rr * 0.42); } }
      else if (sym === 'gem') sg.fillPoints([{ x: -rr, y: -rr * 0.3 }, { x: -rr * 0.5, y: -rr * 0.8 }, { x: rr * 0.5, y: -rr * 0.8 }, { x: rr, y: -rr * 0.3 }, { x: 0, y: rr }], true);
      else if (sym === 'arrow') sg.fillPoints([{ x: 0, y: -rr }, { x: rr * 0.8, y: -rr * 0.1 }, { x: rr * 0.3, y: -rr * 0.1 }, { x: rr * 0.3, y: rr }, { x: -rr * 0.3, y: rr }, { x: -rr * 0.3, y: -rr * 0.1 }, { x: -rr * 0.8, y: -rr * 0.1 }], true);
      else if (sym === 'paw') { sg.fillCircle(0, rr * 0.3, rr * 0.5); [-0.6, -0.2, 0.2, 0.6].forEach(function (f, i) { sg.fillCircle(f * rr * 1.1, -rr * (i % 3 === 0 ? 0.35 : 0.7), rr * 0.24); }); }
    };
    if (sym !== 'none' && sym !== 'letter') {
      var sh = scene.add.graphics({ x: d * 0.8, y: d * 1.2 }); drawSym(sh, 0x000000, r); sh.setAlpha(0.35);
      var ol = scene.add.graphics(); drawSym(ol, 0x2b1a14, r + Math.max(1, s / 28));
      var sg = scene.add.graphics(); drawSym(sg, col, r);
      var hl = scene.add.graphics({ x: -s * 0.02, y: -s * 0.03 }); drawSym(hl, E.shade(col, 0.45), r * 0.55); hl.setAlpha(0.55);
      c.add([sh, ol, sg, hl]);
      if (sym === 'flower') { var fc = scene.add.graphics(); fc.fillStyle(0xffd23c, 1).fillCircle(0, 0, r * 0.35); fc.fillStyle(0xffffff, 0.5).fillCircle(-r * 0.1, -r * 0.1, r * 0.12); c.add(fc); }
    }
    if (sym === 'letter') {
      var px = Math.max(7, Math.round(s * 0.55));
      c.add(BK.ui.text(scene, d * 0.8, d * 1.2, em.letter || 'A', { outline: false, origin: [0.5, 0.5], px: px, bold: true, color: 0x000000 }).setAlpha(0.35));
      c.add(BK.ui.text(scene, 0, 0, em.letter || 'A', { outline: s >= 24, origin: [0.5, 0.5], px: px, bold: true, color: col }));
    }
    return c;
  },
};

// Badges: worked out from the profile each time
BK.BADGES = [
  { id: 'first', name: ['Az első pálya', 'First level'], icon: 29, test: function (p) { return (p.history || []).length >= 1; } },
  { id: 'stars10', name: ['10 csillag', '10 stars'], icon: 202, test: function (p) { return BK.save.totalStars(p) >= 10; } },
  { id: 'stars50', name: ['50 csillag', '50 stars'], icon: 172, test: function (p) { return BK.save.totalStars(p) >= 50; } },
  { id: 'boss1', name: ['Béka Lovag barátja', 'Frog Knight\'s friend'], icon: 46, test: function (p) { return p.progress[1] && p.progress[1].stars[3] > 0; } },
  { id: 'allboss', name: ['A Felhővár hőse', 'Hero of the Cloud Castle'], icon: 197, test: function (p) { return p.progress[7] && p.progress[7].stars[3] > 0; } },
  { id: 'perfect', name: ['Hibátlan pálya', 'A flawless level'], icon: 57, test: function (p) { return (p.history || []).some(function (h) { return h.acc >= 0.999 && h.wpm > 0; }); } },
  { id: 'fast20', name: ['20 szó/perc', '20 words a minute'], icon: 148, test: function (p) { return (p.best && p.best.wpm) >= 20; } },
  { id: 'fast35', name: ['35 szó/perc', '35 words a minute'], icon: 178, test: function (p) { return (p.best && p.best.wpm) >= 35; } },
  { id: 'streak3', name: ['3 nap egymás után', '3 days in a row'], icon: 135, test: function (p) { return (p.streak && p.streak.best) >= 3; } },
  { id: 'streak7', name: ['Egy hét minden nap', 'A whole week'], icon: 175, test: function (p) { return (p.streak && p.streak.best) >= 7; } },
  { id: 'endless', name: ['50 szó a végtelen úton', '50 words on the endless road'], icon: 47, test: function (p) { return (p.best && p.best.endless) >= 50; } },
  { id: 'tale', name: ['Az első mese', 'The first tale'], icon: 111, test: function (p) { return Object.keys(p.tales || {}).some(function (k) { return p.tales[k].done; }); } },
  { id: 'tales5', name: ['Öt mese', 'Five tales'], icon: 110, test: function (p) { return Object.keys(p.tales || {}).filter(function (k) { return p.tales[k].done; }).length >= 5; } },
  { id: 'cook', name: ['Kis szakács', 'Little cook'], icon: 114, test: function (p) { return Object.keys(p.dishes || {}).length >= 1; } },
  { id: 'chef', name: ['Mesterszakács', 'Master chef'], icon: 175, test: function (p) { return BK.RECIPES.every(function (r) { return p.dishes && p.dishes[r.id] !== undefined; }); } },
  { id: 'rare', name: ['Ritka kincs', 'A rare treasure'], icon: 58, test: function (p) { return BK.rareCount(p) > 0 || (p.fx && ['rtx', 'neon', 'chrome'].some(function (k) { return p.fx.owned.indexOf(k) >= 0; })); } },
  { id: 'castle', name: ['Berendezett vár', 'A furnished castle'], icon: 123, test: function (p) { return ((p.castle && p.castle.placed) || []).length >= 5 || ((p.castle && p.castle.floor) || []).filter(Boolean).length >= 5; } },
  { id: 'arena', name: ['Aréna-bajnok', 'Arena champion'], icon: 202, test: function (p) { return Object.keys(p.arena || {}).some(function (k) { return p.arena[k].h; }); } },
  { id: 'halloween', name: ['Halloween éjszaka', 'Halloween Night'], icon: 40, test: function (p) { return !!(p.halloween && p.halloween.stars && p.halloween.stars[3]); } },
  { id: 'crowns', name: ['Korona', 'A crown'], icon: 197, test: function (p) { return Object.keys(p.crowns || {}).length > 0; } },
];

// Where the child is in the game: per region and level 'done', 'skipped' (an earlier level left
// out while a later one was played, e.g. after the warm-up test jumped ahead), 'open' or 'locked'
BK.progressMap = function (p) {
  var regs = BK.REGIONS.filter(function (r) { return r.playable; }), out = {}, seen = false, skipped = 0;
  for (var i = regs.length - 1; i >= 0; i--) {
    var r = regs[i], st = (p.progress[r.id] || { stars: [0, 0, 0, 0] }).stars, row = [];
    for (var l = 3; l >= 0; l--) {
      var n = st[l] || 0, k;
      if (n > 0) { k = 'done'; seen = true; }
      else if (seen) { k = 'skipped'; skipped++; }
      else k = BK.save.regionOpen(p, r.id) && BK.save.levelUnlocked(p, r.id, l) ? 'open' : 'locked';
      row[l] = { stars: n, state: k };
    }
    out[r.id] = row;
  }
  out.skipped = skipped;
  return out;
};
BK.regionSkipped = function (p, rid) {
  var m = BK.progressMap(p); return (m[rid] || []).some(function (c) { return c.state === 'skipped'; });
};

BK.ProfileScene = class extends Phaser.Scene {
  constructor() { super('Profile'); }
  init(data) { this.tab = (data && data.tab) || this.tab || 0; }
  create() {
    var s = this, P = this.P = BK.state.profile;
    if (!P.emblem) P.emblem = BK.emblem.make(P.nick);
    BK.menuBackground(this, 4, { groundY: 200 });
    BK.audio.music(BK.MUSIC.map);
    BK.ui.nine(this, 16, 4, 352, 182, 'ui_panel2');
    BK.ui.text(this, 192, 32, P.nick, { outline: false, size: 2, origin: [0.5, 0.5] });
    var tabs = [BK.L('Jelvény', 'Sign'), BK.L('Háttér', 'Background'), BK.L('Kitűzők', 'Badges'), BK.L('Haladás', 'Progress'), BK.L('Számok', 'Numbers')];
    tabs.forEach(function (t, i) {
      var x = 60 + i * 66;
      BK.ui.button(s, x, 50, t, function () { if (s.tab !== i) { s.tab = i; BK.audio.sfx('ui'); s.scene.restart({ tab: i }); } }, { w: 62, h: 16 });
      if (i === s.tab) s.add.rectangle(x, 50, 66, 20).setStrokeStyle(1, 0x9a3d1a);
    });
    this.page = [];
    this.drawTab();
    BK.ui.button(this, 192, 196, BK.T.back, function () { BK.save.persist(); s.scene.start('Map'); }, { w: 80, h: 18, key: 'ESC' });
  }
  keep(o) { this.page.push(o); return o; }
  drawTab() {
    this.page.forEach(function (o) { o.destroy(); });
    this.page = [];
    [this.drawSign, this.drawBackground, this.drawBadges, this.drawProgress, this.drawNumbers][this.tab].call(this);
  }
  // the sign: a big preview and a row of arrows for each part
  drawSign() {
    var s = this, P = this.P, em = P.emblem, E = BK.emblem, NC = BK.EMBLEM_COLOURS.length;
    this.keep(E.draw(this, 90, 112, em, 64));
    var rows = [
      [BK.L('Forma', 'Shape'), 'field', E.FIELDS.length, function () { return E.name(E.FIELDS[em.field]); }],
      [BK.L('Szín', 'Colour'), 'fc', NC, null],
      [BK.L('Minta', 'Pattern'), 'pattern', E.PATTERNS.length, function () { return E.name(E.PATTERNS[em.pattern]); }],
      [BK.L('Minta színe', 'Pattern colour'), 'pc', NC, null],
      [BK.L('Jel', 'Symbol'), 'symbol', E.SYMBOLS.length, function () { return E.name(E.SYMBOLS[em.symbol]); }],
      [BK.L('Jel színe', 'Symbol colour'), 'sc', NC, null],
    ];
    rows.forEach(function (r, i) {
      var y = 70 + i * 15;
      s.keep(BK.ui.text(s, 160, y, r[0], { outline: false, origin: [0, 0.5], px: 10, color: 0x4a2c1c }));
      var step = function (d) { em[r[1]] = (em[r[1]] + d + r[2]) % r[2]; BK.audio.sfx('ui'); BK.save.persist(); s.drawTab(); };
      s.keep(BK.ui.button(s, 250, y, '<', function () { step(-1); }, { w: 16, h: 16 }));
      s.keep(BK.ui.button(s, 340, y, '>', function () { step(1); }, { w: 16, h: 16 }));
      if (r[3]) s.keep(BK.ui.text(s, 295, y, r[3](), { outline: false, origin: [0.5, 0.5], px: 9, color: 0x4a2c1c, fit: 70 }));
      else s.keep(s.add.rectangle(295, y, 40, 10, BK.EMBLEM_COLOURS[em[r[1]]]).setStrokeStyle(1, 0x4a2c1c));
    });
    this.keep(BK.ui.text(this, 192, 166, BK.L('A jelvényed a neved mellett és a várad zászlóján látszik.', 'Your sign shows next to your name and on your castle flag.'),
      { outline: false, origin: [0.5, 0.5], px: 8, color: 0x9a8a80 }));
  }
  // the sky behind the menus
  drawBackground() {
    var s = this, P = this.P, skies = Object.keys(BK_MANIFEST.skies).map(Number).sort(function (a, b) { return a - b; });
    var opts = [0].concat(skies);
    opts.forEach(function (n, i) {
      var x = 62 + (i % 5) * 65, y = 82 + Math.floor(i / 5) * 50, sel = (P.menuBg || 0) === n;
      s.keep(BK.ui.nine(s, x - 29, y - 20, 58, 40, sel ? 'ui_slot_sel' : 'ui_slot'));
      if (n) {
        var L = BK_MANIFEST.skies[n].length;
        for (var k = 1; k <= L; k++) s.keep(s.add.image(x, y - 2, 'sky' + n + '_' + k).setDisplaySize(52, 30));
      } else s.keep(BK.ui.text(s, x, y - 2, BK.L('Alap', 'Default'), { outline: false, origin: [0.5, 0.5], px: 8, align: 1, color: 0x4a2c1c }));
      if (sel) s.keep(s.add.rectangle(x, y, 62, 44).setStrokeStyle(2, 0xffffff));
      var z = s.keep(s.add.zone(x, y, 58, 40).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () { P.menuBg = n; BK.save.persist(); BK.audio.sfx('ui'); s.scene.restart({ tab: 1 }); });
    });
  }
  drawBadges() {
    var s = this, P = this.P, got = 0;
    P.pins = (P.pins || []).filter(function (id) { return BK.BADGES.some(function (b) { return b.id === id && b.test(P); }); });
    BK.BADGES.forEach(function (b, i) {
      var x = 44 + (i % 4) * 82, y = 68 + Math.floor(i / 4) * 19, ok = b.test(P), pinned = P.pins.indexOf(b.id) >= 0;
      if (ok) got++;
      s.keep(BK.ui.nine(s, x - 9, y - 9, 18, 18, ok ? 'ui_slot_sel' : 'ui_slot_off'));
      var im = s.keep(s.add.image(x, y, 'icons_food', b.icon).setScale(0.8));
      if (!ok) im.setTint(0x302828).setAlpha(0.5);
      if (pinned) { var g = s.keep(s.add.graphics()); g.fillStyle(0x6b1a1a, 1).fillCircle(x + 7, y - 7, 3.5); g.fillStyle(0xe84a4a, 1).fillCircle(x + 7, y - 7, 2.5); g.fillStyle(0xffffff, 0.8).fillCircle(x + 6, y - 8, 0.9); }
      s.keep(BK.ui.text(s, x + 12, y, BK.L(b.name[0], b.name[1]), { outline: false, origin: [0, 0.5], px: 8, color: pinned ? 0x9a1a1a : (ok ? 0x4a2c1c : 0x9a8a80), bold: pinned, fit: 66 }));
      if (ok) {
        var z = s.keep(s.add.zone(x + 30, y, 80, 18).setInteractive({ useHandCursor: true }));
        z.on('pointerup', function () {
          var k = P.pins.indexOf(b.id);
          if (k >= 0) P.pins.splice(k, 1);
          else { if (P.pins.length >= 3) P.pins.shift(); P.pins.push(b.id); }
          BK.audio.sfx('ui'); BK.save.persist(); s.drawTab();
        });
      }
    });
    this.keep(BK.ui.text(this, 192, 157, got + ' / ' + BK.BADGES.length + BK.L(' kitűző', ' badges'), { outline: false, origin: [0.5, 0.5], px: 9, color: 0x6b3a20 }));
    this.keep(BK.ui.text(this, 192, 168, BK.L('Kattints egy megszerzettre, és kitűzöd a várad falára (legfeljebb 3).', 'Click one you have earned to pin it on your castle wall (up to 3).'),
      { outline: false, origin: [0.5, 0.5], px: 7, color: 0x9a8a80 }));
  }
  // where am I in the game: every region and level, with what was left out
  drawProgress() {
    var s = this, P = this.P, m = BK.progressMap(P), regs = BK.REGIONS.filter(function (r) { return r.playable; });
    var cols = ['1', '2', '3', BK.L('Főnök', 'Boss')];
    cols.forEach(function (c, l) { s.keep(BK.ui.text(s, 140 + l * 38, 62, c, { outline: false, origin: [0.5, 0.5], px: 8, color: 0x6b3a20 })); });
    regs.forEach(function (r, i) {
      var y = 74 + i * 13;
      s.keep(BK.ui.text(s, 34, y, r.id + '. ' + r.name, { outline: false, origin: [0, 0.5], px: 8, color: 0x4a2c1c, fit: 92 }));
      m[r.id].forEach(function (c, l) {
        var x = 140 + l * 38;
        if (c.state === 'done') s.keep(BK.ui.stars(s, x, y, c.stars, 3, 9).setScale(0.8));
        else if (c.state === 'skipped') {
          s.keep(s.add.rectangle(x, y, 34, 10, 0xffb84a).setStrokeStyle(1, 0x9a3d1a));
          s.keep(BK.ui.text(s, x, y, BK.L('kimaradt', 'skipped'), { outline: false, origin: [0.5, 0.5], px: 7, bold: true, color: 0x6b2a10 }));
        } else if (c.state === 'open') s.keep(BK.ui.text(s, x, y, BK.L('nyitva', 'open'), { outline: false, origin: [0.5, 0.5], px: 7, color: 0x2e7d3e }));
        else s.keep(BK.ui.text(s, x, y, '·', { outline: false, origin: [0.5, 0.5], px: 8, color: 0xb8a898 }));
      });
    });
    // the rest of the game
    var tales = Object.keys(P.tales || {}).filter(function (k) { return P.tales[k].done; }).length;
    var arena = BK.arenaBosses(P), aw = arena.filter(function (a) { return (P.arena || {})[a.id]; }).length;
    var stories = Object.keys(P.stories || {}).length;
    var dishes = BK.RECIPES.filter(function (r) { return P.dishes && P.dishes[r.id] !== undefined; }).length;
    var extra = [
      [BK.L('Mesék', 'Tales'), tales + ' / ' + BK.TALES.length],
      [BK.L('Történetek', 'Stories'), String(stories)],
      [BK.L('Aréna', 'Arena'), aw + ' / ' + arena.length],
      [BK.L('Receptek', 'Recipes'), dishes + ' / ' + BK.RECIPES.length],
      ['Halloween', P.halloween && P.halloween.stars && P.halloween.stars[3] ? BK.L('kész', 'done') : '-'],
    ];
    extra.forEach(function (e, i) {
      s.keep(BK.ui.text(s, 290, 66 + i * 15, e[0], { outline: false, origin: [0, 0.5], px: 8, color: 0x6b3a20 }));
      s.keep(BK.ui.text(s, 356, 66 + i * 15, e[1], { outline: false, origin: [1, 0.5], px: 8, bold: true, color: 0x4a2c1c }));
    });
    this.keep(BK.ui.text(this, 192, 172, m.skipped ? BK.L('A narancssárgák kimaradtak. Érdemes visszamenni értük a térképen!', 'The orange ones were skipped. Go back for them on the map!')
      : BK.L('Semmi sem maradt ki. Szép munka!', 'Nothing left out. Well done!'), { outline: false, origin: [0.5, 0.5], px: 8, color: m.skipped ? 0x9a3d1a : 0x2e7d3e }));
  }
  // speed over the last rounds, and a few numbers
  drawNumbers() {
    var s = this, P = this.P, h = (P.history || []).filter(function (x) { return x.wpm > 0; }).slice(-30);
    var x0 = 34, y0 = 66, w = 200, hh = 84;
    var g = this.keep(this.add.graphics());
    g.fillStyle(0xf6e3c8, 1).fillRect(x0, y0, w, hh);
    var maxW = Math.max(10, Math.max.apply(null, h.map(function (x) { return x.wpm; }).concat([10])));
    if (h.length > 1) {
      g.lineStyle(1, 0xd8b896, 1);
      for (var q = 1; q < 4; q++) g.lineBetween(x0, y0 + hh * q / 4, x0 + w, y0 + hh * q / 4);
      g.lineStyle(2, 0x9a3d1a, 1).beginPath();
      h.forEach(function (r, i) { var px = x0 + i / (h.length - 1) * w, py = y0 + hh - r.wpm / maxW * (hh - 6); if (i) g.lineTo(px, py); else g.moveTo(px, py); });
      g.strokePath();
    } else this.keep(BK.ui.text(this, x0 + w / 2, y0 + hh / 2, BK.L('Még kevés a kör.', 'Not enough rounds yet.'), { outline: false, origin: [0.5, 0.5], px: 9, color: 0x9a8a80 }));
    this.keep(BK.ui.text(this, x0, y0 - 6, BK.L('Sebesség az utolsó ' + h.length + ' körben (szó/perc)', 'Speed over the last ' + h.length + ' rounds (wpm)'), { outline: false, px: 8, color: 0x6b3a20, fit: 200 }));
    this.keep(BK.ui.text(this, x0 - 2, y0, String(Math.round(maxW)), { outline: false, origin: [1, 0], px: 7, color: 0x9a8a80 }));
    var all = P.history || [], ms = all.reduce(function (a, x) { return a + (x.ms || 0); }, 0);
    var acc = all.length ? all.reduce(function (a, x) { return a + (x.acc || 0); }, 0) / all.length : 0;
    var weak = BK.adaptive.weakest(P, 5).filter(function (k) { return k !== ' '; });
    var lines = [
      [BK.L('Körök', 'Rounds'), String(all.length)],
      [BK.L('Idő', 'Time'), Math.round(ms / 60000) + BK.L(' perc', ' min')],
      [BK.L('Legjobb', 'Best'), Math.round((P.best && P.best.wpm) || 0) + BK.L(' szó/perc', ' wpm')],
      [BK.L('Pontosság', 'Accuracy'), Math.round(acc * 100) + '%'],
      [BK.L('Csillagok', 'Stars'), String(BK.save.totalStars(P))],
      [BK.L('Nehéz betűk', 'Tricky keys'), weak.length ? weak.join(' ') : '-'],
    ];
    lines.forEach(function (l, i) {
      s.keep(BK.ui.text(s, 252, 66 + i * 15, l[0], { outline: false, px: 9, color: 0x6b3a20 }));
      s.keep(BK.ui.text(s, 346, 66 + i * 15, l[1], { outline: false, origin: [1, 0], px: 9, bold: true, color: 0x4a2c1c, fit: 50 }));
    });
  }
};
