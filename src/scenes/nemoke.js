/*
 * NEM OKÉ: the chapter list of the Forest School story (data/nemoke.js), opened from the map when
 * the teacher has switched it on. Chapters open one after the other; a finished chapter's
 * Fontos! (Important!) card can be read again here. Stars live in profile.nemoke.
 */
BK.NemokeScene = class extends Phaser.Scene {
  constructor() { super('Nemoke'); }

  init(data) { this.sel0 = data && data.sel !== undefined ? data.sel : null; }

  create() {
    var s = this, P = this.P = BK.state.profile;
    var story = this.story = BK.NEMOKE_STORY[BK.uiLang === 'en' ? 'en' : 'hu'];
    BK.menuBackground(this, 1, { groundY: 200, fixed: true });
    BK.audio.music('m_chill');
    BK.ui.nine(this, 16, 4, 352, 182, 'ui_panel2');
    BK.ui.text(this, 192, 33, story.title, { outline: false, size: 2, origin: [0.5, 0.5], color: 0x2e6a3e, fit: 320 });
    BK.ui.text(this, 34, 44, story.intro, { outline: false, width: 316, px: 9, color: 0x4a2c1c });
    var nm = P.nemoke || { stars: [0, 0, 0, 0, 0] };
    this.stars = nm.stars;
    var open = BK.REGIONS.filter(function (r) { return r.playable && BK.save.regionOpen(P, r.id); });
    // at least region 3 (every lower-case letter), so the kind words fit even for beginners
    this.region = Math.max(3, open.length ? open[open.length - 1].id : 1);
    this.sel = this.sel0 !== null ? this.sel0 : Math.max(0, this.stars.findIndex(function (v) { return !v; }));
    if (this.sel < 0 || !this.unlocked(this.sel)) this.sel = 0;
    this.page = [];
    this.draw();
    BK.ui.button(this, 78, 196, BK.T.back, function () { s.scene.start('Map', {}); }, { w: 70, h: 18, key: 'ESC' });
    this.cardBtn = BK.ui.button(this, 192, 196, BK.L('Kártya', 'Card'), function () { s.showCard(s.sel); }, { w: 70, h: 18 });
    this.startBtn = BK.ui.button(this, 306, 196, BK.T.pStart, function () { s.go(); }, { w: 96, h: 18, key: 'ENTER' });
    this.input.keyboard.on('keydown', function (e) {
      if (s.cardObjs) { if (e.key === 'Escape' || e.key === 'Enter') s.closeCard(); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') s.move(e.key === 'ArrowUp' ? -1 : 1);
      else if (/^[1-5]$/.test(e.key)) s.pick(+e.key - 1);
    });
    this.refresh();
  }

  unlocked(i) { return i === 0 || (this.stars[i - 1] || 0) > 0; }

  draw() {
    var s = this, story = this.story;
    this.page.forEach(function (o) { o.destroy(); });
    this.page = [];
    var keep = function (o) { s.page.push(o); return o; };
    story.chapters.forEach(function (ch, i) {
      var y = 80 + i * 14, ok = s.unlocked(i);
      if (i === s.sel) keep(s.add.rectangle(192, y + 5, 318, 13, 0xbfe3a8, 0.85));
      keep(BK.ui.text(s, 38, y, (i + 1) + '. ' + ch.name, { outline: false, bold: i === s.sel, color: ok ? 0x4a2c1c : 0x9a8a80 }));
      if (ok) keep(BK.ui.stars(s, 326, y + 5, s.stars[i] || 0, 3, 10));
      else keep(BK.ui.text(s, 340, y, BK.L('előbb az előző', 'finish the one before'), { outline: false, origin: [1, 0], px: 9, color: 0x9a8a80 }));
      // the chapter's card, once it is earned
      if (s.stars[i]) keep(BK_MANIFEST.sprites.nm_icons_set ? s.add.image(298, y + 5, 'nm_icons_set', i).setScale(0.45) : s.add.image(298, y + 5, 'icons_food', 202).setScale(0.55));
      var z = keep(s.add.zone(192, y + 5, 318, 13).setInteractive({ useHandCursor: true }));
      z.on('pointerup', function () { if (s.sel === i) s.go(); else s.pick(i); });
    });
    var got = this.stars.filter(Boolean).length;
    keep(BK.ui.text(this, 192, 156, BK.L('Fontos! kártyák: ', 'Important! cards: ') + got + ' / 5' +
      (this.stars[this.sel] ? '  ·  ' + story.chapters[this.sel].card : ''), { outline: false, origin: [0.5, 0.5], px: 9, color: 0x2e6a3e }));
    this.refresh();
  }

  refresh() {
    if (this.startBtn) this.startBtn.setDisabled(!this.unlocked(this.sel));
    if (this.cardBtn) this.cardBtn.setDisabled(!this.stars[this.sel]);
  }

  pick(i) { if (i === this.sel) return; this.sel = i; BK.audio.sfx('ui'); this.draw(); }
  move(d) { var n = this.sel + d; if (n < 0 || n > 4) return; this.pick(n); }

  go() {
    if (!this.unlocked(this.sel)) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
    BK.audio.sfx('chime');
    this.scene.start('Level', { region: this.region, level: 'nemoke', stage: this.sel });
  }

  showCard(i) {
    if (!this.stars[i]) return;
    var s = this;
    this.cardObjs = BK.nemokeCard(this, i, function () { s.cardObjs = null; });
  }
  closeCard() { if (this.cardObjs) this.cardObjs.close(); }
};

/*
 * The Fontos! / Important! card of a chapter: the lesson, highlighted. Used at the end of a
 * chapter and on the chapter list. Returns { close }.
 */
BK.nemokeCard = function (scene, i, onClose, opts) {
  opts = opts || {};
  var st = BK.NEMOKE_STORY[BK.uiLang === 'en' ? 'en' : 'hu'], ch = st.chapters[i], objs = [], D = 950;
  var keep = function (o) { if (o.setDepth) o.setDepth(D + objs.length * 0.01); objs.push(o); return o; };
  keep(scene.add.rectangle(BK.W / 2, BK.H / 2, BK.W, BK.H, 0x000000, 0.45).setInteractive());
  keep(BK.ui.nine(scene, 30, 10, BK.W - 60, 172, 'ui_panel2'));
  // a ribbon with FONTOS!
  var g = keep(scene.add.graphics());
  g.fillStyle(0xd83c3c, 1).fillRoundedRect(BK.W / 2 - 54, 24, 108, 20, 4);
  g.fillStyle(0xffffff, 0.25).fillRect(BK.W / 2 - 52, 26, 104, 4);
  var big = keep(BK.ui.text(scene, BK.W / 2, 34, BK.L('FONTOS!', 'IMPORTANT!'), { outline: false, origin: [0.5, 0.5], size: 2, color: 0xffffff, bold: true }));
  scene.tweens.add({ targets: big, scale: { from: 1.25, to: 1 }, duration: 380, ease: 'Back.easeOut' });
  if (BK_MANIFEST.sprites.nm_icons_set) {
    var ic = keep(scene.add.image(66, 40, 'nm_icons_set', i).setScale(0.9));
    scene.tweens.add({ targets: ic, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  keep(BK.ui.text(scene, BK.W / 2, 56, (i + 1) + '. ' + ch.card, { outline: false, origin: [0.5, 0.5], bold: true, color: 0x2e6a3e, fit: BK.W - 100 }));
  keep(BK.ui.text(scene, 54, 66, ch.lesson, { outline: false, width: BK.W - 108, px: 9, color: 0x4a2c1c }));
  if (opts.got) keep(BK.ui.text(scene, BK.W / 2, 152, st.cardGot + ': ' + (i + 1) + ' / 5', { outline: false, origin: [0.5, 0.5], px: 8, color: 0x9a3d1a }));
  // the lesson read aloud: at once at the end of a chapter, on the speaker button on the list
  if (BK.voice.has(ch.lesson)) {
    var spk = keep(BK.ui.button(scene, BK.W - 56, 34, '🔊', function () { BK.voice.say(ch.lesson); }, { w: 22, h: 18 }));
    if (spk.zone) { spk.zone.setDepth(D + 1); objs.push(spk.zone); }
    if (opts.got) scene.time.delayedCall(600, function () { if (!closed) BK.voice.say(ch.lesson); });
  }
  var closed = false;
  var close = function () {
    if (closed) return; closed = true;
    BK.voice.stop();
    objs.forEach(function (o) { if (o.active) o.destroy(); });
    if (onClose) onClose();
  };
  var b = BK.ui.button(scene, BK.W / 2, 168, opts.label || BK.L('Rendben (Enter)', 'Okay (Enter)'), close, { w: 96, h: 18, key: 'ENTER' });
  keep(b); if (b.zone) { b.zone.setDepth(D + 1); objs.push(b.zone); }
  BK.audio.sfx('level_up', { volume: 0.4 });
  return { close: close };
};
