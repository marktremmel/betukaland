/*
 * Overlay scenes opened on top of the map or a level:
 * Shop (outfits, pets and switching figures, which is free), Bag (collected treasures), Settings.
 * Each is started with { from, onClose } and calls onClose when it closes.
 */
BK.OverlayBase = class extends Phaser.Scene {
  init(data) { this.data0 = data || {}; this.P = BK.state.profile; }
  frame(title, w, h) {
    var s = this;
    this.add.rectangle(0, 0, BK.W, BK.H, 0x000000, 0.5).setOrigin(0, 0).setInteractive();
    var x = (BK.W - w) / 2, y = (BK.H - h) / 2;
    BK.ui.nine(this, x, y, w, h, 'ui_panel2');
    BK.ui.text(this, BK.W / 2, y + 30, title, { outline: false, size: 2, origin: [0.5, 0.5] });
    BK.ui.button(this, BK.W / 2, y + h - 16, BK.T.back + ' (Esc)', function () { s.close(); }, { w: 80, h: 18, key: 'ESC' });
    this.box = { x: x, y: y, w: w, h: h };
    this.dyn = [];
  }
  keepD(o) { this.dyn.push(o); if (o.zone) this.dyn.push(o.zone); return o; }
  clearD() { this.dyn.forEach(function (o) { o.destroy(); }); this.dyn = []; }
  close() {
    BK.save.persist();
    var from = this.data0.from, cb = this.data0.onClose;
    this.scene.stop();
    if (from) this.scene.resume(from);
    if (cb) cb();
  }
};

