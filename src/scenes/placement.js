/*
 * Placement test (first play only, about 2 minutes, stops early).
 * Stages follow the regions: home row, top row, bottom row, capitals,
 * accents, numbers. The child starts in the first region they cannot pass
 * at 90% accuracy (and a gentle minimum speed). Earlier regions open up.
 */
BK.PlacementScene = class extends Phaser.Scene {
  constructor() { super('Placement'); }

  create() {
    var s = this;
    this.P = BK.state.profile;
    BK.menuBackground(this, 2, { groundY: BK.KB_TOP - 4 });
    BK.audio.music(BK.MUSIC.test);
    this.kb = new BK.KeyboardView(this, { allowed: {}, fingers: true });
    this.stage = 0;
    this.items = [];
    this.ui = [];
    this.keyHandler = function (e) { s.onKey(e); };
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', function () { window.removeEventListener('keydown', s.keyHandler); });
    this.showIntro();
  }

  clear() { this.ui.forEach(function (o) { o.destroy(); }); this.ui = []; }
  keep(o) { this.ui.push(o); if (o.zone) this.ui.push(o.zone); return o; }

  showIntro() {
    var s = this;
    this.mode = 'intro';
    this.clear();
    this.keep(BK.ui.nine(this, 62, 14, 260, 126, 'ui_panel2'));
    this.keep(BK.ui.text(this, 192, 44, BK.T.placeTitle, { outline: false, size: 2, origin: [0.5, 0.5] }));
    this.keep(BK.ui.text(this, 192, 72, BK.T.placeIntro, { outline: false, origin: [0.5, 0.5], width: 220, align: 1 }));
    this.keep(BK.ui.button(this, 140, 104, BK.T.start + ' (Enter)', function () { s.startStage(0); }, { w: 96 }));
    this.keep(BK.ui.button(this, 248, 104, BK.L('Kihagyom', 'Skip'), function () { s.finish(1); }, { w: 80 }));
  }

  startStage(i) {
    var rng = BK.util.rng(Date.now());
    var lang = this.P.lang;
    this.stage = i;
    // English word lists have no accents: that stage is skipped for English
    // (also skipped on a keyboard without accent keys)
    if ((lang === 'en' || !BK.layout.accents) && BK.REGIONS[i].keys.indexOf('á') >= 0) { this.startStage(i + 1); return; }
    if (i >= 6) { this.finish(7); return; }
    this.items = BK.wordbank.placementWords(i + 1, lang, 5, rng);
    if (!this.items.length) { this.startStage(i + 1); return; }
    this.itemI = 0;
    this.st = { correct: 0, wrong: 0, chars: 0, ms: 0, last: 0 };
    this.kb.setAllowed(BK.wordbank.allowed(i + 1));
    this.clear();
    this.mode = 'type';
    this.keep(BK.ui.text(this, 192, 14, BK.T.placeTitle + ': ' + BK.T.placeStage[i] + '  (' + (i + 1) + '/6)', { origin: [0.5, 0.5], color: 0xfff2dc }));
    this.dots = [];
    for (var d = 0; d < this.items.length; d++) this.dots.push(this.keep(this.add.circle(192 + (d - 2) * 10, 28, 3, 0xffffff, 0.4)));
    this.showItem();
  }

  showItem() {
    if (this.bubble) this.bubble.destroy(false);
    this.bubble = new BK.WordBubble(this, this.items[this.itemI], 192, 100, {});
    this.kb.setNext(this.bubble.next);
    this.st.last = 0;
    this.shownAt = performance.now();
  }

  onKey(e) {
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return;
    if (this.mode === 'intro') { if (e.key === 'Enter') this.startStage(0); return; }
    if (this.mode === 'result') { if (e.key === 'Enter') this.goMap(); return; }
    if (this.mode !== 'type' || !e.key || e.key.length !== 1) return;
    e.preventDefault();
    var ch = BK.util.norm(e.key), now = performance.now();
    var gap = this.st.last ? now - this.st.last : Math.min(now - this.shownAt, 1500);
    this.st.ms += Math.min(gap, 3000);
    this.st.last = now;
    var expected = this.bubble.next;
    var ok = this.bubble.type(ch);
    BK.adaptive.record(this.P, expected, ok, 0);
    if (!ok) { this.st.wrong++; BK.audio.sfx('key_bad', { volume: 0.25 }); this.kb.flashWrong(ch); return; }
    this.st.correct++; this.st.chars++;
    BK.audio.sfx('key_ok', { volume: 0.35 });
    if (!this.bubble.done) { this.kb.setNext(this.bubble.next); return; }
    this.dots[this.itemI].setFillStyle(0x8ee07a, 1);
    this.itemI++;
    BK.audio.sfx('word_done', { volume: 0.4 });
    if (this.itemI < this.items.length) { this.bubble.destroy(true); this.bubble = null; this.showItem(); return; }
    this.bubble.destroy(true); this.bubble = null;
    this.endStage();
  }

  endStage() {
    var st = this.st, P = this.P;
    var acc = st.correct / Math.max(1, st.correct + st.wrong);
    var wpm = BK.util.wpm(st.chars, st.ms);
    var pass = acc >= BK.PLACEMENT_ACC && wpm >= (BK.PLACEMENT_WPM[P.grade] || 5);
    var s = this;
    if (pass) {
      BK.ui.toast(this, 192, 70, BK.pick(BK.T.praise), 0xffd23c, 2);
      this.mode = 'wait';
      this.time.delayedCall(800, function () { s.startStage(s.stage + 1); });
    } else {
      this.finish(this.stage + 1);
    }
  }

  finish(region) {
    var P = this.P, s = this;
    P.placed = Math.min(7, region);
    BK.save.persist();
    this.clear();
    if (this.bubble) { this.bubble.destroy(false); this.bubble = null; }
    this.kb.setNext(null);
    this.mode = 'result';
    BK.audio.sfx('level_up');
    this.keep(BK.ui.nine(this, 62, 12, 260, 128, 'ui_panel2'));
    this.keep(BK.ui.text(this, 192, 42, region >= 7 ? BK.T.placeAllDone : BK.T.placeDone, { outline: false, origin: [0.5, 0.5], width: 210, align: 1 }));
    var reg = BK.REGIONS[Math.min(7, region) - 1];
    this.keep(BK.ui.text(this, 192, 60, region + '. ' + reg.name, { outline: false, size: 2, origin: [0.5, 0.5], color: 0x9a3d1a }));
    if (!reg.playable) {
      this.keep(BK.ui.text(this, 192, 80, BK.L('Ez a vidék még épül. Addig gyakorolj a Napos réten!', 'This region is still being built. Practise in the Sunny Meadow until then!'), { outline: false, origin: [0.5, 0.5], width: 220, align: 1, color: 0x6b3a20 }));
    }
    this.keep(BK.ui.button(this, 192, 104, BK.T.map + ' (Enter)', function () { s.goMap(); }, { w: 96 }));
  }

  goMap() { this.scene.start('Map'); }
};
