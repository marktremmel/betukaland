/*
 * Váram (my castle): a wide room (two screens) the child furnishes with coins and, for the
 * finest things, rare treasures from the kitchen.
 * - Things are bought into a store (several of a kind is fine) and placed anywhere: drag them
 *   along the floor, or onto another thing (a crate on a crate, a vase on a table): stacking.
 *   A click on a thing without dragging puts it back into the store.
 * - Four picture frames for treasures, dishes or rare treasures; a board for three badges
 *   (pinned on the profile page); a flag with the child's sign.
 * - Three friends live here and know what to do next: Karou (daily goals), Denevérke (tales)
 *   and Brekus the frog (stories). A click on them takes the child there.
 * - Guests: other players on this computer can be invited; they walk around, and the child can
 *   say friendly things to them (only ready-made sentences). Their castle can be visited too.
 * Props: GandalfHardcore FREE Platformer Assets (tools/build_castle.py).
 * p.castle = { inv: { id: how many }, placed: [{ id, x, y }], frames, framed: [...], guests: [ids] }
 */
BK.CASTLE_W = 640;
BK.castleData = function (p) {
  var C = p.castle = Object.assign({ props: [], floor: [], frames: 0, framed: [], inv: null, placed: null, guests: [] }, p.castle || {});
  // v0.11 castles (or one read back from a save code): owned things become the store,
  // the seven old places become free positions
  if (!C.inv) { C.inv = {}; (C.props || []).forEach(function (id) { C.inv[id] = 1; }); }
  if (!C.placed) {
    var X = [44, 92, 140, 192, 244, 292, 340];
    C.placed = (C.floor || []).map(function (id, i) { return id ? { id: id, x: X[i], y: 184 } : null; }).filter(Boolean);
  }
  C.placed = C.placed || [];
  C.guests = C.guests || [];
  return C;
};

