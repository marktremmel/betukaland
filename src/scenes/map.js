/*
 * World map: seven regions on a path. Cleared regions light up, the path
 * fills in, and the panel below lists the selected region's levels.
 * Keyboard: <- -> region, 1-4 level, Enter play.
 */
BK.MapScene = class extends Phaser.Scene {
  constructor() { super('Map'); }

  create() {
    var s = this, P = this.P = BK.state.profile;
    if (!P) { this.scene.start('Profiles'); return; }
    BK.menuBackground(this, 5, { groundY: 118 });
    BK.audio.apply(P.settings);
    BK.audio.music(BK.MUSIC.map);
    this.sel = BK.save.currentRegion(P);
    if (!BK.REGIONS[this.sel - 1].playable) this.sel = 1;
    this.levelSel = this.firstOpenLevel(this.sel);
    this.drawTop();
    this.drawPath();
    this.panelUi = [];
    this.drawPanel();
    this.drawMenu();
    this.input.keyboard.on('keydown', function (e) {
      if (e.key === 'ArrowRight') s.select(Math.min(7, s.sel + 1));
      else if (e.key === 'ArrowLeft') s.select(Math.max(1, s.sel - 1));
      else if (/^[1-4]$/.test(e.key)) { s.levelSel = +e.key - 1; s.drawPanel(); }
      else if (e.key === 'Enter') s.play(s.sel, s.levelSel);
    });
  }

  firstOpenLevel(r) {
    var P = this.P, pr = P.progress[r];
    for (var l = 0; l < 4; l++) if (BK.save.levelUnlocked(P, r, l) && !pr.stars[l]) return l;
    for (l = 3; l >= 0; l--) if (BK.save.levelUnlocked(P, r, l)) return l;
    return 0;
  }

  drawTop() {
    var P = this.P;
    this.add.rectangle(0, 0, BK.W, 18, 0x2b1a14, 0.55).setOrigin(0, 0);
    var av = BK.avatarSprite(this, 12, 17, P.avatar, P); av.setScale(0.5);
    BK.ui.text(this, 24, 3, P.nick, { color: 0xfff2dc });
    this.add.sprite(150, 9, 'coin').play('coin');
    this.coinText = BK.ui.text(this, 160, 3, String(P.coins), { color: 0xffe9a0 });
    this.add.image(206, 9, 'star_on');
    BK.ui.text(this, 214, 3, String(BK.save.totalStars(P)), { color: 0xffe9a0 });
    if (P.best.wpm) BK.ui.text(this, BK.W - 6, 3, 'Rekord: ' + Math.round(P.best.wpm) + ' ' + BK.T.wpm, { origin: [1, 0], color: 0xfff2dc });
  }

  drawPath() {
    var s = this, P = this.P;
    var pts = [[30, 92], [80, 66], [132, 92], [184, 62], [236, 90], [290, 60], [346, 84]];
    this.pts = pts;
    var icons = ['frog_walk', 'crab_walk', 'starfish_idle', 'gull_fly', 'toad_idle', 'octopus_idle', 'dragon_fly'];
    var g = this.add.graphics();
    for (var i = 0; i < pts.length - 1; i++) {
      var cleared = BK.save.regionCleared(P, i + 1);
      for (var t = 0; t <= 1; t += 0.12) {
        var x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
        g.fillStyle(cleared ? 0xffd23c : 0xfff2dc, cleared ? 1 : 0.6).fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
    }
    this.nodes = [];
    BK.REGIONS.forEach(function (reg, i) {
      var open = BK.save.regionOpen(P, reg.id), cleared = BK.save.regionCleared(P, reg.id);
      var x = pts[i][0], y = pts[i][1];
      var slot = BK.ui.nine(s, x - 16, y - 16, 32, 32, !open ? 'ui_slot_off' : (cleared ? 'ui_slot_sel' : 'ui_slot'));
      var ic = s.add.sprite(x, y + 12, icons[i], 0).setOrigin(0.5, 1);
      var maxH = 26, sc = Math.min(1, maxH / ic.height, 28 / ic.width);
      // keep whole-pixel scaling for small sprites; big ones are shrunk to fit the node
      ic.setScale(sc >= 1 ? 1 : (sc >= 0.5 ? 0.5 : 0.25));
      if (!open) ic.setTint(0x403838);
      else if (!cleared) ic.setTint(0xd8d0c8);
      var num = BK.ui.text(s, x - 13, y - 15, String(reg.id), { color: cleared ? 0xffd23c : 0xffffff });
      if (cleared) s.add.image(x + 12, y - 12, 'star_on');
      var z = s.add.zone(x, y, 34, 34).setInteractive({ useHandCursor: true });
      z.on('pointerup', function () { s.select(reg.id); });
      s.nodes.push({ slot: slot, x: x, y: y });
    });
    this.selMark = this.add.rectangle(0, 0, 36, 36).setStrokeStyle(2, 0xffffff);
    this.tweens.add({ targets: this.selMark, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    this.placeSel();
  }

  placeSel() { var n = this.nodes[this.sel - 1]; this.selMark.setPosition(n.x, n.y); }

  select(r) {
    if (r === this.sel) return;
    BK.audio.sfx('ui');
    this.sel = r;
    this.levelSel = this.firstOpenLevel(r);
    this.placeSel();
    this.drawPanel();
  }

  drawPanel() {
    var s = this, P = this.P, reg = BK.REGIONS[this.sel - 1];
    this.panelUi.forEach(function (o) { o.destroy(); });
    var ui = this.panelUi = [];
    var keep = function (o) { ui.push(o); if (o.zone) ui.push(o.zone); return o; };
    keep(BK.ui.nine(this, 4, 122, 246, 90, 'ui_panel'));
    keep(BK.ui.text(this, 127, 126, this.sel + '. ' + reg.name, { origin: [0.5, 0], color: 0xfff2dc }));
    var keys = reg.capitals ? 'nagybetűk (Shift)' : (reg.stories ? 'mondatok, történetek' : reg.keys.split('').join(' '));
    keep(BK.ui.text(this, 127, 150, BK.T.newKeys + ' ' + keys, { outline: false, origin: [0.5, 0.5], color: 0xfff2dc }));
    if (!BK.save.regionOpen(P, this.sel) || !reg.playable) {
      keep(BK.ui.text(this, 127, 180, reg.playable ? 'Előbb győzd le az előző vidék főellenségét!' : BK.T.regionLocked,
        { outline: false, origin: [0.5, 0.5], color: 0xffe9c8, width: 220, align: 1 }));
      return;
    }
    var labels = ['1', '2', '3', 'Főnök'];
    for (var l = 0; l < 4; l++) {
      (function (l) {
        var x = 38 + l * 60, y = 176;
        var unlocked = BK.save.levelUnlocked(P, s.sel, l);
        var b = keep(BK.ui.button(s, x, y, (l + 1) + ': ' + labels[l].replace(/^\d$/, BK.T.level), function () { s.play(s.sel, l); },
          { w: l === 3 ? 62 : 54, h: 18, disabled: !unlocked }));
        if (l === s.levelSel) keep(s.add.rectangle(x, y, (l === 3 ? 62 : 54) + 4, 22).setStrokeStyle(1, 0xffffff));
        keep(BK.ui.stars(s, x, 196, P.progress[s.sel].stars[l], 3, 10));
      })(l);
    }
  }

  drawMenu() {
    var s = this, P = this.P;
    var items = [
      [BK.T.practice, function () { BK.audio.sfx('chime'); s.scene.start('Practice'); }],
      [BK.T.shop, function () { s.openOverlay('Shop'); }],
      [BK.T.bag, function () { s.openOverlay('Bag'); }],
      [BK.T.settings, function () { s.openOverlay('Settings'); }],
      [BK.T.saveCode, function () { BK.SaveCodeUI.open(P, function () { s.scene.restart(); }); }],
      [BK.T.switchPlayer, function () { s.scene.start('Profiles'); }],
    ];
    items.forEach(function (it, i) {
      var x = 286 + (i % 2) * 64, y = 140 + Math.floor(i / 2) * 24;
      var b = BK.ui.button(s, x, y, it[0], it[1], { w: 62, h: 20 });
    });
  }

  openOverlay(name) {
    var s = this;
    this.scene.launch(name, { from: 'Map', onClose: function () { s.scene.restart(); } });
    this.scene.pause();
  }

  play(r, l) {
    var P = this.P;
    if (l === 'daily') {
      var r2 = 1;   // the daily challenge uses the highest playable open region
      BK.REGIONS.forEach(function (reg) { if (reg.playable && BK.save.regionOpen(P, reg.id)) r2 = reg.id; });
      BK.audio.sfx('chime');
      this.scene.start('Level', { region: r2, level: 'daily', seed: BK.util.hash('daily:' + BK.util.today()) });
      return;
    }
    if (!BK.REGIONS[r - 1].playable || !BK.save.levelUnlocked(P, r, l)) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
    BK.audio.sfx('chime');
    this.scene.start('Level', { region: r, level: l });
  }
};
