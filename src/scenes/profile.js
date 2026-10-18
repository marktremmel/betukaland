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
  // draws the sign; returns a container (destroy it to remove)
  draw: function (scene, x, y, em, size) {
    em = em || BK.emblem.make();
    var C = BK.EMBLEM_COLOURS, s = size, h = s / 2, c = scene.add.container(x, y);
    var field = BK.emblem.FIELDS[em.field] || 'shield', pat = BK.emblem.PATTERNS[em.pattern] || 'none', sym = BK.emblem.SYMBOLS[em.symbol] || 'star';
    var pts = BK.emblem.fieldPts(field, s);
    // the field, with the pattern drawn inside it through a mask of the same shape
    var g = scene.add.graphics();
    g.fillStyle(0x2b1a14, 1).fillPoints(BK.emblem.fieldPts(field, s + Math.max(2, s / 12)), true);
    g.fillStyle(C[em.fc], 1).fillPoints(pts, true);
    c.add(g);
    if (pat !== 'none') {
      var p = scene.add.graphics(); p.fillStyle(C[em.pc], 1);
      if (pat === 'stripe') p.fillRect(-h, -s * 0.12, s, s * 0.24);
      else if (pat === 'half') p.fillRect(0, -h, h, s);
      else if (pat === 'cross') { p.fillRect(-h, -s * 0.09, s, s * 0.18); p.fillRect(-s * 0.09, -h, s * 0.18, s); }
      else if (pat === 'chevron') p.fillTriangle(-h, h, 0, -h * 0.1, h, h);
      else if (pat === 'dots') for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) if ((dx + dy) % 2 === 0) p.fillCircle(dx * s * 0.3, dy * s * 0.3, s * 0.07);
      var mg = scene.make.graphics({ add: false }); mg.fillStyle(0xffffff, 1);
      mg.fillPoints(pts.map(function (q) { return { x: q.x + x, y: q.y + y }; }), true);
      p.setMask(mg.createGeometryMask());
      p.maskSource = mg;
      c.add(p);
    }
    var sg = scene.add.graphics(), col = C[em.sc], r = s * 0.28;
    sg.fillStyle(col, 1);
    var star = function (n, ro, ri, rot) { var q = []; for (var i = 0; i < n * 2; i++) { var a = (rot || -Math.PI / 2) + i * Math.PI / n, rr = i % 2 ? ri : ro; q.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); } sg.fillPoints(q, true); };
    if (sym === 'star') star(5, r, r * 0.42);
    else if (sym === 'heart') { sg.fillCircle(-r * 0.45, -r * 0.2, r * 0.5); sg.fillCircle(r * 0.45, -r * 0.2, r * 0.5); sg.fillTriangle(-r * 0.93, 0, r * 0.93, 0, 0, r * 0.95); }
    else if (sym === 'moon') { sg.fillCircle(0, 0, r); sg.fillStyle(C[em.fc], 1); sg.fillCircle(r * 0.45, -r * 0.25, r * 0.8); }
    else if (sym === 'crown') sg.fillPoints([{ x: -r, y: r * 0.6 }, { x: -r, y: -r * 0.5 }, { x: -r * 0.5, y: 0 }, { x: 0, y: -r * 0.8 }, { x: r * 0.5, y: 0 }, { x: r, y: -r * 0.5 }, { x: r, y: r * 0.6 }], true);
    else if (sym === 'bolt') sg.fillPoints([{ x: r * 0.2, y: -r }, { x: -r * 0.6, y: r * 0.1 }, { x: -r * 0.05, y: r * 0.1 }, { x: -r * 0.3, y: r }, { x: r * 0.6, y: -r * 0.15 }, { x: r * 0.05, y: -r * 0.15 }], true);
    else if (sym === 'sun') { star(10, r, r * 0.6, 0); sg.fillStyle(col, 1); sg.fillCircle(0, 0, r * 0.6); }
    else if (sym === 'flower') { for (var k = 0; k < 5; k++) { var a = k / 5 * Math.PI * 2; sg.fillCircle(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.42); } sg.fillStyle(0xffd23c, 1); sg.fillCircle(0, 0, r * 0.35); }
    else if (sym === 'gem') sg.fillPoints([{ x: -r, y: -r * 0.3 }, { x: -r * 0.5, y: -r * 0.8 }, { x: r * 0.5, y: -r * 0.8 }, { x: r, y: -r * 0.3 }, { x: 0, y: r }], true);
    else if (sym === 'arrow') sg.fillPoints([{ x: 0, y: -r }, { x: r * 0.8, y: -r * 0.1 }, { x: r * 0.3, y: -r * 0.1 }, { x: r * 0.3, y: r }, { x: -r * 0.3, y: r }, { x: -r * 0.3, y: -r * 0.1 }, { x: -r * 0.8, y: -r * 0.1 }], true);
    else if (sym === 'paw') { sg.fillCircle(0, r * 0.3, r * 0.5); [-0.6, -0.2, 0.2, 0.6].forEach(function (f, i) { sg.fillCircle(f * r * 1.1, -r * (i % 3 === 0 ? 0.35 : 0.7), r * 0.24); }); }
    c.add(sg);
    if (sym === 'letter') {
      var t = BK.ui.text(scene, 0, 0, em.letter || 'A', { outline: false, origin: [0.5, 0.5], px: Math.max(7, Math.round(s * 0.55)), bold: true, color: col });
      c.add(t);
    }
    // the mask moves with the container only if we move it too: emblems are drawn where they stay
    c.once('destroy', function () { c.list.forEach(function (o) { if (o.maskSource) o.maskSource.destroy(); }); });
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
  { id: 'castle', name: ['Berendezett vár', 'A furnished castle'], icon: 123, test: function (p) { return ((p.castle && p.castle.floor) || []).filter(Boolean).length >= 5; } },
  { id: 'arena', name: ['Aréna-bajnok', 'Arena champion'], icon: 202, test: function (p) { return Object.keys(p.arena || {}).some(function (k) { return p.arena[k].h; }); } },
  { id: 'halloween', name: ['Halloween éjszaka', 'Halloween Night'], icon: 40, test: function (p) { return !!(p.halloween && p.halloween.stars && p.halloween.stars[3]); } },
  { id: 'crowns', name: ['Korona', 'A crown'], icon: 197, test: function (p) { return Object.keys(p.crowns || {}).length > 0; } },
];

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
    var tabs = [BK.L('Jelvény', 'Sign'), BK.L('Háttér', 'Background'), BK.L('Kitűzők', 'Badges'), BK.L('Számok', 'Numbers')];
    tabs.forEach(function (t, i) {
      var x = 72 + i * 80;
      BK.ui.button(s, x, 50, t, function () { if (s.tab !== i) { s.tab = i; BK.audio.sfx('ui'); s.scene.restart({ tab: i }); } }, { w: 76, h: 16 });
      if (i === s.tab) s.add.rectangle(x, 50, 80, 20).setStrokeStyle(1, 0x9a3d1a);
    });
    this.page = [];
    this.drawTab();
    BK.ui.button(this, 192, 196, BK.T.back, function () { BK.save.persist(); s.scene.start('Map'); }, { w: 80, h: 18, key: 'ESC' });
  }
  keep(o) { this.page.push(o); return o; }
  drawTab() {
    this.page.forEach(function (o) { o.destroy(); });
    this.page = [];
    [this.drawSign, this.drawBackground, this.drawBadges, this.drawNumbers][this.tab].call(this);
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
    BK.BADGES.forEach(function (b, i) {
      var x = 44 + (i % 4) * 82, y = 70 + Math.floor(i / 4) * 19, ok = b.test(P);
      if (ok) got++;
      s.keep(BK.ui.nine(s, x - 9, y - 9, 18, 18, ok ? 'ui_slot_sel' : 'ui_slot_off'));
      var im = s.keep(s.add.image(x, y, 'icons_food', b.icon).setScale(0.8));
      if (!ok) im.setTint(0x302828).setAlpha(0.5);
      s.keep(BK.ui.text(s, x + 12, y, BK.L(b.name[0], b.name[1]), { outline: false, origin: [0, 0.5], px: 8, color: ok ? 0x4a2c1c : 0x9a8a80, fit: 66 }));
    });
    this.keep(BK.ui.text(this, 192, 168, got + ' / ' + BK.BADGES.length + BK.L(' kitűző', ' badges'), { outline: false, origin: [0.5, 0.5], px: 9, color: 0x6b3a20 }));
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
