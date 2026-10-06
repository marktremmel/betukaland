/*
 * Practice corner (Gyakorlás), opened from the map.
 *   1 Ma          - today's three goals, the streak, and the daily challenge
 *   2 Gyakorlás   - three modes on any open region: short sentences, the
 *                   child's tricky letters, and the endless road
 *   3 Történetek  - the storybook: everyday stories typed sentence by sentence
 * Keys: 1/2/3 switch tabs, arrows choose, Enter starts, Esc goes back.
 */
BK.PracticeScene = class extends Phaser.Scene {
  constructor() { super('Practice'); }

  init(data) {
    this.tab = (data && data.tab) || this.tab || 'today';
    if (this.tab === 'sent' || this.tab === 'daily') this.tab = this.tab === 'daily' ? 'today' : 'practice';
    if (data && data.mode) this.mode = data.mode;
    this.mode = this.mode || 'sent';
  }

  create() {
    var s = this, P = this.P = BK.state.profile;
    BK.menuBackground(this, 3, { groundY: 200 });
    BK.audio.music(BK.MUSIC.map);
    BK.ui.nine(this, 16, 4, 352, 182, 'ui_panel2');
    BK.ui.text(this, 192, 34, BK.T.practiceTitle, { outline: false, size: 2, origin: [0.5, 0.5] });

    this.open = BK.REGIONS.filter(function (r) { return r.playable && BK.save.regionOpen(P, r.id); }).map(function (r) { return r.id; });
    if (this.sentRegion === undefined || this.open.indexOf(this.sentRegion) < 0) this.sentRegion = this.open[this.open.length - 1] || 1;
    this.stories = BK.wordbank.storyLibrary(P.lang || 'hu');
    // open stories first, in the order they unlock
    this.stories.sort(function (a, b) { return a.region - b.region; });
    if (this.storySel === undefined) {
      this.storySel = 0;
      for (var i = 0; i < this.stories.length; i++) if (this.storyOpen(this.stories[i]) && !(P.stories || {})[this.stories[i].id]) { this.storySel = i; break; }
    }
    this.storyTop = this.storyTop || 0;

    var tabs = [['today', BK.T.pToday], ['practice', BK.T.pPractice], ['story', BK.T.pStory]];
    tabs.forEach(function (t, i) {
      var b = BK.ui.button(s, 92 + i * 100, 52, t[1], function () { s.setTab(t[0]); }, { w: 94, h: 18 });
      if (t[0] === s.tab) s.add.rectangle(92 + i * 100, 52, 98, 22).setStrokeStyle(1, 0x9a3d1a);
    });

    this.page = [];
    this.drawTab();

    BK.ui.button(this, 112, 196, BK.T.back, function () { s.scene.start('Map'); }, { w: 70, h: 18, key: 'ESC' });
    this.startBtn = BK.ui.button(this, 272, 196, BK.T.pStart, function () { s.go(); }, { w: 96, h: 18, key: 'ENTER' });
    this.refreshStart();
    if (this.tab === 'today') this.startBtn.label.setText(BK.T.playDaily);

    this.input.keyboard.on('keydown', function (e) {
      if (e.key === '1') s.setTab('today');
      else if (e.key === '2') s.setTab('practice');
      else if (e.key === '3') s.setTab('story');
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') s.move(e.key === 'ArrowLeft' ? -1 : 1, 'h');
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') s.move(e.key === 'ArrowUp' ? -1 : 1, 'v');
    });
  }

  storyOpen(st) { return BK.save.regionOpen(this.P, st.region); }

  setTab(t) {
    if (t === this.tab) return;
    BK.audio.sfx('ui');
    this.scene.restart({ tab: t });
  }

  keep(o) { this.page.push(o); return o; }

  drawTab() {
    var s = this, P = this.P;
    this.page.forEach(function (o) { if (o.destroyAll) o.destroyAll(); else o.destroy(); });
    this.page = [];
    var x0 = 34, y0 = 68;

    if (this.tab === 'today') {
      var G = BK.goals.today(P), sd = BK.goals.streak(P);
      this.keep(this.add.image(x0 + 5, y0 + 6, sd ? 'flame' : 'flame_off'));
      this.keep(BK.ui.text(this, x0 + 14, y0 + 6, sd > 1 ? BK.T.streakN.replace('{n}', sd) : sd === 1 ? BK.T.streak1 : BK.T.streak0, { outline: false, origin: [0, 0.5], bold: true, color: 0x9a3d1a }));
      if (P.streak && P.streak.best > 1) this.keep(BK.ui.text(this, 346, y0 + 6, BK.T.streakBest.replace('{n}', P.streak.best), { outline: false, origin: [1, 0.5], px: 9, color: 0x9a8a80 }));
      this.keep(BK.ui.text(this, x0, y0 + 22, BK.T.goalsTitle, { outline: false, origin: [0, 0.5], bold: true }));
      G.list.forEach(function (g, i) {
        var y = y0 + 37 + i * 14;
        if (g.done) s.keep(s.add.image(x0 + 5, y, 'ui_check'));
        else s.keep(s.add.rectangle(x0 + 5, y, 8, 8).setStrokeStyle(1, 0x9a6446));
        s.keep(BK.ui.text(s, x0 + 14, y, BK.goals.text(g), { outline: false, origin: [0, 0.5], color: g.done ? 0x6b8a50 : 0x4a2c1c }));
        s.keep(BK.ui.text(s, 300, y, g.done ? '+' + BK.goals.GOAL_COINS : g.have + '/' + g.n, { outline: false, origin: [1, 0.5], color: 0x9a3d1a }));
        s.keep(s.add.sprite(312, y, 'coin').setScale(0.75));
      });
      var allDone = G.bonus;
      this.keep(BK.ui.text(this, x0 + 14, y0 + 79, allDone ? BK.T.goalsAll.replace('{n}', BK.goals.BONUS) : BK.L('Mind a három: +', 'All three: +') + BK.goals.BONUS + BK.L(' bónusz', ' bonus'),
        { outline: false, origin: [0, 0.5], px: 9, color: 0x6b3a20 }));
    }

    if (this.tab === 'practice') {
      var reg = BK.REGIONS[this.sentRegion - 1];
      this.keep(BK.ui.text(this, 192, y0 + 4, '<  ' + this.sentRegion + '. ' + reg.name + '  >', { outline: false, origin: [0.5, 0.5], bold: true, color: 0x9a3d1a }));
      var zl = this.keep(this.add.zone(110, y0 + 4, 90, 16).setInteractive({ useHandCursor: true }));
      zl.on('pointerup', function () { s.move(-1, 'h'); });
      var zr = this.keep(this.add.zone(274, y0 + 4, 90, 16).setInteractive({ useHandCursor: true }));
      zr.on('pointerup', function () { s.move(1, 'h'); });
      var wk = this.weakPreview();
      var modes = [
        ['sent', BK.L('Mondatok', 'Sentences'), BK.T.modeSentText],
        ['weak', BK.T.weak, wk.length >= 2 ? BK.T.modeWeakText + '  ' + wk.join(' ') : BK.T.modeWeakNone],
        ['endless', BK.T.endless, BK.T.modeEndlessText.replace('{n}', (P.best && P.best.endless) || 0)],
      ];
      modes.forEach(function (m, i) {
        var y = y0 + 16 + i * 25;
        if (m[0] === s.mode) s.keep(s.add.rectangle(192, y + 11, 318, 24, 0xf6c88a, 0.8));
        s.keep(BK.ui.text(s, x0 + 4, y + 1, m[1], { outline: false, bold: true }));
        s.keep(BK.ui.text(s, x0 + 4, y + 13, m[2], { outline: false, px: 9, color: 0x6b3a20 }));
        var z = s.keep(s.add.zone(192, y + 11, 318, 24).setInteractive({ useHandCursor: true }));
        z.on('pointerup', function () {
          if (s.mode === m[0]) { s.go(); return; }
          s.mode = m[0]; BK.audio.sfx('ui'); s.drawTab();
        });
      });
    }

    if (this.tab === 'story') {
      var rows = 6, rh = 12, st = this.stories;
      if (this.storySel < this.storyTop) this.storyTop = this.storySel;
      if (this.storySel >= this.storyTop + rows) this.storyTop = this.storySel - rows + 1;
      for (var i = this.storyTop; i < Math.min(st.length, this.storyTop + rows); i++) {
        (function (i) {
          var story = st[i], y = y0 + (i - s.storyTop) * rh, open = s.storyOpen(story);
          if (i === s.storySel) s.keep(s.add.rectangle(192, y + 5, 318, rh, 0xf6c88a, 0.8));
          s.keep(BK.ui.text(s, x0 + 4, y, story.title, { outline: false, color: open ? 0x4a2c1c : 0x9a8a80 }));
          if (open) s.keep(BK.ui.stars(s, 330, y + 5, (P.stories || {})[story.id] || 0, 3, 10));
          else s.keep(BK.ui.text(s, 346, y, BK.T.pStoryLocked + ' ' + BK.REGIONS[story.region - 1].name, { outline: false, origin: [1, 0], color: 0x9a8a80, px: 9 }));
          var z = s.keep(s.add.zone(192, y + 5, 318, rh).setInteractive({ useHandCursor: true }));
          z.on('pointerup', function () {
            if (s.storySel === i) { s.go(); return; }
            s.storySel = i; BK.audio.sfx('ui'); s.drawTab(); s.refreshStart();
          });
        })(i);
      }
      var more = st.length > rows ? '   (' + (this.storySel + 1) + '/' + st.length + ')' : '';
      this.keep(BK.ui.text(this, 192, y0 + rows * rh + 6, BK.T.pStoryHint + more, { outline: false, origin: [0.5, 0.5], color: 0x9a8a80 }));
    }
  }

  // the tricky letters the drill would use for the selected region
  weakPreview() {
    var set = BK.wordbank.allowed(this.sentRegion);
    return BK.adaptive.weakest(this.P, 8).filter(function (k) { return set[k] && /\p{L}/u.test(k); }).slice(0, 3);
  }

  move(d, axis) {
    var modes = ['sent', 'weak', 'endless'];
    if (this.tab === 'practice' && axis === 'v') {
      var mi = modes.indexOf(this.mode) + d;
      if (mi < 0 || mi >= modes.length) return;
      this.mode = modes[mi];
    } else if (this.tab === 'practice' && axis === 'h') {
      var i = this.open.indexOf(this.sentRegion) + d;
      if (i < 0 || i >= this.open.length) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
      this.sentRegion = this.open[i];
    } else if (this.tab === 'story' && axis === 'v') {
      var n = this.storySel + d;
      if (n < 0 || n >= this.stories.length) return;
      this.storySel = n;
    } else return;
    BK.audio.sfx('ui');
    this.drawTab();
    this.refreshStart();
  }

  refreshStart() {
    if (!this.startBtn) return;
    var ok = this.tab !== 'story' || (this.stories.length && this.storyOpen(this.stories[this.storySel]));
    this.startBtn.setDisabled(!ok);
  }

  go() {
    var P = this.P;
    if (this.tab === 'today') {
      var r2 = this.open[this.open.length - 1] || 1;
      BK.audio.sfx('chime');
      this.scene.start('Level', { region: r2, level: 'daily', seed: BK.util.hash('daily:' + BK.util.today()) });
    } else if (this.tab === 'practice') {
      BK.audio.sfx('chime');
      this.scene.start('Level', { region: this.sentRegion, level: this.mode === 'sent' ? 'practice' : this.mode });
    } else {
      var st = this.stories[this.storySel];
      if (!st || !this.storyOpen(st)) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
      BK.audio.sfx('chime');
      this.scene.start('Level', { region: st.region, level: 'story', storyId: st.id });
    }
  }
};