BK.ShopScene = class extends BK.OverlayBase {
  constructor() { super('Shop'); }
  create() {
    this.tab = 0;
    this.frame(BK.T.shop, 340, 196);
    var s = this, b = this.box;
    this.karou = this.add.sprite(b.x + 34, b.y + b.h - 6, 'karou_sit').setOrigin(0.5, 1).play('karou_sit');
    // tabs, evenly spread; switching figures only from the map (in a level the hero is already on the road)
    var tabs = [[0, BK.T.outfits], [1, BK.T.pets], [2, BK.T.figures], [3, BK.T.magic], [4, BK.L('Billentyűzet', 'Keyboard')]].filter(function (t) { return t[0] !== 2 || s.data0.from !== 'Level'; });
    this.tabX = {};
    var TS = tabs.length > 4 ? 63 : 76;
    tabs.forEach(function (t, i) {
      var x = b.x + b.w / 2 + (i - (tabs.length - 1) / 2) * TS;
      s.tabX[t[0]] = x;
      BK.ui.button(s, x, b.y + 46, t[1], function () { s.tab = t[0]; s.fxSel = null; s.figSel = undefined; s.kbSel = undefined; s.draw(); }, { w: TS - 4, h: 16 });
    });
    this.coinIcon = this.add.sprite(b.x + b.w - 44, b.y + 30, 'coin').play('coin');
    this.coinText = BK.ui.text(this, b.x + b.w - 34, b.y + 24, '', { outline: false, color: 0x9a3d1a });
    BK.audio.sfx('v_hiya', { volume: 0.5 });
    this.draw();
  }
  draw() {
    var s = this, P = this.P, b = this.box;
    this.clearD();
    this.coinText.setText(String(P.coins));
    // which tab is open
    this.keepD(this.add.rectangle(this.tabX[this.tab], b.y + 46, Object.keys(this.tabX).length > 4 ? 62 : 74, 20).setStrokeStyle(1, 0x9a3d1a));
    this.karou.setVisible(this.tab < 2);
    if (this.tab === 2) { this.drawFigures(); return; }
    if (this.tab === 3) { this.drawMagic(); return; }
    if (this.tab === 4) { this.drawKeyboards(); return; }
    // reward pets (Halloween) are not for sale; they show once the child has one
    var list = this.tab === 0 ? BK.OUTFITS : BK.PETS.filter(function (p) { return !p.reward || P.pets.indexOf(p.id) >= 0; });
    list.forEach(function (it, i) {
      var col = i % 3, row = Math.floor(i / 3);
      var x = b.x + (b.w - 270) / 2 + col * 92, y = b.y + 58 + row * 56;
      s.keepD(BK.ui.nine(s, x, y, 86, 54, 'ui_slot'));
      var hero = BK.heroOf(P);
      var key = s.tab === 0 ? (it.id === 'base' ? hero.idle : hero.idle + '_' + it.id) : it.sprite;
      if (!s.textures.exists(key)) key = s.tab === 0 ? hero.idle : key;      // a figure without outfit colours
      var spr = s.keepD(s.add.sprite(x + 20, y + 51, key).setOrigin(0.5, 1).play(key));
      if (spr.height > 36) spr.setScale(spr.height > 60 ? 0.5 : 36 / spr.height);
      if (s.tab === 1) spr.setFlipX(BK.FACES_LEFT[key.split('_')[0]] === true);
      s.keepD(BK.ui.text(s, x + 43, y + 4, it.name, { outline: false, origin: [0.5, 0] }));
      var owned = s.tab === 0 ? P.outfits.indexOf(it.id) >= 0 : P.pets.indexOf(it.id) >= 0;
      var wearing = s.tab === 0 ? P.outfit === it.id : P.pet === it.id;
      if (!owned) s.keepD(BK.ui.text(s, x + 58, y + 20, it.price + ' ' + BK.L('érme', 'coins'), { outline: false, origin: [0.5, 0], color: 0x9a3d1a }));
      var label = wearing ? (s.tab === 1 ? BK.L('Hazaküld', 'Send home') : BK.T.wearing) : (owned ? BK.T.wear : BK.T.buy);
      var btn = s.keepD(BK.ui.button(s, x + 58, y + 42, label, function () { s.act(it, owned, wearing); }, { w: 56, h: 16, disabled: wearing && s.tab === 0 }));
    });
  }
  // Magic: the shape, the colour and the impact of the shot at each correct key, on three
  // small pages. A click shows it (a test shot); the button buys it or puts it in use. In the
  // basic and pastel sets the child then picks one colour from the row of swatches.
  drawMagic() {
    var s = this, P = this.P, b = this.box, fx = P.fx;
    var LISTS = { shape: BK.SHOT_SHAPES, colour: BK.SHOT_COLOURS, impact: BK.SHOT_IMPACTS, glow: BK.SHOT_GLOWS };
    var KEY = { shape: 'shape', colour: 'colour', impact: 'impact', glow: 'glow' };
    var page = this.magicPage || 'shape';
    var sel = this.fxSel && this.fxSel.kind === page ? this.fxSel : { kind: page, id: fx[KEY[page]] || LISTS[page][0].id, tone: fx.tone };
    var item = LISTS[page].find(function (o) { return o.id === sel.id; }) || LISTS[page][0];
    // the three pages
    [['shape', BK.T.shape], ['colour', BK.T.colours], ['impact', BK.L('Becsapódás', 'Impact')], ['glow', BK.L('Fény', 'Light')]].forEach(function (pg, i) {
      var x = b.x + b.w / 2 + (i - 1.5) * 76;
      s.keepD(BK.ui.button(s, x, b.y + 64, pg[1], function () { s.magicPage = pg[0]; s.fxSel = null; BK.audio.sfx('ui'); s.draw(); }, { w: 70, h: 14 }));
      if (pg[0] === page) s.keepD(s.add.rectangle(x, b.y + 64, 74, 18).setStrokeStyle(1, 0x9a3d1a));
    });
    var list = LISTS[page], w = page === 'colour' ? 42 : 40, step = page === 'colour' ? 45 : (page === 'shape' ? 44 : 50), h = 40, y = b.y + 98;
    var x0 = b.x + b.w / 2 - (list.length - 1) * step / 2;
    list.forEach(function (o, i) {
      var x = x0 + i * step, owned = fx.owned.indexOf(o.id) >= 0, inUse = fx[KEY[page]] === o.id;
      s.keepD(BK.ui.nine(s, x - w / 2, y - h / 2, w, h, inUse ? 'ui_slot_sel' : 'ui_slot'));
      if (page === 'shape') s.shotIcon(x, y - 8, o.id, fx.colour, fx.tone);
      else if (page === 'colour') s.colourIcon(x, y - 9, o);
      else if (page === 'impact') s.impactIcon(x, y - 8, o.id);
      else s.glowIcon(x, y - 8, o.id);
      s.keepD(BK.ui.text(s, x, y + 3, o.name, { outline: false, origin: [0.5, 0.5], px: 8, color: 0x4a2c1c, fit: w - 4 }));
      if (!owned) s.keepD(BK.ui.text(s, x, y + 11, o.price + (o.rare ? ' +' + o.rare + '◆' : ''), { outline: false, origin: [0.5, 0.5], px: 8, bold: true, color: 0x9a3d1a }));
      if (sel.id === o.id) s.keepD(s.add.rectangle(x, y, w + 4, h + 4).setStrokeStyle(2, 0xffffff));
      var z = s.keepD(s.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () {
        s.fxSel = { kind: page, id: o.id, tone: page === 'colour' && fx.colour === o.id ? fx.tone : 0 };
        BK.audio.sfx('ui');
        s.draw();
        s.demo();
      });
    });
    // the single colours of a basic or pastel set
    if (page === 'colour' && item.pick) {
      item.cols.forEach(function (c, i) {
        var x = b.x + b.w / 2 + (i - (item.cols.length - 1) / 2) * 18, yy = b.y + 129, on = (sel.tone || 0) === i;
        s.keepD(s.add.rectangle(x, yy, 12, 9, c).setStrokeStyle(on ? 2 : 1, on ? 0xffffff : 0x4a2c1c));
        var z = s.keepD(s.add.zone(x, yy, 16, 12).setInteractive({ useHandCursor: true }));
        z.on('pointerup', function () { s.fxSel = { kind: 'colour', id: item.id, tone: i }; BK.audio.sfx('ui'); s.draw(); s.demo(); });
      });
    }
    // the light needs something to shine on: a little word bubble, half typed
    this.enc = null;
    if (page === 'glow') {
      var wb = new BK.WordBubble(this, BK.L('varázslat', 'magic'), b.x + b.w / 2, b.y + 147, { px: 11 });
      for (var q = 0; q < 4; q++) wb.type(wb.next);
      this.keepD(wb);
      this.enc = { bubble: wb };
    }
    // what the child uses now, all of it
    var nm = function (l, id) { var o = l.find(function (q) { return q.id === id; }); return o ? o.name : ''; };
    if (page !== 'glow') this.keepD(BK.ui.text(this, b.x + b.w / 2, b.y + 143, BK.T.figureNow + ' ' + nm(BK.SHOT_SHAPES, fx.shape) + ' · ' + nm(BK.SHOT_COLOURS, fx.colour) + ' · ' + nm(BK.SHOT_IMPACTS, fx.impact || 'spark') + ' · ' + BK.L('fény: ', 'light: ') + nm(BK.SHOT_GLOWS, fx.glow || 'g_none'),
      { outline: false, origin: [0.5, 0.5], px: 9, color: 0x6b3a20, fit: 300 }));
    // what is selected, and the button for it
    var owned = fx.owned.indexOf(item.id) >= 0;
    var inUse = fx[KEY[page]] === item.id && (page !== 'colour' || !item.pick || (fx.tone || 0) === (sel.tone || 0));
    this.keepD(BK.ui.text(this, b.x + 20, b.y + 160, item.name + (owned ? '' : '  ·  ' + item.price + ' ' + BK.L('érme', 'coins') +
      (item.rare ? ' + ' + item.rare + ' ' + BK.L('ritka kincs', 'rare treasure') : '')), { outline: false, origin: [0, 0.5], color: 0x4a2c1c, bold: true, fit: 190 }));
    var label = inUse ? BK.T.using : owned ? BK.T.use : BK.T.buy;
    this.keepD(BK.ui.button(this, b.x + b.w - 62, b.y + 160, label, function () { s.buyMagic(sel, item); }, { w: 84, h: 16, disabled: inUse }));
  }
  // Keyboard: looks for the on-screen keyboard, and effects that can be switched on and off
  drawKeyboards() {
    var s = this, P = this.P, b = this.box, fx = P.fx;
    fx.kb = fx.kb || 'kb_classic'; fx.kbOn = fx.kbOn || [];
    var sel = this.kbSel || fx.kb;
    var item = BK.KB_THEMES.find(function (o) { return o.id === sel; }) || BK.KB_EFFECTS.find(function (o) { return o.id === sel; });
    this.keepD(BK.ui.text(this, b.x + 18, b.y + 60, BK.L('Kinézet', 'Look'), { outline: false, px: 9, color: 0x6b3a20 }));
    BK.KB_THEMES.forEach(function (o, i) {
      var x = b.x + 26 + i * 36, y = b.y + 86, owned = fx.owned.indexOf(o.id) >= 0, use = fx.kb === o.id;
      s.keepD(BK.ui.nine(s, x - 17, y - 18, 34, 38, use ? 'ui_slot_sel' : 'ui_slot'));
      s.kbIcon(x, y - 6, o);
      s.keepD(BK.ui.text(s, x, y + 6, o.name, { outline: false, origin: [0.5, 0.5], px: 7, color: 0x4a2c1c, fit: 32 }));
      if (!owned) s.keepD(BK.ui.text(s, x, y + 13, o.price + (o.rare ? '+' + o.rare + '◆' : ''), { outline: false, origin: [0.5, 0.5], px: 7, bold: true, color: 0x9a3d1a }));
      if (sel === o.id) s.keepD(s.add.rectangle(x, y, 38, 42).setStrokeStyle(2, 0xffffff));
      var z = s.keepD(s.add.zone(x, y, 34, 38).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () { s.kbSel = o.id; BK.audio.sfx('ui'); s.draw(); });
    });
    this.keepD(BK.ui.text(this, b.x + 18, b.y + 110, BK.L('Hatások (be és ki is kapcsolhatók)', 'Effects (switch them on and off)'), { outline: false, px: 9, color: 0x6b3a20 }));
    BK.KB_EFFECTS.forEach(function (o, i) {
      var x = b.x + 60 + i * 110, y = b.y + 132, owned = fx.owned.indexOf(o.id) >= 0, on = fx.kbOn.indexOf(o.id) >= 0;
      s.keepD(BK.ui.nine(s, x - 50, y - 11, 100, 22, sel === o.id ? 'ui_slot_sel' : 'ui_slot'));
      s.keepD(BK.ui.text(s, x - 44, y, o.name, { outline: false, origin: [0, 0.5], px: 9, bold: true, color: 0x4a2c1c }));
      s.keepD(BK.ui.text(s, x + 44, y, owned ? (on ? BK.T.on : BK.T.off) : o.price + '', { outline: false, origin: [1, 0.5], px: 9, bold: true, color: owned ? (on ? 0x2e7d3e : 0x8a3a2a) : 0x9a3d1a }));
      var z = s.keepD(s.add.zone(x, y, 100, 22).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () {
        s.kbSel = o.id;
        if (owned) { var k = fx.kbOn.indexOf(o.id); if (k >= 0) fx.kbOn.splice(k, 1); else fx.kbOn.push(o.id); BK.save.persist(); BK.audio.sfx('ui'); }
        s.draw();
      });
    });
    var owned = fx.owned.indexOf(item.id) >= 0, isTheme = item.id.indexOf('kb_') === 0;
    var inUse = isTheme ? fx.kb === item.id : fx.kbOn.indexOf(item.id) >= 0;
    this.keepD(BK.ui.text(this, b.x + 20, b.y + 160, item.name + (owned ? '' : '  ·  ' + item.price + ' ' + BK.L('érme', 'coins') + (item.rare ? ' + ' + item.rare + ' ' + BK.L('ritka kincs', 'rare treasure') : '')),
      { outline: false, origin: [0, 0.5], color: 0x4a2c1c, bold: true, fit: 190 }));
    if (!owned || isTheme) this.keepD(BK.ui.button(this, b.x + b.w - 62, b.y + 160, inUse ? BK.T.using : owned ? BK.T.use : BK.T.buy, function () {
      if (!owned) {
        if (P.coins < item.price) { BK.ui.toast(s, BK.W / 2, b.y + b.h - 34, BK.T.notEnough, 0xff9a7a); BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
        if (item.rare && !BK.payRares(P, item.rare)) { BK.ui.toast(s, BK.W / 2, b.y + b.h - 34, BK.L('Ehhez ritka kincs is kell: főzz a Konyhában!', 'This needs rare treasures too: cook in the Kitchen!'), 0xd8a0ff); return; }
        P.coins -= item.price; fx.owned.push(item.id); BK.audio.sfx('buy');
      }
      if (isTheme) fx.kb = item.id; else if (fx.kbOn.indexOf(item.id) < 0) fx.kbOn.push(item.id);
      BK.save.persist(); s.coinText.setText(String(P.coins)); s.draw();
    }, { w: 84, h: 16, disabled: inUse }));
  }
  // a little 3 x 2 keyboard in the look
  kbIcon(x, y, th) {
    var g = this.keepD(this.add.graphics()), FC = BK.FINGER_COLOURS, C = Phaser.Display.Color;
    for (var i = 0; i < 6; i++) {
      var kx = x - 13 + (i % 3) * 9, ky = y - 8 + Math.floor(i / 3) * 8, f = [0, 3, 5, 1, 4, 7][i], fc = FC[f], col = fc;
      if (th.id === 'kb_pastel') { var c = C.IntegerToColor(fc); col = C.GetColor((c.r + 306) / 2.2, (c.g + 306) / 2.2, (c.b + 306) / 2.2); }
      if (th.wave) col = th.wave === 'rainbow' ? C.HSVToRGB(i / 6, 0.55, 1).color : th.wave[i % th.wave.length];
      g.fillStyle(0x1c1210, 1).fillRect(kx, ky, 8, 7);
      if (th.neon) { g.fillStyle(0x221830, 1).fillRect(kx + 1, ky + 1, 6, 5); g.lineStyle(1, fc, 1).strokeRect(kx + 1.5, ky + 1.5, 5, 4); }
      else {
        g.fillStyle(col, 1).fillRect(kx + 1, ky + 1, 6, 5);
        if (th.id === 'kb_gradient') g.fillStyle(0xffffff, 0.35).fillRect(kx + 1, ky + 1, 6, 2);
        if (th.wave) g.fillStyle(fc, 1).fillRect(kx + 1, ky + 5, 6, 1);
      }
    }
  }
  // a tiny word bubble showing the light
  glowIcon(x, y, id) {
    var fx = this.P.fx, set = BK.fx.colourSet(fx.colour), c = BK.fx.shotColour(set, fx.tone, 2), g = this.keepD(this.add.graphics());
    g.fillStyle(0x5a3426, 1).fillRoundedRect(x - 12, y - 6, 24, 12, 3);
    g.fillStyle(0xfffaeb, 1).fillRoundedRect(x - 11, y - 5, 22, 10, 2);
    if (id === 'g_rim') g.lineStyle(1.5, c, 1).strokeRoundedRect(x - 13, y - 7, 26, 14, 3);
    else if (id === 'g_neon') { g.lineStyle(3, c, 0.35).strokeRoundedRect(x - 14, y - 8, 28, 16, 4); g.lineStyle(1, c, 1).strokeRoundedRect(x - 13, y - 7, 26, 14, 3); }
    else if (id === 'g_shine') { g.fillStyle(0xffffff, 0.9).fillRect(x - 1, y - 5, 3, 10); }
    else if (id === 'g_pulse') { g.fillStyle(c, 0.3).fillRoundedRect(x - 11, y - 5, 22, 10, 2); }
    else if (id === 'g_rainbow') { for (var i = 0; i < 6; i++) { g.lineStyle(1.5, Phaser.Display.Color.HSVToRGB(i / 6, 0.75, 1).color, 1); g.lineBetween(x - 13 + i * 4.4, y - 7, x - 13 + (i + 1) * 4.4, y - 7); g.lineBetween(x - 13 + i * 4.4, y + 7, x - 13 + (i + 1) * 4.4, y + 7); } }
    this.keepD(BK.ui.text(this, x, y, 'abc', { outline: false, origin: [0.5, 0.5], px: 7, color: id === 'g_none' ? 0x4a2c1c : 0x2e9e52 }));
  }
  // a tiny picture of an impact, in the colour the child uses now
  impactIcon(x, y, id) {
    BK.fx.shotTextures(this);
    var fx = this.P.fx, set = BK.fx.colourSet(fx.colour), s = this;
    var c = function (k) { return BK.fx.shotColour(set, fx.tone, 2 + k); };
    if (id === 'pop') { this.keepD(this.add.image(x, y, 'shot_ring').setTint(c(0))); for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; this.keepD(this.add.image(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 'shot_dot').setTint(c(i)).setScale(0.6)); } }
    else if (id === 'splat') { [[0, 0, 1.2], [6, -3, 0.5], [-6, 2, 0.4], [3, 5, 0.35], [-4, -5, 0.3]].forEach(function (d) { s.keepD(s.add.image(x + d[0], y + d[1], 'shot_ball').setTint(c(0)).setScale(d[2])); }); }
    else if (id === 'pixel') { [[-5, -3, 2], [4, -5, 2], [6, 2, 1], [-3, 4, 1], [0, -1, 2], [-7, 1, 1]].forEach(function (d, k) { s.keepD(s.add.rectangle(x + d[0], y + d[1], d[2] * 2, d[2] * 2, c(k))); }); }
    else if (id === 'stars') { for (var m = 0; m < 5; m++) { var a2 = -Math.PI / 2 + (m - 2) * 0.55; this.keepD(this.add.image(x + Math.cos(a2) * 7, y + 2 + Math.sin(a2) * 7, 'shot_star').setTint(c(m)).setScale(0.6)); } }
    else if (id === 'comic') { this.keepD(BK.ui.text(this, x, y, BK.L('BUMM!', 'POW!'), { origin: [0.5, 0.5], px: 9, bold: true, color: c(0) }).setAngle(-10)); }
    else { this.keepD(this.add.sprite(x, y, 'fx_impact', 2)); }
  }
  // a shape, drawn in the colour the child uses now
  shotIcon(x, y, shape, colour, tone) {
    BK.fx.shotTextures(this);
    var set = BK.fx.colourSet(colour), c = BK.fx.shotColour(set, tone, 2), s = this;
    var add = function (o) { return s.keepD(o); };
    if (set.rtx || set.neon) this.keepD(this.add.image(x, y, 'shot_glow').setTint(c).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setScale(1.4));
    if (shape === 'bolt' || shape === 'wave') {
      var g = this.add.graphics();
      g.lineStyle(shape === 'bolt' ? 2 : 1.5, c, 1).beginPath();
      if (shape === 'bolt') { g.moveTo(x - 6, y - 5); g.lineTo(x, y - 1); g.lineTo(x - 2, y + 1); g.lineTo(x + 6, y + 5); }
      else for (var i = 0; i <= 12; i++) { var px = x - 7 + i * 14 / 12, py = y + Math.sin(i / 12 * Math.PI * 2) * 3; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.strokePath();
      return add(g);
    }
    if (shape === 'code') {
      return add(this.add.text(x, y, '01', { fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#' + c.toString(16).padStart(6, '0') })
        .setOrigin(0.5).setResolution(BK.RES || 1));
    }
    if (shape === 'comet') {
      for (var t = 0; t < 4; t++) add(this.add.image(x - 2 - t * 3, y + 1 + t, 'shot_dot').setTint(BK.fx.shotColour(set, tone, 3 + t)).setAlpha(1 - t * 0.2).setScale(1 - t * 0.15));
      return add(this.add.image(x + 3, y - 1, 'shot_ball').setTint(c));
    }
    var key = { star: 'shot_star', sparkle: 'shot_sparkle', grav: 'shot_ring' }[shape];
    return add(this.add.image(x, y, key).setTint(c).setScale(1.3));
  }
  colourIcon(x, y, o) {
    var cols = o.rainbow ? [0xff5a5a, 0xffb43c, 0xfff05a, 0x5ad17a, 0x5aa0ff, 0xb87aff] : o.rtx || o.neon ? o.cols :
      o.chrome ? [0x8a94a0, 0xe8eef4, 0xb0bac4, 0xffffff] : o.cols;
    if (o.pick) cols = cols.filter(function (c, i) { return i % 2 === 0; });
    var w = Math.min(8, 36 / cols.length);
    for (var i = 0; i < cols.length; i++) this.keepD(this.add.rectangle(x + (i - (cols.length - 1) / 2) * w, y, w - 1, 7, cols[i]));
  }
  // a test shot over the panel with the selected shape and colour
  demo() {
    var sel = this.fxSel, fx = this.P.fx, b = this.box, s = this;
    if (!sel) return;
    var test = { shape: sel.kind === 'shape' ? sel.id : fx.shape, colour: sel.kind === 'colour' ? sel.id : fx.colour,
      tone: sel.kind === 'colour' ? sel.tone || 0 : fx.tone, impact: sel.kind === 'impact' ? sel.id : fx.impact,
      glow: sel.kind === 'glow' ? sel.id : fx.glow };
    for (var i = 0; i < 3; i++) (function (i) {
      s.time.delayedCall(i * 170, function () {
        if (s.magicPage === 'glow') BK.fx.bolt(s, b.x + 40, b.y + 136, b.x + b.w / 2 - 20, b.y + 136 + (i - 1) * 2, test);
        else BK.fx.bolt(s, b.x + 40, b.y + 123, b.x + b.w - 40, b.y + 121 + (i - 1) * 3, test);
      });
    })(i);
  }
  buyMagic(sel, item) {
    var P = this.P, fx = P.fx;
    if (fx.owned.indexOf(item.id) < 0) {
      if (P.coins < item.price) { BK.ui.toast(this, BK.W / 2, this.box.y + this.box.h - 34, BK.T.notEnough, 0xff9a7a); BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
      // the best magic also costs rare treasures (from the kitchen: three dishes for one)
      if (item.rare && BK.rareCount(P) < item.rare) {
        BK.ui.toast(this, BK.W / 2, this.box.y + this.box.h - 34, BK.L('Ehhez ritka kincs is kell: főzz a Konyhában!', 'This needs rare treasures too: cook in the Kitchen!'), 0xd8a0ff);
        BK.audio.sfx('key_bad', { volume: 0.3 }); return;
      }
      if (item.rare) BK.payRares(P, item.rare);
      P.coins -= item.price;
      fx.owned.push(item.id);
      BK.audio.sfx('buy');
      BK.audio.sfx('v_great', { volume: 0.5 });
    }
    if (sel.kind === 'shape') fx.shape = item.id;
    else if (sel.kind === 'impact') fx.impact = item.id;
    else if (sel.kind === 'glow') fx.glow = item.id;
    else { fx.colour = item.id; fx.tone = item.pick ? sel.tone || 0 : 0; }
    this.fxSel = sel;
    BK.save.persist();
    this.draw();
    this.demo();
  }

  // Figures: switching to one you have is free (one click). One you don't have yet is only
  // selected by a click; it is bought with the button below, so nothing is bought by accident.
  // The Halloween figures open after Halloween Night: one is a gift, the others cost coins.
  drawFigures() {
    var s = this, P = this.P, b = this.box;
    var sel = this.figSel !== undefined ? this.figSel : (P.avatar || 0);
    BK.HEROES.forEach(function (h, i) {
      var x = b.x + (b.w - 324) / 2 + 27 + (i % 6) * 54, y = b.y + 72 + Math.floor(i / 6) * 31;
      var cur = i === (P.avatar || 0), owned = BK.heroOwned(P, h), open = BK.heroUnlocked(P, h);
      s.keepD(BK.ui.nine(s, x - 25, y - 15, 50, 30, cur ? 'ui_slot_sel' : open ? 'ui_slot' : 'ui_slot_off'));
      var spr = s.keepD(BK.avatarSprite(s, x, y + 14, i, P));
      spr.setScale(h.id === 'crab' ? 1.4 : Math.min(1, 26 / spr.height));
      if (!open) spr.setTint(0x302838).setAlpha(0.7);
      if (!owned) {
        // a small price tag (or a lock) in the corner
        if (open) {
          s.keepD(s.add.rectangle(x + 14, y - 9, 20, 9, 0xffe9a0, 0.95).setStrokeStyle(1, 0x5a3426));
          s.keepD(BK.ui.text(s, x + 14, y - 9, String(h.price), { outline: false, origin: [0.5, 0.5], px: 7, bold: true, color: 0x9a3d1a }));
        } else {
          var lk = s.keepD(s.add.graphics());           // a little padlock
          lk.lineStyle(1.5, 0x6a2a8a, 1).strokeCircle(x + 16, y - 9, 2.5);
          lk.fillStyle(0x6a2a8a, 1).fillRect(x + 12.5, y - 8, 7, 5);
        }
      }
      if (i === sel) s.keepD(s.add.rectangle(x, y, 54, 34).setStrokeStyle(2, 0xffffff));
      var z = s.keepD(s.add.zone(x, y, 50, 30).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () {
        if (owned) {
          s.figSel = undefined;
          if (P.avatar !== i) { P.avatar = i; BK.audio.sfx('ui'); BK.save.persist(); }
        } else { s.figSel = i; BK.audio.sfx('ui'); }
        s.draw();
      });
    });
    var h = BK.HEROES[sel], owned = BK.heroOwned(P, h), open = BK.heroUnlocked(P, h);
    var y2 = b.y + 160;
    if (owned) {
      this.keepD(BK.ui.text(this, b.x + 20, y2, BK.T.figureNow + ' ' + BK.heroOf(P).name, { outline: false, origin: [0, 0.5], color: 0x4a2c1c, bold: true, fit: 180 }));
      this.keepD(BK.ui.text(this, b.x + b.w - 20, y2, BK.L('Kattints egy figurára a váltáshoz', 'Click a figure to switch'), { outline: false, origin: [1, 0.5], px: 9, color: 0x9a8a80, fit: 140 }));
    } else if (!open) {
      this.keepD(BK.ui.text(this, b.x + 20, y2, h.name + ': ' + BK.L('teljesítsd a Halloween éjszakát!', 'finish Halloween Night first!'), { outline: false, origin: [0, 0.5], color: 0x6a2a8a, bold: true, fit: 300 }));
    } else {
      this.keepD(BK.ui.text(this, b.x + 20, y2, h.name + '  ·  ' + h.price + ' ' + BK.L('érme', 'coins'), { outline: false, origin: [0, 0.5], color: 0x4a2c1c, bold: true, fit: 160 }));
      this.keepD(BK.ui.button(this, b.x + b.w - 62, y2, BK.T.buy, function () {
        if (P.coins < h.price) { BK.ui.toast(s, BK.W / 2, b.y + b.h - 40, BK.T.notEnough, 0xff9a7a); BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
        P.coins -= h.price;
        P.figures = P.figures || [];
        P.figures.push(h.id);
        P.avatar = sel;
        s.figSel = undefined;
        BK.audio.sfx('buy');
        BK.audio.sfx('v_great', { volume: 0.5 });
        BK.save.persist();
        s.draw();
      }, { w: 84, h: 16 }));
    }
  }
  act(it, owned, wearing) {
    var P = this.P;
    if (wearing) {
      if (this.tab === 1) { P.pet = null; BK.save.persist(); this.draw(); }   // click again to send the pet home
      return;
    }
    if (!owned) {
      if (P.coins < it.price) { BK.ui.toast(this, BK.W / 2, this.box.y + this.box.h - 34, BK.T.notEnough, 0xff9a7a); BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
      P.coins -= it.price;
      if (this.tab === 0) P.outfits.push(it.id); else P.pets.push(it.id);
      BK.audio.sfx('buy');
      BK.audio.sfx('v_great', { volume: 0.5 });
    }
    if (this.tab === 0) P.outfit = it.id; else P.pet = it.id;
    BK.save.persist();
    this.draw();
  }
};

BK.BagScene = class extends BK.OverlayBase {
  constructor() { super('Bag'); }
  create() {
    var s = this, P = this.P;
    P.dishes = P.dishes || {}; P.rares = P.rares || {};
    this.tab = (this.data0 && this.data0.tab) || 0;
    this.frame(BK.T.bag, 320, 196);
    var b = this.box;
    var tabs = [[0, BK.L('Kincsek', 'Treasures')], [1, BK.L('Konyha', 'Kitchen')], [2, BK.L('Polc', 'Shelf')]];
    this.tabX = {};
    tabs.forEach(function (t, i) {
      var x = b.x + b.w / 2 + (i - 1) * 84;
      s.tabX[t[0]] = x;
      BK.ui.button(s, x, b.y + 46, t[1], function () { s.tab = t[0]; s.draw(); }, { w: 78, h: 16 });
    });
    this.draw();
  }
  icon(x, y, frame, sheet, have) {
    var im = this.keepD(this.add.image(x, y, sheet || 'icons_food', frame));
    if (!have) im.setTint(0x302828).setAlpha(0.55);
    return im;
  }
  draw() {
    var s = this, P = this.P, b = this.box;
    this.clearD();
    this.keepD(this.add.rectangle(this.tabX[this.tab], b.y + 46, 82, 20).setStrokeStyle(1, 0x9a3d1a));
    if (this.tab === 0) this.drawItems();
    else if (this.tab === 1) this.drawKitchen();
    else this.drawShelf();
  }
  drawItems() {
    var s = this, P = this.P, b = this.box;
    var have = BK.ITEMS.filter(function (it) { return P.items[it.id]; });
    BK.ITEMS.forEach(function (it, i) {
      var col = i % 8, row = Math.floor(i / 8);
      var x = b.x + (b.w - 272) / 2 + 17 + col * 34, y = b.y + 76 + row * 32;
      var n = P.items[it.id] || 0;
      s.keepD(BK.ui.nine(s, x - 14, y - 14, 28, 28, n ? 'ui_slot_sel' : 'ui_slot_off'));
      s.icon(x, y, it.frame, 'icons_food', n);
      if (n) s.keepD(BK.ui.text(s, x + 12, y + 4, 'x' + n, { origin: [1, 0], color: 0xffffff }));
    });
    this.keepD(BK.ui.text(this, BK.W / 2, b.y + 164, have.length + ' / ' + BK.ITEMS.length + ' ' + BK.L('kincs  ·  a Konyhában ételt főzhetsz belőlük', 'treasures  ·  cook with them in the Kitchen'),
      { outline: false, origin: [0.5, 0.5], px: 9, color: 0x6b3a20 }));
  }
  canCook(r) { var P = this.P; return r.needs.every(function (id) { return (P.items[id] || 0) > 0; }); }
  // Kitchen: the recipes, what each needs, and the cook button
  drawKitchen() {
    var s = this, P = this.P, b = this.box;
    if (this.recSel === undefined) { this.recSel = Math.max(0, BK.RECIPES.findIndex(function (r) { return s.canCook(r); })); }
    BK.RECIPES.forEach(function (r, i) {
      var y = b.y + 63 + i * 10, ok = s.canCook(r), sel = i === s.recSel;
      if (sel) s.keepD(s.add.rectangle(b.x + 104, y + 5, 184, 10, 0xf6c88a, 0.8));
      s.keepD(BK.ui.text(s, b.x + 16, y, r.name, { outline: false, bold: sel, px: 9, color: ok ? 0x4a2c1c : 0x9a8a80, fit: 96 }));
      r.needs.forEach(function (id, k) {
        var it = BK.ITEMS.find(function (q) { return q.id === id; });
        s.icon(b.x + 128 + k * 13, y + 5, it.frame, 'icons_food', (P.items[id] || 0) > 0).setScale(0.6);
      });
      if (P.dishes[r.id]) s.keepD(BK.ui.text(s, b.x + 192, y, 'x' + P.dishes[r.id], { outline: false, origin: [1, 0], px: 8, color: 0x6b8a50 }));
      var z = s.keepD(s.add.zone(b.x + 104, y + 5, 184, 11).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () { if (s.recSel === i) s.cook(); else { s.recSel = i; BK.audio.sfx('ui'); s.draw(); } });
    });
    // the chosen recipe
    var r = BK.RECIPES[this.recSel], cx = b.x + 252;
    this.keepD(BK.ui.nine(this, cx - 44, b.y + 60, 88, 96, 'ui_slot'));
    this.icon(cx, b.y + 84, r.frame, 'icons_food', true).setScale(2);
    this.keepD(BK.ui.text(this, cx, b.y + 104, r.name, { outline: false, origin: [0.5, 0], px: 10, bold: true, color: 0x4a2c1c, fit: 82 }));
    this.keepD(BK.ui.text(this, cx, b.y + 117, BK.L('Érték: ', 'Worth: ') + r.sell + BK.L(' érme', ' coins'), { outline: false, origin: [0.5, 0], px: 8, color: 0x9a3d1a }));
    var ok = this.canCook(r), inLevel = this.data0.from !== 'Map';
    this.keepD(BK.ui.button(this, cx, b.y + 140, BK.L('Főzés!', 'Cook!'), function () { s.cook(); }, { w: 70, h: 16, disabled: !ok || inLevel }));
    var note = inLevel ? BK.L('Főzni a térképről lehet.', 'You can cook from the map.') : ok ? BK.L('Gépeld be a receptet, és kész az étel!', 'Type the recipe and the dish is ready!') :
      BK.L('Hiányzik még: ', 'Still missing: ') + r.needs.filter(function (id) { return !(P.items[id] > 0); }).map(function (id) { return BK.ITEMS.find(function (q) { return q.id === id; }).name; }).join(', ');
    this.keepD(BK.ui.text(this, b.x + 16, b.y + 166, note, { outline: false, origin: [0, 0.5], px: 9, color: 0x6b3a20, fit: 290 }));
  }
  cook() {
    var r = BK.RECIPES[this.recSel];
    if (!this.canCook(r) || this.data0.from !== 'Map') { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
    var P = this.P, open = BK.REGIONS.filter(function (g) { return g.playable && BK.save.regionOpen(P, g.id); });
    BK.audio.sfx('chime');
    this.scene.stop('Map');
    this.scene.start('Level', { region: Math.max(3, open.length ? open[open.length - 1].id : 3), level: 'cook', recipeId: r.id });
  }
  // Shelf: the dishes (sell one to Karou, or trade three different ones for a rare treasure) and the rare treasures
  drawShelf() {
    var s = this, P = this.P, b = this.box;
    this.keepD(BK.ui.text(this, b.x + 16, b.y + 58, BK.L('Ételek', 'Dishes'), { outline: false, px: 9, color: 0x6b3a20 }));
    if (this.dishSel === undefined) this.dishSel = Math.max(0, BK.RECIPES.findIndex(function (r) { return P.dishes[r.id]; }));
    BK.RECIPES.forEach(function (r, i) {
      var x = b.x + 30 + i * 30, y = b.y + 84, n = P.dishes[r.id] || 0;
      s.keepD(BK.ui.nine(s, x - 13, y - 13, 26, 26, i === s.dishSel ? 'ui_slot_sel' : n ? 'ui_slot' : 'ui_slot_off'));
      s.icon(x, y, r.frame, 'icons_food', n);
      if (n) s.keepD(BK.ui.text(s, x + 11, y + 3, 'x' + n, { origin: [1, 0], px: 8, color: 0xffffff }));
      var z = s.keepD(s.add.zone(x, y, 26, 26).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () { s.dishSel = i; BK.audio.sfx('ui'); s.draw(); });
    });
    var d = BK.RECIPES[this.dishSel], have = P.dishes[d.id] || 0;
    this.keepD(BK.ui.text(this, b.x + 16, b.y + 110, d.name + (have ? '' : BK.L('  (még nincs ilyen)', '  (none yet)')), { outline: false, origin: [0, 0.5], px: 10, bold: true, color: 0x4a2c1c, fit: 130 }));
    this.keepD(BK.ui.button(this, b.x + 180, b.y + 110, BK.L('Eladom: ', 'Sell: ') + d.sell, function () {
      if (!(P.dishes[d.id] > 0)) return;
      P.dishes[d.id]--; P.coins += d.sell;
      BK.audio.sfx('coin'); BK.save.persist(); s.draw();
    }, { w: 72, h: 16, disabled: !have }));
    var total = BK.RECIPES.reduce(function (a, r) { return a + (P.dishes[r.id] || 0); }, 0);
    this.keepD(BK.ui.button(this, b.x + 262, b.y + 110, BK.L('2 étel = 1 ◆', '2 dishes = 1 ◆'), function () { s.trade(); }, { w: 76, h: 16, disabled: total < 2 }));
    this.keepD(BK.ui.text(this, b.x + 16, b.y + 126, BK.L('Ritka kincsek (bármelyik 2 étel = 1 ritka kincs)', 'Rare treasures (any 2 dishes = 1 rare treasure)'), { outline: false, px: 9, color: 0x6b3a20, fit: 290 }));
    BK.RARES.forEach(function (r, i) {
      var x = b.x + 34 + i * 46, y = b.y + 150, n = P.rares[r.id] || 0;
      s.keepD(BK.ui.nine(s, x - 13, y - 13, 26, 26, n ? 'ui_slot_sel' : 'ui_slot_off'));
      s.icon(x, y, r.frame, 'icons_gear', n);
      if (n) s.keepD(BK.ui.text(s, x + 11, y + 3, 'x' + n, { origin: [1, 0], px: 8, color: 0xffffff }));
    });
  }
  // any two dishes (the ones the child has most of) become one rare treasure
  trade() {
    var P = this.P, total = BK.RECIPES.reduce(function (a, r) { return a + (P.dishes[r.id] || 0); }, 0);
    if (total < 2) return;
    for (var k = 0; k < 2; k++) {
      var most = BK.RECIPES.slice().sort(function (a, c) { return (P.dishes[c.id] || 0) - (P.dishes[a.id] || 0); })[0];
      P.dishes[most.id]--;
    }
    // a rare treasure the child has fewest of
    var low = Math.min.apply(null, BK.RARES.map(function (r) { return P.rares[r.id] || 0; }));
    var pool = BK.RARES.filter(function (r) { return (P.rares[r.id] || 0) === low; });
    var got = pool[Math.floor(Math.random() * pool.length)];
    P.rares[got.id] = (P.rares[got.id] || 0) + 1;
    BK.audio.sfx('level_up', { volume: 0.5 });
    BK.ui.toast(this, BK.W / 2, this.box.y + 40, BK.L('Ritka kincs: ', 'Rare treasure: ') + got.name + '!', 0xd8a0ff, 1, 1400);
    BK.save.persist();
    this.draw();
  }
};

BK.SettingsScene = class extends BK.OverlayBase {
  constructor() { super('Settings'); }
  create() {
    this.frame(BK.T.settings, 356, 200);
    this.draw();
  }
  // Two columns: on/off switches on the left, choices (cycle through) on the right
  draw() {
    var s = this, P = this.P, b = this.box;
    this.clearD();
    var toggles = [
      ['keyboard', BK.T.keyboardHints], ['fingers', BK.T.fingerColours], ['music', BK.T.music],
      ['sfx', BK.T.sound], ['speedRun', BK.T.speedRun], ['rest', BK.L('Pihenő', 'Rest stop')],
    ];
    var STEP = 18;
    toggles.forEach(function (r, i) {
      var y = b.y + 56 + i * STEP;
      s.keepD(BK.ui.text(s, b.x + 20, y, r[1], { outline: false, origin: [0, 0.5], fit: 118 }));
      var on = r[0] === 'rest' ? P.settings.rest !== false : !!P.settings[r[0]];
      s.keepD(BK.ui.button(s, b.x + 158, y, on ? BK.T.on : BK.T.off, function () {
        P.settings[r[0]] = P.settings[r[0]] === false ? true : !P.settings[r[0]];
        BK.save.persist();
        BK.audio.apply(P.settings);
        s.draw();
      }, { w: 34, h: 16, color: on ? 0x2e7d3e : 0x8a3a2a }));
    });
    var font = BK.FONTS.filter(function (f) { return f.id === BK.fontId; })[0] || BK.FONTS[0];
    var lay = BK.layoutOf(P);
    var hid = BK.hintSet(P), hset = BK.KEY_HINT_SETS.filter(function (h) { return h.id === hid; })[0] || BK.KEY_HINT_SETS[0];
    var choices = [
      // word language: what the child types
      [BK.T.wordLang, P.lang === 'en' ? BK.T.langEn : BK.T.langHu, function () { P.lang = P.lang === 'en' ? 'hu' : 'en'; BK.save.persist(); s.draw(); }],
      // interface language: menus and tips
      [BK.T.uiLang, BK.uiLang === 'en' ? 'English' : 'Magyar', function () { BK.applyUiLang(BK.uiLang === 'en' ? 'hu' : 'en', P); s.scene.restart(s.data0); }],
      [BK.T.font, font.name, function () {
        BK.applyFont(BK.FONTS[(BK.FONTS.indexOf(font) + 1) % BK.FONTS.length].id, P); s.scene.restart(s.data0);
      }],
      // keyboard layout of the computer: Hungarian QWERTZ or English QWERTY
      [BK.T.kbLayout, lay.name, function () {
        var ids = Object.keys(BK.LAYOUTS);
        P.settings.layout = ids[(ids.indexOf(lay.id) + 1) % ids.length]; BK.setLayout(P.settings.layout); BK.save.persist(); s.draw();
        if (P.settings.layout !== 'hu') BK.ui.toast(s, BK.W / 2, b.y + b.h - 34, BK.T.kbLayoutNote, 0xffe0a0, 1, 2600);
      }],
      // which keys the Pumpkin King's marks need (Option on a Mac, AltGr on a PC)
      // the level chosen for a new player, Kezdő or Haladó, can be changed here later
      [BK.L('Szint', 'Level'), P.grade === '5-6' ? BK.T.grade56 : BK.T.grade34, function () {
        P.grade = P.grade === '5-6' ? '3-4' : '5-6'; BK.save.persist(); s.draw();
      }],
      [BK.L('Jelek súgója', 'Mark hints'), hset.name, function () {
        var sets = BK.KEY_HINT_SETS, k = sets.indexOf(hset);
        P.settings.kbHint = sets[(k + 1) % sets.length].id; BK.save.persist(); s.draw();
      }],
    ];
    choices.forEach(function (c, i) {
      var y = b.y + 56 + i * STEP;
      s.keepD(BK.ui.text(s, b.x + 186, y, c[0], { outline: false, origin: [0, 0.5], fit: 82 }));
      s.keepD(BK.ui.button(s, b.x + b.w - 50, y, c[1], c[2], { w: 70, h: 16 }));
    });
    // the warm-up test once more (for a child who skipped it, or has improved a lot)
    if (this.data0.from === 'Map') {
      var wy = b.y + 56 + choices.length * STEP;
      s.keepD(BK.ui.text(s, b.x + 186, wy, BK.L('Bemelegítés', 'Warm-up'), { outline: false, origin: [0, 0.5], fit: 82 }));
      s.keepD(BK.ui.button(s, b.x + b.w - 50, wy, BK.L('Újra', 'Again'), function () {
        BK.save.persist();
        s.scene.stop('Map');
        s.scene.start('Placement');
      }, { w: 70, h: 16 }));
    }
  }
};
