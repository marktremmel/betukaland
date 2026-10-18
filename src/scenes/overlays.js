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
    this.frame(BK.T.shop, 300, 196);
    var s = this, b = this.box;
    this.karou = this.add.sprite(b.x + 34, b.y + b.h - 6, 'karou_sit').setOrigin(0.5, 1).play('karou_sit');
    BK.ui.button(this, b.x + 46, b.y + 46, BK.T.outfits, function () { s.tab = 0; s.draw(); }, { w: 64, h: 16 });
    BK.ui.button(this, b.x + 116, b.y + 46, BK.T.pets, function () { s.tab = 1; s.draw(); }, { w: 64, h: 16 });
    BK.ui.button(this, b.x + 256, b.y + 46, BK.T.magic, function () { s.tab = 3; s.fxSel = null; s.draw(); }, { w: 64, h: 16 });
    // switching figures only from the map: in a level the hero is already on the road
    if (this.data0.from !== 'Level') BK.ui.button(this, b.x + 186, b.y + 46, BK.T.figures, function () { s.tab = 2; s.draw(); }, { w: 64, h: 16 });
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
    this.keepD(this.add.rectangle(b.x + 46 + this.tab * 70, b.y + 46, 68, 20).setStrokeStyle(1, 0x9a3d1a));
    this.karou.setVisible(this.tab < 2);
    if (this.tab === 2) { this.drawFigures(); return; }
    if (this.tab === 3) { this.drawMagic(); return; }
    // reward pets (Halloween) are not for sale; they show once the child has one
    var list = this.tab === 0 ? BK.OUTFITS : BK.PETS.filter(function (p) { return !p.reward || P.pets.indexOf(p.id) >= 0; });
    list.forEach(function (it, i) {
      var col = i % 3, row = Math.floor(i / 3);
      var x = b.x + 16 + col * 92, y = b.y + 58 + row * 56;
      s.keepD(BK.ui.nine(s, x, y, 86, 54, 'ui_slot'));
      var hero = BK.heroOf(P);
      var key = s.tab === 0 ? (it.id === 'base' ? hero.idle : hero.idle + '_' + it.id) : it.sprite;
      var spr = s.keepD(s.add.sprite(x + 20, y + 50, key).setOrigin(0.5, 1).play(key));
      if (spr.height > 36) spr.setScale(0.5);
      if (s.tab === 1) spr.setFlipX(BK.FACES_LEFT[key.split('_')[0]] === true);
      s.keepD(BK.ui.text(s, x + 43, y + 4, it.name, { outline: false, origin: [0.5, 0] }));
      var owned = s.tab === 0 ? P.outfits.indexOf(it.id) >= 0 : P.pets.indexOf(it.id) >= 0;
      var wearing = s.tab === 0 ? P.outfit === it.id : P.pet === it.id;
      if (!owned) s.keepD(BK.ui.text(s, x + 58, y + 20, it.price + ' ' + BK.L('érme', 'coins'), { outline: false, origin: [0.5, 0], color: 0x9a3d1a }));
      var label = wearing ? (s.tab === 1 ? BK.L('Hazaküld', 'Send home') : BK.T.wearing) : (owned ? BK.T.wear : BK.T.buy);
      var btn = s.keepD(BK.ui.button(s, x + 58, y + 42, label, function () { s.act(it, owned, wearing); }, { w: 56, h: 16, disabled: wearing && s.tab === 0 }));
    });
  }
  // Magic: the shape and the colour of the shot at each correct key. A click shows it
  // (a test shot); the button buys it or puts it in use. In the basic and pastel sets
  // the child then picks one colour from the row of swatches.
  drawMagic() {
    var s = this, P = this.P, b = this.box, fx = P.fx;
    var sel = this.fxSel || { kind: 'shape', id: fx.shape };
    var item = (sel.kind === 'shape' ? BK.SHOT_SHAPES : BK.SHOT_COLOURS).find(function (o) { return o.id === sel.id; });
    var row = function (list, kind, y, w, step, x0) {
      list.forEach(function (o, i) {
        var x = b.x + x0 + i * step, owned = fx.owned.indexOf(o.id) >= 0;
        var inUse = kind === 'shape' ? fx.shape === o.id : fx.colour === o.id;
        s.keepD(BK.ui.nine(s, x - w / 2, y - 14, w, 28, inUse ? 'ui_slot_sel' : 'ui_slot'));
        if (kind === 'shape') s.shotIcon(x, owned ? y - 1 : y - 5, o.id, fx.colour, fx.tone);
        else s.colourIcon(x, y - 6, o);
        var tag = kind === 'shape' ? (owned ? '' : o.price + '') : (owned ? o.name : o.name + ' ' + o.price);
        if (tag) s.keepD(BK.ui.text(s, x, y + 6, tag, { outline: false, origin: [0.5, 0.5], px: 9, bold: !owned, color: owned ? 0x4a2c1c : 0x9a3d1a, fit: w - 6 }));
        if (sel.kind === kind && sel.id === o.id) s.keepD(s.add.rectangle(x, y, w + 4, 32).setStrokeStyle(2, 0xffffff));
        var z = s.keepD(s.add.zone(x, y, w, 28).setInteractive({ useHandCursor: true }));
        z.on('pointerup', function () {
          s.fxSel = { kind: kind, id: o.id, tone: kind === 'colour' && fx.colour === o.id ? fx.tone : 0 };
          BK.audio.sfx('ui');
          s.draw();
          s.demo();
        });
      });
    };
    this.keepD(BK.ui.text(this, b.x + 14, b.y + 57, BK.T.shape, { outline: false, px: 9, color: 0x6b3a20 }));
    row(BK.SHOT_SHAPES, 'shape', b.y + 81, 36, 40, 30);
    this.keepD(BK.ui.text(this, b.x + 14, b.y + 97, BK.T.colours, { outline: false, px: 9, color: 0x6b3a20 }));
    row(BK.SHOT_COLOURS, 'colour', b.y + 121, 44, 46, 35);
    // the single colours of a basic or pastel set
    if (sel.kind === 'colour' && item.pick) {
      item.cols.forEach(function (c, i) {
        var x = b.x + 60 + i * 18, y = b.y + 144, on = (sel.tone || 0) === i;
        s.keepD(s.add.rectangle(x, y, 12, 9, c).setStrokeStyle(on ? 2 : 1, on ? 0xffffff : 0x4a2c1c));
        var z = s.keepD(s.add.zone(x, y, 16, 12).setInteractive({ useHandCursor: true }));
        z.on('pointerup', function () { s.fxSel = { kind: 'colour', id: item.id, tone: i }; BK.audio.sfx('ui'); s.draw(); s.demo(); });
      });
    }
    // what is selected, and the button for it
    var owned = fx.owned.indexOf(item.id) >= 0;
    var inUse = sel.kind === 'shape' ? fx.shape === item.id : (fx.colour === item.id && (!item.pick || (fx.tone || 0) === (sel.tone || 0)));
    this.keepD(BK.ui.text(this, b.x + 14, b.y + 163, item.name + (owned ? '' : '  ·  ' + item.price + ' ' + BK.L('érme', 'coins')), { outline: false, origin: [0, 0.5], color: 0x4a2c1c, bold: true, fit: 150 }));
    var label = inUse ? BK.T.using : owned ? BK.T.use : BK.T.buy;
    this.keepD(BK.ui.button(this, b.x + b.w - 56, b.y + 163, label, function () { s.buyMagic(sel, item); }, { w: 84, h: 16, disabled: inUse }));
  }
  // a shape, drawn in the colour the child uses now
  shotIcon(x, y, shape, colour, tone) {
    BK.fx.shotTextures(this);
    var set = BK.fx.colourSet(colour), c = BK.fx.shotColour(set, tone, 2), s = this;
    var add = function (o) { if (set.rtx) o.setBlendMode(Phaser.BlendModes.ADD); return s.keepD(o); };
    if (set.rtx) this.keepD(this.add.image(x, y, 'shot_glow').setTint(0x8ae8ff).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35));
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
    var cols = o.rainbow ? [0xff5a5a, 0xffb43c, 0xfff05a, 0x5ad17a, 0x5aa0ff, 0xb87aff] : o.rtx ? [0xfff8e8, 0x8ae8ff, 0xffc070, 0xd8a0ff] :
      o.chrome ? [0x8a94a0, 0xe8eef4, 0xb0bac4, 0xffffff] : o.cols;
    if (o.pick) cols = cols.filter(function (c, i) { return i % 2 === 0; });
    var w = Math.min(8, 36 / cols.length);
    for (var i = 0; i < cols.length; i++) this.keepD(this.add.rectangle(x + (i - (cols.length - 1) / 2) * w, y, w - 1, 7, cols[i]));
  }
  // a test shot over the panel with the selected shape and colour
  demo() {
    var sel = this.fxSel, fx = this.P.fx, b = this.box, s = this;
    var test = { shape: sel.kind === 'shape' ? sel.id : fx.shape, colour: sel.kind === 'colour' ? sel.id : fx.colour,
      tone: sel.kind === 'colour' ? sel.tone || 0 : fx.tone };
    for (var i = 0; i < 3; i++) (function (i) {
      s.time.delayedCall(i * 170, function () { BK.fx.bolt(s, b.x + 40, b.y + 100, b.x + b.w - 40, b.y + 98 + (i - 1) * 3, test); });
    })(i);
  }
  buyMagic(sel, item) {
    var P = this.P, fx = P.fx;
    if (fx.owned.indexOf(item.id) < 0) {
      if (P.coins < item.price) { BK.ui.toast(this, BK.W / 2, this.box.y + this.box.h - 34, BK.T.notEnough, 0xff9a7a); BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
      P.coins -= item.price;
      fx.owned.push(item.id);
      BK.audio.sfx('buy');
      BK.audio.sfx('v_great', { volume: 0.5 });
    }
    if (sel.kind === 'shape') fx.shape = item.id; else { fx.colour = item.id; fx.tone = item.pick ? sel.tone || 0 : 0; }
    BK.save.persist();
    this.draw();
    this.demo();
  }

  // Figures: free to switch, 5 x 3 small slots, the current one framed in white
  drawFigures() {
    var s = this, P = this.P, b = this.box;
    BK.HEROES.forEach(function (h, i) {
      var x = b.x + 38 + (i % 5) * 56, y = b.y + 76 + Math.floor(i / 5) * 38;
      var sel = i === (P.avatar || 0);
      s.keepD(BK.ui.nine(s, x - 26, y - 18, 52, 36, sel ? 'ui_slot_sel' : 'ui_slot'));
      var spr = s.keepD(BK.avatarSprite(s, x, y + 16, i, P));
      spr.setScale(h.id === 'crab' ? 1.4 : Math.min(1, 30 / spr.height));
      if (sel) s.keepD(s.add.rectangle(x, y, 56, 40).setStrokeStyle(2, 0xffffff));
      var z = s.keepD(s.add.zone(x, y, 52, 36).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () {
        if (P.avatar === i) return;
        P.avatar = i;
        BK.audio.sfx('ui');
        BK.save.persist();
        s.draw();
      });
    });
    this.keepD(BK.ui.text(this, b.x + 14, b.y + b.h - 16, BK.T.figureNow + ' ' + BK.heroOf(P).name,
      { outline: false, origin: [0, 0.5], color: 0x9a3d1a, fit: 96 }));
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
    this.frame(BK.T.bag, 300, 196);
    var b = this.box;
    var have = BK.ITEMS.filter(function (it) { return P.items[it.id]; });
    if (!have.length) {
      BK.ui.text(this, BK.W / 2, BK.H / 2, BK.T.empty + ' ' + BK.L('Nyiss ki kincsesládákat!', 'Open treasure chests!'), { outline: false, origin: [0.5, 0.5] });
    }
    BK.ITEMS.forEach(function (it, i) {
      var col = i % 8, row = Math.floor(i / 8);
      var x = b.x + 28 + col * 34, y = b.y + 56 + row * 34;
      var n = P.items[it.id] || 0;
      BK.ui.nine(s, x - 14, y - 14, 28, 28, n ? 'ui_slot_sel' : 'ui_slot_off');
      var icon = s.add.image(x, y, 'icons_food', it.frame);
      if (!n) icon.setTint(0x302828).setAlpha(0.6);
      else BK.ui.text(s, x + 12, y + 4, 'x' + n, { origin: [1, 0], color: 0xffffff });
    });
    BK.ui.text(this, BK.W / 2, b.y + b.h - 36, have.length + ' / ' + BK.ITEMS.length + ' ' + BK.L('kincs', 'treasures'), { outline: false, origin: [0.5, 0.5], color: 0x6b3a20 });
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
      ['sfx', BK.T.sound], ['speedRun', BK.T.speedRun],
    ];
    toggles.forEach(function (r, i) {
      var y = b.y + 56 + i * 20;
      s.keepD(BK.ui.text(s, b.x + 20, y, r[1], { outline: false, origin: [0, 0.5], fit: 118 }));
      var on = !!P.settings[r[0]];
      s.keepD(BK.ui.button(s, b.x + 158, y, on ? BK.T.on : BK.T.off, function () {
        P.settings[r[0]] = !P.settings[r[0]];
        BK.save.persist();
        BK.audio.apply(P.settings);
        s.draw();
      }, { w: 34, h: 18, color: on ? 0x2e7d3e : 0x8a3a2a }));
    });
    var font = BK.FONTS.filter(function (f) { return f.id === BK.fontId; })[0] || BK.FONTS[0];
    var lay = BK.layoutOf(P);
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
      }],
    ];
    choices.forEach(function (c, i) {
      var y = b.y + 56 + i * 20;
      s.keepD(BK.ui.text(s, b.x + 186, y, c[0], { outline: false, origin: [0, 0.5], fit: 82 }));
      s.keepD(BK.ui.button(s, b.x + b.w - 50, y, c[1], c[2], { w: 70, h: 18 }));
    });
    // the warm-up test once more (for a child who skipped it, or has improved a lot)
    if (this.data0.from === 'Map') {
      var wy = b.y + 56 + 4 * 20;
      s.keepD(BK.ui.text(s, b.x + 186, wy, BK.L('Bemelegítés', 'Warm-up'), { outline: false, origin: [0, 0.5], fit: 82 }));
      s.keepD(BK.ui.button(s, b.x + b.w - 50, wy, BK.L('Újra', 'Again'), function () {
        BK.save.persist();
        s.scene.stop('Map');
        s.scene.start('Placement');
      }, { w: 70, h: 18 }));
    }
    if (lay.id !== 'hu') {
      s.keepD(BK.ui.text(s, b.x + 186, b.y + 56 + 5 * 20 - 6, BK.T.kbLayoutNote, { outline: false, width: 140, px: 9, color: 0x6b3a20 }));
    }
  }
};
