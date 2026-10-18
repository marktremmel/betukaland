/*
 * Halloween Night: a friendly spooky mini-adventure, opened from the map when
 * the teacher has switched it on (Teacher screen). Four stages in order, each
 * a level on the night road with the keys of the child's newest region; the
 * last one has the Pumpkin King, who gives a pet when he smiles.
 * Stars live in profile.halloween on this computer (not in the save code).
 */
BK.HalloweenScene = class extends Phaser.Scene {
  constructor() { super('Halloween'); }

  init(data) { this.sel0 = data && data.sel !== undefined ? data.sel : null; }

  create() {
    var s = this, P = this.P = BK.state.profile;
    var story = this.story = BK.HALLOWEEN_STORY[BK.uiLang === 'en' ? 'en' : 'hu'];
    BK.menuBackground(this, 3, { groundY: 200 });
    BK.audio.music('m_moon');
    BK.ui.nine(this, 16, 4, 352, 182, 'ui_panel2');
    BK.ui.text(this, 192, 32, story.title, { outline: false, size: 2, origin: [0.5, 0.5], color: 0x6a2a8a });
    BK.ui.text(this, 34, 44, story.intro, { outline: false, width: 316, px: 9, color: 0x4a2c1c });
    var hw = P.halloween || { stars: [0, 0, 0, 0] };
    this.stars = hw.stars;
    var open = BK.REGIONS.filter(function (r) { return r.playable && BK.save.regionOpen(P, r.id); });
    this.region = open.length ? open[open.length - 1].id : 1;
    // first stage without a star, or the one asked for
    this.sel = this.sel0 !== null ? this.sel0 : Math.max(0, this.stars.findIndex(function (v) { return !v; }));
    if (this.sel < 0 || !this.unlocked(this.sel)) this.sel = 0;
    this.page = [];
    this.draw();
    BK.ui.button(this, 112, 196, BK.T.back, function () { s.scene.start('Map'); }, { w: 70, h: 18, key: 'ESC' });
    this.startBtn = BK.ui.button(this, 272, 196, BK.T.pStart, function () { s.go(); }, { w: 96, h: 18, key: 'ENTER' });
    this.input.keyboard.on('keydown', function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') s.move(e.key === 'ArrowUp' ? -1 : 1);
      else if (/^[1-4]$/.test(e.key)) s.pick(+e.key - 1);
    });
  }

  unlocked(i) { return i === 0 || (this.stars[i - 1] || 0) > 0; }

  draw() {
    var s = this, en = BK.uiLang === 'en';
    this.page.forEach(function (o) { o.destroy(); });
    this.page = [];
    var keep = function (o) { s.page.push(o); return o; };
    BK.HALLOWEEN.stages.forEach(function (st, i) {
      var y = 70 + i * 17, ok = s.unlocked(i);
      if (i === s.sel) keep(s.add.rectangle(192, y + 5, 318, 16, 0xf6c88a, 0.8));
      keep(BK.ui.text(s, 38, y, (i + 1) + '. ' + (en ? st.en : st.name) + (i === 3 ? '  (' + BK.T.boss + ')' : ''),
        { outline: false, bold: i === s.sel, color: ok ? 0x4a2c1c : 0x9a8a80 }));
      if (ok) keep(BK.ui.stars(s, 330, y + 5, s.stars[i] || 0, 3, 10));
      else keep(BK.ui.text(s, 346, y, BK.L('előbb az előző', 'finish the one before'), { outline: false, origin: [1, 0], px: 9, color: 0x9a8a80 }));
      var z = keep(s.add.zone(192, y + 5, 318, 16).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () { if (s.sel === i) s.go(); else s.pick(i); });
    });
    keep(BK.ui.text(this, 192, 154, this.story.stages[this.sel], { outline: false, origin: [0.5, 0.5], width: 316, align: 1, px: 9, color: 0x6a2a8a }));
    if (this.startBtn) this.startBtn.setDisabled(!this.unlocked(this.sel));
  }

  pick(i) {
    if (i === this.sel) return;
    this.sel = i;
    BK.audio.sfx('ui');
    this.draw();
  }

  move(d) {
    var n = this.sel + d;
    if (n < 0 || n > 3) return;
    this.pick(n);
  }

  go() {
    if (!this.unlocked(this.sel)) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
    BK.audio.sfx('chime');
    this.scene.start('Level', { region: this.region, level: 'halloween', stage: this.sel });
  }
};
