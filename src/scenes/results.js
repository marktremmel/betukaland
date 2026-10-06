/*
 * Results after a level: stars (accuracy first, speed second), accuracy,
 * WPM, coins, and a small chart of the child's recent levels.
 */
BK.ResultsScene = class extends Phaser.Scene {
  constructor() { super('Results'); }

  init(res) { this.res = res; }

  create() {
    var s = this, r = this.res, P = BK.state.profile;
    BK.menuBackground(this, 2, { groundY: 200 });
    BK.audio.music(BK.MUSIC.map);
    BK.ui.nine(this, 16, 4, 352, 182, 'ui_panel2');
    var head = r.daily ? BK.T.daily + BK.L(': kész!', ': done!') : r.practice === 'practice' ? BK.T.practice + BK.L(': kész!', ': done!') : BK.T.results;
    BK.ui.text(this, 192, 35, head, { outline: false, size: 2, origin: [0.5, 0.5] });

    // stars pop in one by one
    for (var i = 0; i < 3; i++) {
      (function (i) {
        var x = 72 + (i - 1) * 30, y = 66;
        var off = s.add.image(x, y, 'star_off').setScale(2);
        if (i < r.stars) {
          var on = s.add.image(x, y, 'star_on').setScale(0);
          s.tweens.add({ targets: on, scale: 2, delay: 300 + i * 350, duration: 260, ease: 'Back.easeOut',
            onStart: function () { BK.audio.sfx('star', { volume: 0.5, detune: i * 200 }); } });
        }
      })(i);
    }
    var accPct = Math.round(r.acc * 100);
    var lines = [
      [BK.T.accuracy, accPct + '%'],
      [BK.T.speed, (Math.round(r.wpm * 10) / 10) + ' ' + BK.T.wpm],
      [BK.T.coins, '+' + (r.earned !== undefined ? r.earned : r.coins)],
    ];
    if (r.ms && P.settings.speedRun) lines.push([BK.L('Idő', 'Time'), (r.ms / 1000).toFixed(1) + BK.L(' mp', ' s') + (r.prevBestTime && r.ms < r.prevBestTime ? BK.L('  rekord!', '  record!') : '')]);
    lines.forEach(function (l, i) {
      BK.ui.text(s, 34, 88 + i * 13, l[0] + ':', { outline: false });
      BK.ui.text(s, 110, 88 + i * 13, l[1], { outline: false, color: 0x9a3d1a });
    });
    // what the stars need, in plain words
    var tip;
    if (r.acc < 0.85) tip = BK.T.slowDown;
    else if (r.stars < 2) tip = BK.L('2 csillag: ', '2 stars: ') + Math.round(BK.STARS.two * 100) + BK.L('% pontosság', '% accuracy');
    else if (r.stars < 3) tip = BK.L('3 csillag: ', '3 stars: ') + Math.round(BK.STARS.three * 100) + BK.L('% és ', '% and ') + r.target + ' ' + BK.T.wpm;
    else tip = BK.pick(BK.L(['Tökéletes!', 'Hibátlan munka!', 'Csillagos ötös!'], ['Perfect!', 'Flawless work!', 'Top marks!']));
    BK.ui.text(this, 34, 134, tip, { outline: false, color: 0x6b3a20, width: 156 });
    if (r.newBest) {
      var nb = BK.ui.text(this, 72, 50, BK.T.newBest, { origin: [0.5, 0.5], color: 0xffd23c });
      this.tweens.add({ targets: nb, scale: 1.2, duration: 400, yoyo: true, repeat: -1 });
      this.time.delayedCall(1300, function () { BK.audio.sfx('v_highscore', { volume: 0.7 }); });
    } else if (r.stars === 3) {
      this.time.delayedCall(1300, function () { BK.audio.sfx('v_wow', { volume: 0.6 }); });
    }
    this.chart(196, 52, 160, 92, P.history.slice(-12));

    if (r.daily || r.practice) { this.practiceButtons(r); return; }
    var nextLevel = (r.l < 3) ? r.l + 1 : null, nextRegion = r.r;
    if (!r.daily && r.l === 3 && r.r < BK.REGIONS.length && BK.save.regionOpen(P, r.r + 1)) {
      // boss beaten: the next region opens
      nextRegion = r.r + 1; nextLevel = 0;
      var nr = BK.REGIONS[r.r];
      var msg = BK.ui.text(this, 192, 172, BK.L('Új vidék: ', 'New region: ') + nr.name + '!', { origin: [0.5, 0.5], color: 0xffd23c });
      this.tweens.add({ targets: msg, scale: 1.15, duration: 500, yoyo: true, repeat: -1 });
    } else if (!r.daily && r.l === 3 && r.r === BK.REGIONS.length) {
      BK.ui.text(this, 192, 172, BK.L('Végigértél a Betűkalandon! Gratulálunk!', 'You finished the Typing Adventure! Well done!'), { origin: [0.5, 0.5], color: 0xffd23c });
      BK.fx.confetti(this, 192, 60);
    }
    var canNext = nextLevel !== null && BK.save.levelUnlocked(P, nextRegion, nextLevel);
    BK.ui.button(this, 78, 196, BK.T.retry, function () { s.scene.start('Level', { region: r.r, level: r.daily ? 'daily' : r.l, seed: r.daily ? BK.util.hash('daily:' + BK.util.today()) : undefined }); }, { w: 66, h: 18 });
    BK.ui.button(this, 192, 196, BK.T.map, function () { s.scene.start('Map'); }, { w: 66, h: 18, key: 'ESC' });
    var nb2 = BK.ui.button(this, 306, 196, BK.T.next + ' (Enter)', function () {
      if (canNext) s.scene.start('Level', { region: nextRegion, level: nextLevel }); else s.scene.start('Map');
    }, { w: 86, h: 18, key: 'ENTER' });
  }

  // Daily, sentence practice and stories go back to the practice corner
  practiceButtons(r) {
    var s = this;
    var again = { region: r.r, level: r.daily ? 'daily' : r.practice, storyId: r.storyId,
      seed: r.daily ? BK.util.hash('daily:' + BK.util.today()) : undefined };
    var tab = r.daily ? 'daily' : r.practice === 'story' ? 'story' : 'sent';
    BK.ui.button(this, 78, 196, BK.T.retry, function () { s.scene.start('Level', again); }, { w: 66, h: 18 });
    BK.ui.button(this, 192, 196, BK.T.map, function () { s.scene.start('Map'); }, { w: 66, h: 18, key: 'ESC' });
    BK.ui.button(this, 306, 196, BK.T.next + ' (Enter)', function () { s.scene.start('Practice', { tab: tab }); }, { w: 86, h: 18, key: 'ENTER' });
  }

  // WPM line + accuracy bars for the last levels
  chart(x, y, w, h, hist) {
    var g = this.add.graphics();
    BK.ui.text(this, x + w / 2, y - 4, BK.T.bestChart, { outline: false, origin: [0.5, 0.5], color: 0x6b3a20 });
    g.fillStyle(0xf6e3c8, 1).fillRect(x, y + 4, w, h - 20);
    g.lineStyle(1, 0xd8bfa0, 1);
    for (var gy = 0; gy <= 4; gy++) g.lineBetween(x, y + 4 + gy * (h - 20) / 4, x + w, y + 4 + gy * (h - 20) / 4);
    if (!hist.length) return;
    var maxW = Math.max(10, Math.max.apply(null, hist.map(function (h) { return h.wpm; })) * 1.15);
    var n = hist.length, step = w / Math.max(n, 1), base = y + h - 16, top = y + 4;
    // accuracy bars (light), WPM line (dark)
    hist.forEach(function (hh, i) {
      var bh = (base - top) * BK.util.clamp((hh.acc - 0.5) / 0.5, 0, 1);
      g.fillStyle(hh.acc >= BK.STARS.two ? 0x9fd88a : 0xf0b090, 1).fillRect(Math.round(x + i * step + step * 0.25), Math.round(base - bh), Math.max(2, Math.round(step * 0.5)), Math.round(bh));
    });
    g.lineStyle(2, 0x9a3d1a, 1);
    g.beginPath();
    hist.forEach(function (hh, i) {
      var px = x + i * step + step / 2, py = base - (base - top) * hh.wpm / maxW;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    });
    g.strokePath();
    hist.forEach(function (hh, i) {
      var px = x + i * step + step / 2, py = base - (base - top) * hh.wpm / maxW;
      g.fillStyle(0x9a3d1a, 1).fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 3);
    });
    BK.ui.text(this, x, base + 3, BK.L('oszlop: pontosság\nvonal: szó/perc', 'bars: accuracy\nline: words/min'), { outline: false, color: 0x6b3a20 });
    BK.ui.text(this, x - 2, top, String(Math.round(maxW)), { outline: false, origin: [1, 0], color: 0x9a3d1a });
  }
};
