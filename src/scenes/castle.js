/*
 * Váram (my castle): a room the child furnishes with coins (and, for the finest things, rare
 * treasures from the kitchen). Seven places on the floor, four picture frames on the wall that
 * show treasures, dishes or rare treasures the child has, and a flag with the child's sign
 * (made on the profile page). Props: GandalfHardcore FREE Platformer Assets (tools/build_castle.py).
 * p.castle = { props: [owned ids], floor: [slot -> id], frames: how many bought, framed: [slot -> 'kind:id'] }
 */
BK.CastleScene = class extends Phaser.Scene {
  constructor() { super('Castle'); }
  create() {
    var s = this, P = this.P = BK.state.profile;
    P.castle = Object.assign({ props: [], floor: [], frames: 0, framed: [] }, P.castle || {});
    if (!P.emblem) P.emblem = BK.emblem.make(P.nick);
    BK.audio.music(BK.MUSIC.map);
    this.room = [];
    this.picker = [];
    this.drawRoom();
    // top bar: title and coins
    this.add.rectangle(0, 0, BK.W, 16, 0x2b1a14, 0.7).setOrigin(0, 0).setDepth(300);
    BK.ui.text(this, 8, 2, BK.L('Váram', 'My castle'), { color: 0xfff2dc }).setDepth(301);
    this.add.sprite(300, 8, 'coin').play('coin').setDepth(301);
    this.coinText = BK.ui.text(this, 310, 2, String(P.coins), { color: 0xffe9a0 }).setDepth(301);
    this.add.image(352, 8, 'icons_gear', 80).setScale(0.7).setDepth(301);
    this.rareText = BK.ui.text(this, 360, 2, String(BK.rareCount(P)), { color: 0xd8c0ff }).setDepth(301);
    var bb = BK.ui.button(this, 192, 205, BK.T.back + ' (Esc)', function () { s.close(); }, { w: 80, h: 18, key: 'ESC' });
    bb.setDepth(300); if (bb.zone) bb.zone.setDepth(300);
    this.hint = BK.ui.text(this, 192, 24, BK.L('Kattints egy üres helyre vagy keretre!', 'Click an empty place or frame!'), { outline: true, origin: [0.5, 0.5], px: 9, color: 0xfff2dc }).setDepth(301);
  }
  close() { this.closePicker(); BK.save.persist(); this.scene.start('Map'); }
  keepR(o) { this.room.push(o); return o; }
  refreshTop() { this.coinText.setText(String(this.P.coins)); this.rareText.setText(String(BK.rareCount(this.P))); }

  // ------------------------------------------------------------ the room
  drawRoom() {
    var s = this, P = this.P, C = P.castle;
    this.room.forEach(function (o) { o.destroy(); });
    this.room = [];
    var FLOOR = 170;
    // brick wall and wooden floor
    this.keepR(this.add.tileSprite(0, 0, BK.W, FLOOR, 'castle_wall').setOrigin(0, 0).setTint(0xd8c0b0));
    this.keepR(this.add.rectangle(0, FLOOR - 4, BK.W, 4, 0x3a2418).setOrigin(0, 0));
    this.keepR(this.add.tileSprite(0, FLOOR, BK.W, BK.H - FLOOR, 'plank').setOrigin(0, 0).setTint(0xc89060));
    this.keepR(this.add.rectangle(0, 16, BK.W, 5, 0x4a2c1c).setOrigin(0, 0));
    // door, windows, torches
    this.keepR(this.add.image(16, FLOOR - 4, 'castle_door').setOrigin(0.5, 1));
    [88, 296].forEach(function (x) { s.keepR(s.add.image(x, 58, 'castle_window')); });
    [140, 244].forEach(function (x) { s.keepR(s.add.sprite(x, 72, 'castle_torch').play('castle_torch')); });
    // the flag with the child's sign
    var fl = this.add.graphics();
    fl.fillStyle(0x6a2a2a, 1).fillRect(170, 22, 44, 6);
    fl.fillStyle(0x9a2a3a, 1).fillPoints([{ x: 172, y: 26 }, { x: 212, y: 26 }, { x: 212, y: 84 }, { x: 192, y: 94 }, { x: 172, y: 84 }], true);
    fl.fillStyle(0xffd23c, 1).fillRect(172, 26, 40, 2);
    this.keepR(fl);
    this.keepR(BK.emblem.draw(this, 192, 58, P.emblem, 30));
    var fz = this.keepR(this.add.zone(192, 58, 44, 72).setInteractive({ useHandCursor: true }));
    fz.on('pointerup', function () { BK.audio.sfx('chime'); BK.save.persist(); s.scene.start('Profile', { tab: 0 }); });
    // picture frames
    this.FRAMES = [56, 118, 266, 328];
    this.FRAMES.forEach(function (x, i) { s.drawFrame(x, 116, i); });
    // the floor places
    this.SLOTS = [44, 92, 140, 192, 244, 292, 340];
    this.SLOTS.forEach(function (x, i) { s.drawSlot(x, FLOOR + 2, i); });
  }
  drawFrame(x, y, i) {
    var s = this, C = this.P.castle, owned = i < (C.frames || 0), g = this.keepR(this.add.graphics());
    if (!owned) {
      g.lineStyle(1, 0xfff2dc, 0.5).strokeRect(x - 13, y - 13, 26, 26);
      this.keepR(BK.ui.text(this, x, y, '+' + BK.CASTLE_FRAME_PRICE, { outline: true, origin: [0.5, 0.5], px: 8, color: 0xffe9a0 }));
    } else {
      g.fillStyle(0x5a3426, 1).fillRect(x - 15, y - 15, 30, 30);
      g.fillStyle(0xc8962e, 1).fillRect(x - 13, y - 13, 26, 26);
      g.fillStyle(0xf6e3c8, 1).fillRect(x - 11, y - 11, 22, 22);
      var what = C.framed[i];
      if (what) {
        var k = what.split(':'), list = k[0] === 'item' ? BK.ITEMS : k[0] === 'dish' ? BK.RECIPES : BK.RARES;
        var o = list.find(function (q) { return q.id === k[1]; });
        if (o) this.keepR(this.add.image(x, y, k[0] === 'rare' ? 'icons_gear' : 'icons_food', o.frame));
      }
    }
    var z = this.keepR(this.add.zone(x, y, 30, 30).setInteractive({ useHandCursor: true }));
    z.on('pointerup', function () {
      if (s.picker.length) return;
      if (!owned) {
        if (i !== (C.frames || 0)) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }        // frames are bought left to right
        if (s.P.coins < BK.CASTLE_FRAME_PRICE) { s.toast(BK.T.notEnough); return; }
        s.P.coins -= BK.CASTLE_FRAME_PRICE; C.frames = (C.frames || 0) + 1;
        BK.audio.sfx('buy'); BK.save.persist(); s.refreshTop(); s.drawRoom();
        return;
      }
      s.openFramePicker(i);
    });
  }
  drawSlot(x, y, i) {
    var s = this, C = this.P.castle, id = C.floor[i];
    if (id) {
      var pr = BK.CASTLE_PROPS.find(function (q) { return q.id === id; });
      var o = pr && pr.sprite ? this.add.sprite(x, y, pr.sprite).setOrigin(0.5, 1).play(pr.sprite) : this.add.image(x, y, 'castle_' + id).setOrigin(0.5, 1);
      this.keepR(o);
    } else {
      var g = this.keepR(this.add.graphics());
      g.lineStyle(1, 0xfff2dc, 0.45).strokeRect(x - 14, y - 22, 28, 22);
      this.keepR(BK.ui.text(this, x, y - 11, '+', { outline: true, origin: [0.5, 0.5], color: 0xfff2dc }));
    }
    var z = this.keepR(this.add.zone(x, y - 20, 44, 44).setInteractive({ useHandCursor: true }));
    z.on('pointerup', function () { if (!s.picker.length) s.openPropPicker(i); });
  }
  toast(t) { BK.ui.toast(this, BK.W / 2, 150, t, 0xff9a7a); BK.audio.sfx('key_bad', { volume: 0.3 }); }

  // ------------------------------------------------------------ pickers
  closePicker() { this.picker.forEach(function (o) { o.destroy(); }); this.picker = []; }
  keepP(o) { this.picker.push(o); if (o.zone) this.picker.push(o.zone); return o; }
  panel(title) {
    this.closePicker();
    var s = this;
    this.keepP(this.add.rectangle(0, 0, BK.W, BK.H, 0x000000, 0.35).setOrigin(0, 0).setDepth(400).setInteractive());
    var bx = 32, by = 26, bw = 320, bh = 160;
    this.keepP(BK.ui.nine(this, bx, by, bw, bh, 'ui_panel2').setDepth(401));
    this.keepP(BK.ui.text(this, BK.W / 2, by + 26, title, { outline: false, size: 2, origin: [0.5, 0.5] }).setDepth(402));
    var cb = this.keepP(BK.ui.button(this, BK.W / 2, by + bh - 14, BK.L('Bezár', 'Close'), function () { s.closePicker(); }, { w: 64, h: 16 }));
    cb.setDepth(402); if (cb.zone) cb.zone.setDepth(402);
    return { x: bx, y: by, w: bw, h: bh };
  }
  // what to put in a floor place: owned things first (free), then the shop
  openPropPicker(slot) {
    var s = this, P = this.P, C = P.castle, page = this.propPage || 0;
    var b = this.panel(BK.L('Mi kerüljön ide?', 'What goes here?'));
    var used = C.floor.filter(Boolean);
    var list = BK.CASTLE_PROPS.slice().sort(function (a, c) {
      var ao = C.props.indexOf(a.id) >= 0 ? 0 : 1, co = C.props.indexOf(c.id) >= 0 ? 0 : 1;
      return ao - co || a.price - c.price;
    });
    var PER = 16, pages = Math.ceil(list.length / PER);
    list.slice(page * PER, page * PER + PER).forEach(function (pr, i) {
      var x = b.x + 34 + (i % 8) * 36, y = b.y + 58 + Math.floor(i / 8) * 40;
      var owned = C.props.indexOf(pr.id) >= 0, placed = used.indexOf(pr.id) >= 0 && C.floor[slot] !== pr.id;
      s.keepP(BK.ui.nine(s, x - 16, y - 18, 32, 36, C.floor[slot] === pr.id ? 'ui_slot_sel' : 'ui_slot').setDepth(402));
      var key = pr.sprite || ('castle_' + pr.id);
      var im = s.keepP((pr.sprite ? s.add.sprite(x, y + 6, key, 0) : s.add.image(x, y + 6, key)).setOrigin(0.5, 1).setDepth(403));
      im.setScale(Math.min(1, 24 / im.height, 28 / im.width));
      if (placed) im.setAlpha(0.35);
      s.keepP(BK.ui.text(s, x, y + 9, owned ? (placed ? BK.L('kint van', 'placed') : BK.L('megvan', 'yours')) : pr.price + (pr.rare ? '+' + pr.rare + '◆' : ''),
        { outline: false, origin: [0.5, 0.5], px: 7, color: owned ? 0x6b8a50 : 0x9a3d1a, bold: true }).setDepth(403));
      var z = s.keepP(s.add.zone(x, y, 32, 36).setInteractive({ useHandCursor: true }).setDepth(404));
      z.on('pointerup', function () { s.pickProp(slot, pr); });
    });
    // empty the place, and the page arrows
    if (C.floor[slot]) {
      var eb = this.keepP(BK.ui.button(this, b.x + 56, b.y + b.h - 14, BK.L('Elteszem', 'Put away'), function () {
        C.floor[slot] = null; BK.audio.sfx('ui'); BK.save.persist(); s.closePicker(); s.drawRoom();
      }, { w: 70, h: 16 }));
      eb.setDepth(402); if (eb.zone) eb.zone.setDepth(402);
    }
    if (pages > 1) [[-1, b.x + b.w - 70, '<'], [1, b.x + b.w - 40, '>']].forEach(function (a) {
      var pb = s.keepP(BK.ui.button(s, a[1], b.y + b.h - 14, a[2], function () { s.propPage = (page + a[0] + pages) % pages; s.openPropPicker(slot); }, { w: 20, h: 16 }));
      pb.setDepth(402); if (pb.zone) pb.zone.setDepth(402);
    });
  }
  pickProp(slot, pr) {
    var s = this, P = this.P, C = P.castle;
    if (C.props.indexOf(pr.id) < 0) {
      // buy it
      if (P.coins < pr.price) { this.toast(BK.T.notEnough); return; }
      if (pr.rare && BK.rareCount(P) < pr.rare) { this.toast(BK.L('Ehhez ritka kincs is kell: főzz a Konyhában!', 'This needs rare treasures: cook in the Kitchen!')); return; }
      if (pr.rare) BK.payRares(P, pr.rare);
      P.coins -= pr.price;
      C.props.push(pr.id);
      BK.audio.sfx('buy');
    } else BK.audio.sfx('ui');
    // one thing is in one place: move it here if it stood somewhere else
    C.floor = C.floor.map(function (id) { return id === pr.id ? null : id; });
    C.floor[slot] = pr.id;
    BK.save.persist();
    this.refreshTop();
    this.closePicker();
    this.drawRoom();
  }
  // what to show in a frame: treasures, dishes and rare treasures the child has
  openFramePicker(slot) {
    var s = this, P = this.P, C = P.castle;
    var b = this.panel(BK.L('Mit tegyek a keretbe?', 'What goes in the frame?'));
    var things = [];
    BK.ITEMS.forEach(function (it) { if (P.items[it.id]) things.push(['item', it, 'icons_food']); });
    BK.RECIPES.forEach(function (r) { if (((P.dishes || {})[r.id] || 0) > 0) things.push(['dish', r, 'icons_food']); });
    BK.RARES.forEach(function (r) { if ((P.rares || {})[r.id]) things.push(['rare', r, 'icons_gear']); });
    if (!things.length) this.keepP(BK.ui.text(this, BK.W / 2, b.y + 80, BK.L('Még nincs mit kitenni: gyűjts kincseket!', 'Nothing to show yet: collect treasures!'), { outline: false, origin: [0.5, 0.5], color: 0x9a8a80 }).setDepth(403));
    things.slice(0, 24).forEach(function (t, i) {
      var x = b.x + 30 + (i % 10) * 29, y = b.y + 56 + Math.floor(i / 10) * 30, key = t[0] + ':' + t[1].id;
      s.keepP(BK.ui.nine(s, x - 13, y - 13, 26, 26, C.framed[slot] === key ? 'ui_slot_sel' : 'ui_slot').setDepth(402));
      s.keepP(s.add.image(x, y, t[2], t[1].frame).setDepth(403));
      var z = s.keepP(s.add.zone(x, y, 26, 26).setInteractive({ useHandCursor: true }).setDepth(404));
      z.on('pointerup', function () { C.framed[slot] = key; BK.audio.sfx('ui'); BK.save.persist(); s.closePicker(); s.drawRoom(); });
    });
    if (C.framed[slot]) {
      var eb = this.keepP(BK.ui.button(this, b.x + 56, b.y + b.h - 14, BK.L('Üres keret', 'Empty frame'), function () {
        C.framed[slot] = null; BK.save.persist(); s.closePicker(); s.drawRoom();
      }, { w: 76, h: 16 }));
      eb.setDepth(402); if (eb.zone) eb.zone.setDepth(402);
    }
  }
};