BK.CastleScene = class extends Phaser.Scene {
  constructor() { super('Castle'); }
  init(data) { this.ownerId = data && data.owner || null; }
  create() {
    var s = this, me = BK.state.profile;
    // visiting a friend's castle: theirs is shown, nothing can be changed
    this.visit = this.ownerId && this.ownerId !== me.id ? BK.save.get(this.ownerId) : null;
    var P = this.P = this.visit || me;
    this.C = BK.castleData(P);
    if (!P.emblem) P.emblem = BK.emblem.make(P.nick);
    BK.audio.music(BK.MUSIC.map);
    this.scroll = 0;
    this.roomC = this.add.container(0, 0);
    this.picker = [];
    this.drawRoom();
    // fixed bar on top and buttons below (outside the scrolling room)
    this.add.rectangle(0, 0, BK.W, 16, 0x2b1a14, 0.75).setOrigin(0, 0).setDepth(300);
    BK.ui.text(this, 8, 2, this.visit ? BK.L('Vendégségben: ', 'Visiting: ') + P.nick : BK.L('Váram', 'My castle'), { color: 0xfff2dc }).setDepth(301);
    if (!this.visit) {
      this.add.sprite(300, 8, 'coin').play('coin').setDepth(301);
      this.coinText = BK.ui.text(this, 310, 2, String(me.coins), { color: 0xffe9a0 }).setDepth(301);
      this.add.image(352, 8, 'icons_gear', 80).setScale(0.7).setDepth(301);
      this.rareText = BK.ui.text(this, 360, 2, String(BK.rareCount(me)), { color: 0xd8c0ff }).setDepth(301);
    }
    var btn = function (x, label, fn, w) { var b = BK.ui.button(s, x, 205, label, fn, { w: w || 70, h: 18 }); b.setDepth(300); if (b.zone) b.zone.setDepth(300); return b; };
    btn(50, BK.T.back + ' (Esc)', function () { s.close(); }, 80).zone;
    this.input.keyboard.on('keydown-ESC', function () { if (s.picker.length) s.closePicker(); else s.close(); });
    if (!this.visit) {
      btn(140, BK.L('+ Tárgy', '+ Thing'), function () { if (!s.picker.length) s.openPropPicker(); });
      btn(218, BK.L('Vendégek', 'Guests'), function () { if (!s.picker.length) s.openGuests(); });
    }
    btn(304, '<', function () { s.scrollTo(s.scroll - 192); }, 22);
    btn(334, '>', function () { s.scrollTo(s.scroll + 192); }, 22);
    this.input.keyboard.on('keydown-LEFT', function () { s.scrollTo(s.scroll - 64); });
    this.input.keyboard.on('keydown-RIGHT', function () { s.scrollTo(s.scroll + 64); });
    this.hint = BK.ui.text(this, 192, 24, this.visit ? BK.L('Nézz körül! (nyilak: görgetés)', 'Have a look around! (arrows: scroll)') :
      BK.L('Húzd a tárgyakat! Egymásra is rakhatod őket.', 'Drag things! You can stack them too.'), { origin: [0.5, 0.5], px: 9, color: 0xfff2dc }).setDepth(301);
    this.time.delayedCall(4000, function () { s.tweens.add({ targets: s.hint, alpha: 0, duration: 600 }); });
    this.spawnGuests();
  }
  close() {
    this.closePicker(); BK.save.persist();
    if (this.visit) this.scene.start('Castle', {}); else this.scene.start('Map');
  }
  scrollTo(x) {
    this.scroll = BK.util.clamp(x, 0, BK.CASTLE_W - BK.W);
    this.tweens.add({ targets: this.roomC, x: -this.scroll, duration: 220, ease: 'Sine.easeOut' });
  }
  keepR(o) { this.roomC.add(o); return o; }
  refreshTop() { if (this.coinText) { this.coinText.setText(String(BK.state.profile.coins)); this.rareText.setText(String(BK.rareCount(BK.state.profile))); } }
  toast(t, col) { BK.ui.toast(this, BK.W / 2, 150, t, col || 0xff9a7a); if (!col) BK.audio.sfx('key_bad', { volume: 0.3 }); }

  // ------------------------------------------------------------ the room
  drawRoom() {
    var s = this, P = this.P, C = this.C, W = BK.CASTLE_W, FLOOR = 170;
    var guests = this.guestObjs || [];
    guests.forEach(function (o) { s.roomC.remove(o); });
    this.roomC.removeAll(true);
    this.keepR(this.add.tileSprite(0, 0, W, FLOOR, 'castle_wall').setOrigin(0, 0).setTint(0xd8c0b0));
    this.keepR(this.add.rectangle(0, FLOOR - 4, W, 4, 0x3a2418).setOrigin(0, 0));
    this.keepR(this.add.tileSprite(0, FLOOR, W, BK.H - FLOOR, 'plank').setOrigin(0, 0).setTint(0xc89060));
    this.keepR(this.add.rectangle(0, 16, W, 5, 0x4a2c1c).setOrigin(0, 0));
    this.keepR(this.add.image(16, FLOOR - 4, 'castle_door').setOrigin(0.5, 1));
    [88, 296, 470, 600].forEach(function (x) { s.keepR(s.add.image(x, 58, 'castle_window')); });
    [140, 244, 410, 530].forEach(function (x) { s.keepR(s.add.sprite(x, 72, 'castle_torch').play('castle_torch')); });
    // the flag with the sign
    var fl = this.add.graphics();
    fl.fillStyle(0x6a2a2a, 1).fillRect(170, 22, 44, 6);
    fl.fillStyle(0x9a2a3a, 1).fillPoints([{ x: 172, y: 26 }, { x: 212, y: 26 }, { x: 212, y: 84 }, { x: 192, y: 94 }, { x: 172, y: 84 }], true);
    fl.fillStyle(0xffd23c, 1).fillRect(172, 26, 40, 2);
    this.keepR(fl);
    this.keepR(BK.emblem.draw(this, 192, 58, P.emblem, 30, { noMask: true }));
    if (!this.visit) {
      var fz = this.keepR(this.add.zone(192, 58, 44, 72).setInteractive({ useHandCursor: true }));
      fz.on('pointerup', function () { BK.audio.sfx('chime'); BK.save.persist(); s.scene.start('Profile', { tab: 0 }); });
    }
    [56, 118, 266, 328].forEach(function (x, i) { s.drawFrame(x, 116, i); });
    this.drawBadgeBoard(470, 112);
    this.drawHelpers();
    // the things, nearer ones (lower) in front
    this.propObjs = [];
    C.placed.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (pl) { s.drawProp(pl); });
    guests.forEach(function (o) { if (o.active) s.roomC.add(o); });
  }
  // the badges pinned on the profile page
  drawBadgeBoard(x, y) {
    var P = this.P, pins = (P.pins || []).slice(0, 3), g = this.add.graphics();
    g.fillStyle(0x5a3426, 1).fillRect(x - 40, y - 18, 80, 36);
    g.fillStyle(0xb88a5a, 1).fillRect(x - 38, y - 16, 76, 32);
    this.keepR(g);
    this.keepR(BK.ui.text(this, x, y - 23, BK.L('Kitűzőim', 'My badges'), { origin: [0.5, 0.5], px: 8, color: 0xfff2dc }));
    if (!pins.length) this.keepR(BK.ui.text(this, x, y, BK.L('Tűzz ki a Profilomban!', 'Pin some on your profile!'), { outline: false, origin: [0.5, 0.5], px: 7, color: 0x4a2c1c, width: 70, align: 1 }));
    var s = this;
    pins.forEach(function (id, i) {
      var b = BK.BADGES.find(function (q) { return q.id === id; }); if (!b) return;
      var bx = x - 24 + i * 24;
      var c = s.add.graphics(); c.fillStyle(0xffd23c, 1).fillCircle(bx, y, 10); c.fillStyle(0xc8962e, 1).fillCircle(bx, y + 1, 9); c.fillStyle(0xfff2c8, 1).fillCircle(bx, y - 1, 8);
      s.keepR(c);
      s.keepR(s.add.image(bx, y - 1, 'icons_food', b.icon).setScale(0.75));
    });
  }
  // the three helpers: what to do next
  drawHelpers() {
    var s = this, P = this.P, FLOOR = 170;
    if (this.visit) return;
    var G = BK.goals.today(P), done = G.list.filter(function (g) { return g.done; }).length;
    var tl = P.tales || {}, cur = BK.TALES.find(function (t) { var x = tl[t.id]; return x && x.at > 0 && x.at < t.lines.length; });
    var openStory = BK.wordbank.storyLibrary(P.lang || 'hu').filter(function (st) { return BK.save.regionOpen(P, st.region) && !(P.stories || {})[BK.save.storyKey(P, st.id)]; });
    var helpers = [
      { key: 'karou_sit', x: 326, y: FLOOR + 30, say: done < 3 ? BK.L('Mai célok: ', 'Today: ') + done + '/3. ' + BK.L('Gyere, segítek!', 'Come on!') : BK.L('Mára mind kész, szuper!', 'All done today, great!'),
        go: function () { s.scene.start('Practice', { tab: 'today' }); } },
      { key: 'hw_bat_fly', x: 560, y: 92, fly: true, say: cur ? BK.L('Folytassuk: ', 'Let us go on: ') + cur.title + '!' : BK.L('Mesélek, ha kéred!', 'I can tell you a tale!'),
        go: function () { s.scene.start('Practice', { tab: 'tales' }); } },
      { key: 'frog_walk', x: 596, y: FLOOR + 30, say: openStory.length ? openStory.length + BK.L(' történet vár rád.', ' stories are waiting.') : BK.L('Minden történet kész!', 'Every story done!'),
        go: function () { s.scene.start('Practice', { tab: 'story' }); } },
    ];
    helpers.forEach(function (h, i) {
      if (!BK_MANIFEST.sprites[h.key]) return;
      var spr = s.keepR(s.add.sprite(h.x, h.y, h.key).setOrigin(0.5, 1).play(h.key).setDepth(10));
      if (spr.height > 34) spr.setScale(34 / spr.height);
      if (h.key === 'frog_walk') spr.anims.pause();
      if (h.fly) spr.setFlipX(true);
      if (h.fly) s.tweens.add({ targets: spr, y: h.y - 5, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      var bub = s.keepR(BK.ui.text(s, BK.util.clamp(h.x, 50, BK.CASTLE_W - 50), h.y - spr.displayHeight - 8, h.say, { outline: true, origin: [0.5, 1], px: 8, color: 0xfff2dc, width: 96, align: 1 }));
      s.tweens.add({ targets: bub, y: bub.y - 2, duration: 900, yoyo: true, repeat: -1, delay: i * 200 });
      spr.setInteractive({ useHandCursor: true }).on('pointerup', function () { if (!s.picker.length) { BK.audio.sfx('chime'); BK.save.persist(); h.go(); } });
    });
  }
  drawFrame(x, y, i) {
    var s = this, C = this.C, owned = i < (C.frames || 0), g = this.keepR(this.add.graphics());
    if (!owned) {
      if (this.visit) return;
      g.lineStyle(1, 0xfff2dc, 0.5).strokeRect(x - 13, y - 13, 26, 26);
      this.keepR(BK.ui.text(this, x, y, '+' + BK.CASTLE_FRAME_PRICE, { origin: [0.5, 0.5], px: 8, color: 0xffe9a0 }));
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
    if (this.visit) return;
    var z = this.keepR(this.add.zone(x, y, 30, 30).setInteractive({ useHandCursor: true }));
    z.on('pointerup', function () {
      if (s.picker.length) return;
      var me = BK.state.profile;
      if (!owned) {
        if (i !== (C.frames || 0)) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
        if (me.coins < BK.CASTLE_FRAME_PRICE) { s.toast(BK.T.notEnough); return; }
        me.coins -= BK.CASTLE_FRAME_PRICE; C.frames = (C.frames || 0) + 1;
        BK.audio.sfx('buy'); BK.save.persist(); s.refreshTop(); s.drawRoom();
        return;
      }
      s.openFramePicker(i);
    });
  }

  // ------------------------------------------------------------ things: placing, dragging, stacking
  propKey(id) { var pr = BK.CASTLE_PROPS.find(function (q) { return q.id === id; }); return pr && pr.sprite ? pr.sprite : 'castle_' + id; }
  drawProp(pl) {
    var s = this, key = this.propKey(pl.id), pr = BK.CASTLE_PROPS.find(function (q) { return q.id === pl.id; });
    if (!this.textures.exists(key)) return;
    var o = pr && pr.sprite ? this.add.sprite(pl.x, pl.y, key).play(key) : this.add.image(pl.x, pl.y, key);
    o.setOrigin(0.5, 1).setDepth(20 + pl.y / 10);
    o.pl = pl;
    this.keepR(o);
    this.propObjs.push(o);
    if (this.visit) return;
    o.setInteractive({ useHandCursor: true, draggable: true, pixelPerfect: false });
    o.on('dragstart', function () {
      // things standing on this one come along
      o.riders = s.propObjs.filter(function (q) { return q !== o && Math.abs(q.pl.y - (o.pl.y - s.solidH(o))) < 3 && Math.abs(q.pl.x - o.pl.x) < o.width / 2; });
      o.sx = o.x; o.sy = o.y; o.moved = false;
      s.roomC.bringToTop(o); o.riders.forEach(function (r) { s.roomC.bringToTop(r); });
    });
    o.on('drag', function (p, dx, dy) {
      var nx = BK.util.clamp(dx, 8, BK.CASTLE_W - 8), ny = BK.util.clamp(dy, 40, 194);
      if (Math.abs(nx - o.sx) + Math.abs(ny - o.sy) > 3) o.moved = true;
      var mx = nx - o.x, my = ny - o.y;
      o.x = nx; o.y = ny;
      o.riders.forEach(function (r) { r.x += mx; r.y += my; });
    });
    o.on('dragend', function () {
      if (!o.moved) { s.putAway(o); return; }
      // onto the thing under it (its top), or down to the floor
      var best = null;
      s.propObjs.forEach(function (q) {
        if (q === o || o.riders.indexOf(q) >= 0) return;
        var top = q.y - s.solidH(q);
        if (Math.abs(o.x - q.x) < q.width / 2 && o.y > top - 22 && o.y < q.y - 2 && (!best || top < best.y - s.solidH(best))) best = q;
      });
      var ny = best ? best.y - s.solidH(best) : BK.util.clamp(o.y, 172, 194);
      var my = ny - o.y;
      o.y = ny; o.riders.forEach(function (r) { r.y += my; });
      [o].concat(o.riders).forEach(function (q) { q.pl.x = Math.round(q.x); q.pl.y = Math.round(q.y); q.setDepth(20 + q.pl.y / 10 + (best && q === o ? (best.depth - 20 - best.pl.y / 10) + 0.5 : 0)); });
      BK.audio.sfx('ui', { volume: 0.5 });
      BK.save.persist();
    });
  }
  // the empty rows at the top of a picture, so stacked things touch what is under them
  topPad(o) {
    var key = o.texture.key, f = o.frame, id = key + ':' + f.name;
    BK.castlePad = BK.castlePad || {};
    if (BK.castlePad[id] !== undefined) return BK.castlePad[id];
    var pad = 0;
    try {
      var cv = document.createElement('canvas'); cv.width = f.cutWidth; cv.height = f.cutHeight;
      var cx = cv.getContext('2d'); cx.drawImage(f.source.image, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
      var d = cx.getImageData(0, 0, f.cutWidth, f.cutHeight).data, found = false;
      for (var y = 0; y < f.cutHeight && !found; y++) { for (var x = 0; x < f.cutWidth; x++) if (d[(y * f.cutWidth + x) * 4 + 3] > 20) { found = true; break; } if (!found) pad++; }
      if (!found) pad = 0;
      pad = pad * (f.realHeight ? f.height / f.cutHeight : 1);
    } catch (e) { pad = 0; }
    return (BK.castlePad[id] = pad);
  }
  solidH(o) { return o.height - this.topPad(o); }
  putAway(o) {
    var C = this.C;
    C.placed.splice(C.placed.indexOf(o.pl), 1);
    BK.audio.sfx('poof', { volume: 0.4 });
    BK.save.persist();
    this.drawRoom();
  }
  placedCount(id) { return this.C.placed.filter(function (q) { return q.id === id; }).length; }

  // ------------------------------------------------------------ pickers
  closePicker() { this.picker.forEach(function (o) { o.destroy(); }); this.picker = []; }
  keepP(o) { this.picker.push(o); if (o.zone) this.picker.push(o.zone); return o; }
  panel(title) {
    this.closePicker();
    var s = this;
    this.keepP(this.add.rectangle(0, 0, BK.W, BK.H, 0x000000, 0.35).setOrigin(0, 0).setDepth(400).setInteractive());
    var bx = 32, by = 22, bw = 320, bh = 170;
    this.keepP(BK.ui.nine(this, bx, by, bw, bh, 'ui_panel2').setDepth(401));
    this.keepP(BK.ui.text(this, BK.W / 2, by + 26, title, { outline: false, size: 2, origin: [0.5, 0.5] }).setDepth(402));
    var cb = this.keepP(BK.ui.button(this, BK.W / 2, by + bh - 14, BK.L('Bezár', 'Close'), function () { s.closePicker(); }, { w: 64, h: 16 }));
    cb.setDepth(402); if (cb.zone) cb.zone.setDepth(402);
    return { x: bx, y: by, w: bw, h: bh };
  }
  // the store: what the child has (a click puts one in the room) and what can be bought
  openPropPicker() {
    var s = this, me = BK.state.profile, C = this.C, page = this.propPage || 0;
    var b = this.panel(BK.L('Mit tegyek ki?', 'What shall I put out?'));
    var list = BK.CASTLE_PROPS.slice().sort(function (a, c) { return ((C.inv[c.id] || 0) > 0) - ((C.inv[a.id] || 0) > 0) || a.price - c.price; });
    var PER = 16, pages = Math.ceil(list.length / PER);
    list.slice(page * PER, page * PER + PER).forEach(function (pr, i) {
      var x = b.x + 34 + (i % 8) * 36, y = b.y + 60 + Math.floor(i / 8) * 42;
      var have = C.inv[pr.id] || 0, free = have - s.placedCount(pr.id);
      s.keepP(BK.ui.nine(s, x - 16, y - 18, 32, 38, free > 0 ? 'ui_slot_sel' : 'ui_slot').setDepth(402));
      var key = s.propKey(pr.id);
      var im = s.keepP((pr.sprite ? s.add.sprite(x, y + 6, key, 0) : s.add.image(x, y + 6, key)).setOrigin(0.5, 1).setDepth(403));
      im.setScale(Math.min(1, 24 / im.height, 28 / im.width));
      var label = free > 0 ? BK.L('van ', 'have ') + free : pr.price + (pr.rare ? '+' + pr.rare + '◆' : '');
      s.keepP(BK.ui.text(s, x, y + 11, label, { outline: false, origin: [0.5, 0.5], px: 7, color: free > 0 ? 0x2e7d3e : 0x9a3d1a, bold: true }).setDepth(403));
      var z = s.keepP(s.add.zone(x, y, 32, 38).setInteractive({ useHandCursor: true }).setDepth(404));
      z.on('pointerup', function () { s.takeProp(pr); });
    });
    this.keepP(BK.ui.text(this, b.x + 18, b.y + b.h - 30, BK.L('Zöld: a tiéd, kirakhatod. Ami fogy, újra megveheted.', 'Green: yours to put out. You can buy more of anything.'), { outline: false, px: 8, color: 0x6b3a20 }).setDepth(403));
    if (pages > 1) [[-1, b.x + b.w - 70, '<'], [1, b.x + b.w - 40, '>']].forEach(function (a) {
      var pb = s.keepP(BK.ui.button(s, a[1], b.y + b.h - 14, a[2], function () { s.propPage = (page + a[0] + pages) % pages; s.openPropPicker(); }, { w: 20, h: 16 }));
      pb.setDepth(402); if (pb.zone) pb.zone.setDepth(402);
    });
  }
  takeProp(pr) {
    var me = BK.state.profile, C = this.C;
    if ((C.inv[pr.id] || 0) - this.placedCount(pr.id) <= 0) {
      if (me.coins < pr.price) { this.toast(BK.T.notEnough); return; }
      if (pr.rare && BK.rareCount(me) < pr.rare) { BK.ui.rareHelp(this, pr.rare); return; }
      if (pr.rare) BK.payRares(me, pr.rare);
      me.coins -= pr.price;
      C.inv[pr.id] = (C.inv[pr.id] || 0) + 1;
      if ((C.props || (C.props = [])).indexOf(pr.id) < 0) C.props.push(pr.id);
      BK.audio.sfx('buy');
    } else BK.audio.sfx('ui');
    if (C.placed.length >= 60) { this.toast(BK.L('Ennyi elég is a teremben!', 'That is enough for the room!')); return; }
    // in the middle of what is on screen, on the floor; then the child drags it
    C.placed.push({ id: pr.id, x: Math.round(this.scroll + BK.W / 2 + (Math.random() - 0.5) * 60), y: 186 });
    BK.save.persist();
    this.refreshTop();
    this.closePicker();
    this.drawRoom();
  }
  openFramePicker(slot) {
    var s = this, P = this.P, C = this.C;
    var b = this.panel(BK.L('Mit tegyek a keretbe?', 'What goes in the frame?'));
    var things = [];
    BK.ITEMS.forEach(function (it) { if (P.items[it.id]) things.push(['item', it, 'icons_food']); });
    BK.RECIPES.forEach(function (r) { if (((P.dishes || {})[r.id] || 0) > 0) things.push(['dish', r, 'icons_food']); });
    BK.RARES.forEach(function (r) { if ((P.rares || {})[r.id]) things.push(['rare', r, 'icons_gear']); });
    if (!things.length) this.keepP(BK.ui.text(this, BK.W / 2, b.y + 80, BK.L('Még nincs mit kitenni: gyűjts kincseket!', 'Nothing to show yet: collect treasures!'), { outline: false, origin: [0.5, 0.5], color: 0x9a8a80 }).setDepth(403));
    things.slice(0, 30).forEach(function (t, i) {
      var x = b.x + 30 + (i % 10) * 29, y = b.y + 58 + Math.floor(i / 10) * 30, key = t[0] + ':' + t[1].id;
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

  // ------------------------------------------------------------ guests (other players on this computer)
  openGuests() {
    var s = this, me = BK.state.profile, C = this.C;
    var others = BK.save.profiles().filter(function (q) { return q.id !== me.id; });
    var b = this.panel(BK.L('Kit hívsz meg?', 'Who do you invite?'));
    if (!others.length) this.keepP(BK.ui.text(this, BK.W / 2, b.y + 80, BK.L('Ezen a gépen még nincs más játékos.', 'No other players on this computer yet.'), { outline: false, origin: [0.5, 0.5], color: 0x9a8a80 }).setDepth(403));
    others.slice(0, 12).forEach(function (q, i) {
      var x = b.x + 52 + (i % 4) * 76, y = b.y + 64 + Math.floor(i / 4) * 30, inv = C.guests.indexOf(q.id) >= 0;
      s.keepP(BK.ui.nine(s, x - 34, y - 13, 68, 26, inv ? 'ui_slot_sel' : 'ui_slot').setDepth(402));
      var av = s.keepP(BK.avatarSprite(s, x - 22, y + 11, q.avatar, q).setDepth(403));
      av.setScale(Math.min(1, 22 / av.height));
      s.keepP(BK.ui.text(s, x - 10, y - 5, q.nick, { outline: false, origin: [0, 0.5], px: 8, bold: true, color: 0x4a2c1c, fit: 42 }).setDepth(403));
      s.keepP(BK.ui.text(s, x - 10, y + 5, inv ? BK.L('itt van', 'here') : BK.L('meghívom', 'invite'), { outline: false, origin: [0, 0.5], px: 7, color: inv ? 0x2e7d3e : 0x9a3d1a }).setDepth(403));
      var z = s.keepP(s.add.zone(x, y, 68, 26).setInteractive({ useHandCursor: true }).setDepth(404));
      z.on('pointerup', function () {
        var k = C.guests.indexOf(q.id);
        if (k >= 0) C.guests.splice(k, 1); else { if (C.guests.length >= 3) C.guests.shift(); C.guests.push(q.id); }
        BK.audio.sfx('ui'); BK.save.persist(); s.closePicker(); s.spawnGuests(); s.openGuests();
      });
    });
  }
  spawnGuests() {
    var s = this, C = this.C;
    (this.guestObjs || []).forEach(function (o) { o.destroy(); });
    this.guestObjs = [];
    if (this.visit) return;
    C.guests.map(function (id) { return BK.save.get(id); }).filter(Boolean).forEach(function (q, i) {
      var x = 90 + i * 80 + Math.random() * 30, h = BK.HEROES[q.avatar] || BK.HEROES[0];
      var spr = s.add.sprite(x, 192, BK.outfitKey(h.run, q)).setOrigin(0.5, 1).setDepth(45).play(BK.outfitKey(h.run, q));
      if (spr.height > 40) spr.setScale(40 / spr.height);
      var tag = BK.ui.text(s, x, 192 - spr.displayHeight - 2, q.nick, { origin: [0.5, 1], px: 8, color: 0xffe9a0 }).setDepth(46);
      s.roomC.add([spr, tag]);
      s.guestObjs.push(spr, tag);
      // they wander about
      var walk = function () {
        if (!spr.active) return;
        // they stay mostly on the first screen, near the door, where the child is
        var nx = BK.util.clamp(spr.x + (Math.random() - 0.5) * 140, 40, Math.random() < 0.15 ? BK.CASTLE_W - 40 : 300);
        spr.setFlipX(nx < spr.x ? BK.FACES_LEFT[h.id] !== true : BK.FACES_LEFT[h.id] === true);
        s.tweens.add({ targets: [spr, tag], x: nx, duration: Math.abs(nx - spr.x) * 25 + 300, ease: 'Linear', onComplete: function () { s.time.delayedCall(800 + Math.random() * 2500, walk); } });
      };
      s.time.delayedCall(500 + i * 400, walk);
      spr.setInteractive({ useHandCursor: true }).on('pointerup', function () { if (!s.picker.length) s.chat(q); });
    });
  }
  // friendly ready-made sentences, and the guest's answer
  chat(q) {
    var s = this, me = BK.state.profile;
    var b = this.panel(q.nick);
    var lines = BK.uiLang === 'en'
      ? ['Hi!', 'Look at my castle!', 'Nice sign!', 'What did you cook?', 'Shall we race in the arena?', 'Have a good game!']
      : ['Szia!', 'Nézd a váramat!', 'Szép a jelvényed!', 'Mit főztél?', 'Versenyezzünk az arénában?', 'Jó játékot!'];
    var answers = BK.uiLang === 'en'
      ? ['Hi! Great to be here!', 'Wow, it is so cosy!', 'Thanks! I made it myself.', function () { return Object.keys(q.dishes || {}).length ? 'Mostly ' + (BK.RECIPES.find(function (r) { return q.dishes[r.id]; }) || { name: 'soup' }).name + '!' : 'Nothing yet, I will try!'; }, 'Yes! I have ' + BK.save.totalStars(q) + ' stars already.', 'You too!']
      : ['Szia! De jó itt lenni!', 'Hű, de hangulatos!', 'Köszi! Én raktam össze.', function () { var r = BK.RECIPES.find(function (x) { return (q.dishes || {})[x.id]; }); return r ? 'Legutóbb ' + r.name.toLowerCase() + ' volt!' : 'Még semmit, de kipróbálom!'; }, 'Igen! Már ' + BK.save.totalStars(q) + ' csillagom van.', 'Neked is!'];
    if (q.emblem) this.keepP(BK.emblem.draw(this, b.x + b.w - 40, b.y + 30, q.emblem, 22, { noMask: true }).setDepth(403));
    var said = this.keepP(BK.ui.text(this, BK.W / 2, b.y + 48, BK.L('Mit mondasz?', 'What do you say?'), { outline: false, origin: [0.5, 0.5], px: 9, color: 0x6b3a20 }).setDepth(403));
    lines.forEach(function (l, i) {
      var x = b.x + 86 + (i % 2) * 148, y = b.y + 72 + Math.floor(i / 2) * 22;
      var bt = s.keepP(BK.ui.button(s, x, y, l, function () {
        var a = answers[i]; a = typeof a === 'function' ? a() : a;
        said.setText(me.nick + ': ' + l + '\n' + q.nick + ': ' + a);
        BK.audio.blip(500 + Math.random() * 200, { len: 0.06 });
      }, { w: 140, h: 18 }));
      bt.setDepth(402); if (bt.zone) bt.zone.setDepth(402);
    });
    var vb = this.keepP(BK.ui.button(this, b.x + 60, b.y + b.h - 14, BK.L('Meglátogatom', 'Visit them'), function () { BK.save.persist(); s.scene.start('Castle', { owner: q.id }); }, { w: 80, h: 16 }));
    vb.setDepth(402); if (vb.zone) vb.zone.setDepth(402);
  }
};
