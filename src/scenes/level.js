/*
 * Level: the side-scrolling typing journey.
 *
 * Flow: (warm-up on level 1) -> walk -> an encounter arrives -> type its
 * text -> it plays its ending -> walk on ... -> results.
 * Nothing can fail: creatures stop and wait, bridges only wobble.
 *
 * data: { region: 1, level: 0..3 | 'daily', seed (optional) }
 */
BK.LevelScene = class extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.regionId = data.region || 1;
    this.levelIdx = data.level === undefined ? 0 : data.level;
    this.daily = this.levelIdx === 'daily';
    this.practiceMode = (this.levelIdx === 'practice' || this.levelIdx === 'story') ? this.levelIdx : null;
    this.storyId = data.storyId || null;
    this.profile = BK.state.profile;
    var seed = data.seed !== undefined ? data.seed : Math.floor(Math.random() * 1e9);
    this.rng = BK.util.rng(seed);
    this.plan = BK.levelgen.build(this.regionId, this.levelIdx, this.profile, this.rng, { storyId: this.storyId });
    this.queue = this.plan.encounters.slice();
    this.total = this.queue.length;
    this.doneCount = 0;
    this.enc = null;
    this.state = 'start';
    this.stats = { correct: 0, wrong: 0, chars: 0, typingMs: 0 };
    this.lastKeyAt = 0;
    this.activatedAt = 0;
    this.idleMs = 0;
    this.levelCoins = 0;
    this.streak = 0;
    this.wordsDone = 0;
    this.layoutStrikes = 0;
    this.capsWarned = false;
    this.speed = 76;          // world scroll, pixels per second
    this.startedAt = 0;
  }

  create() {
    var s = this, P = this.profile;
    this.cameras.main.setBackgroundColor('#7ec8f0');
    this.buildBackground();
    this.hero = new BK.Hero(this, BK.HERO_X, BK.GROUND_Y + 1, P);
    this.buildHud();
    this.allowed = BK.wordbank.allowed(this.regionId);
    this.kb = new BK.KeyboardView(this, { allowed: this.allowed, fingers: P.settings.fingers });
    this.kb.setVisible(P.settings.keyboard);
    if (!P.settings.keyboard) this.extendGround();
    BK.audio.apply(P.settings);
    this.playLevelMusic();

    this.keyHandler = function (e) { s.onKey(e); };
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', function () { window.removeEventListener('keydown', s.keyHandler); });
    this.input.keyboard.on('keydown-ESC', function () { s.togglePause(); });

    if (this.levelIdx === 0 && BK.wordbank.focus(this.regionId).length) this.startWarmup();
    else this.startIntro();
  }

  playLevelMusic() { BK.audio.music(this.plan.music); }

  // ------------------------------------------------------------ background
  buildBackground() {
    var reg = this.reg = BK.REGIONS[this.regionId - 1];
    this.skyLayers = [];
    if (reg.backdrop) {
      // parallax backdrop (beach, mountains, canyon, moonlit forest): far layers move slowest
      var L = BK_MANIFEST.backdrops[reg.backdrop], nL = L.length;
      for (var j = 0; j < nL; j++) {
        var b = this.add.tileSprite(0, 0, BK.W, BK.KB_TOP, 'bd_' + reg.backdrop + '_' + (j + 1)).setOrigin(0, 0).setDepth(j + 1);
        b.tilePositionY = reg.bdOffset || 0;
        b.speed = nL > 1 ? 0.04 + 0.5 * Math.pow(j / (nL - 1), 1.5) : 0;
        if (this.plan.bdTint) b.setTint(this.plan.bdTint);
        this.skyLayers.push(b);
      }
      this.night = reg.backdrop === 'moon';
      this.dusk = !!this.plan.bdTint;
    } else {
      var n = this.plan.sky, layers = BK_MANIFEST.skies[n].length;
      for (var i = 1; i <= layers; i++) {
        var t = this.add.tileSprite(0, 0, BK.W, BK.KB_TOP, 'sky' + n + '_' + i).setOrigin(0, 0).setDepth(i);
        t.tilePositionY = 60;
        t.speed = (i - 1) * 0.06;
        this.skyLayers.push(t);
      }
      this.night = n === 3;
      this.dusk = n === 6 || n === 7 || n === 4;
    }
    // decor rows: far trees (slower, faded) and near bushes/trees, or the region's own decor
    this.decor = [];
    for (var x = 0; x < BK.W + 120; x += 70 + Math.floor(this.rng() * 80)) this.addDecor(x);
    this.ground = this.add.tileSprite(0, BK.GROUND_Y, BK.W, BK.KB_TOP - BK.GROUND_Y + 2, reg.ground || 'ground').setOrigin(0, 0).setDepth(20);
    if (reg.groundTint) this.ground.setTint(reg.groundTint);
    else if (this.night && !reg.backdrop) this.ground.setTint(0x8a8ab8);
    else if (this.dusk) this.ground.setTint(0xe8c8c0);
    this.weatherFx();
  }

  extendGround() {
    // without the keyboard the ground fills to the bottom of the screen
    this.add.rectangle(0, BK.KB_TOP, BK.W, BK.H - BK.KB_TOP, 0x8a3530).setOrigin(0, 0).setDepth(19);
    this.add.rectangle(0, BK.KB_TOP, BK.W, 2, 0x6a2420).setOrigin(0, 0).setDepth(19);
  }

  addDecor(x) {
    var list = this.reg.decor;
    if (list) {
      // region decor (palms on the beach); an empty list means the backdrop is enough
      var d = { x: x, speed: 1, destroy: function () {} };
      if (list.length && this.rng.chance(0.6)) {
        var key0 = this.rng.pick(list);
        var frames = this.textures.get(key0).frameTotal - 1;
        d = this.add.image(x, BK.GROUND_Y + 2, key0, frames > 1 ? this.rng.int(frames) : undefined).setOrigin(0.5, 1).setDepth(15);
        d.speed = 1;
        if (this.plan.bdTint) d.setTint(this.plan.bdTint);
      }
      this.decor.push(d);
      return;
    }
    var far = this.rng.chance(0.5);
    var key = far ? 'tree' : this.rng.pick(['bush', 'tree', 'bush']);
    var im = this.add.image(x, BK.GROUND_Y + 1, key).setOrigin(0.5, 1).setDepth(far ? 9 : 15);
    im.speed = far ? 0.55 : 1;
    if (far) { im.setTint(this.night ? 0x4a4a78 : 0xa8c890); im.setAlpha(0.85); }
    else if (this.night) im.setTint(0x7070a0);
    this.decor.push(im);
  }

  weatherFx() {
    var s = this, w = this.plan.weather;
    this.particles = [];
    if (w === 'rain') {
      for (var i = 0; i < 40; i++) {
        var d = this.add.rectangle(Math.random() * BK.W, Math.random() * BK.GROUND_Y, 1, 4, 0xd8ecff, 0.7).setDepth(100);
        d.vy = 140 + Math.random() * 60; d.vx = -30;
        this.particles.push(d);
      }
    } else if (w === 'leaves') {
      for (var j = 0; j < 7; j++) {
        var l = this.add.sprite(Math.random() * BK.W, Math.random() * BK.GROUND_Y, 'fx_leaf', j % 2).setDepth(100);
        l.vy = 14 + Math.random() * 10; l.vx = -20 - Math.random() * 15; l.spin = (Math.random() - 0.5) * 2;
        this.particles.push(l);
      }
    }
    this.windBoost = w === 'wind' ? 3 : 1;
  }

  // ------------------------------------------------------------ HUD
  buildHud() {
    this.coinIcon = this.add.sprite(12, 9, 'coin').setDepth(260); this.coinIcon.play('coin');
    this.coinText = BK.ui.text(this, 22, 3, '0', { color: 0xffe9a0 }).setDepth(260);
    var label = this.daily ? BK.T.daily : this.practiceMode === 'story' ? this.plan.storyTitle :
      this.practiceMode ? BK.T.practice + ' · ' + BK.REGIONS[this.regionId - 1].name : (BK.REGIONS[this.regionId - 1].name + ' · ' +
      (this.levelIdx === 3 ? BK.T.boss : this.regionId + '-' + (this.levelIdx + 1)));
    this.add.rectangle(BK.W / 2, 9, 140, 13, 0x2b1a14, 0.45).setDepth(259);
    BK.ui.text(this, BK.W / 2, 3, label, { origin: [0.5, 0], color: 0xfff2dc }).setDepth(260);
    // progress: little flag track
    this.progBg = this.add.rectangle(BK.W - 60, 9, 100, 4, 0x2b1a14, 0.5).setDepth(259);
    this.progFill = this.add.rectangle(BK.W - 110, 9, 0, 4, 0x8ee07a).setOrigin(0, 0.5).setDepth(260);
    if (this.profile.settings.speedRun) {
      this.timerText = BK.ui.text(this, BK.W - 6, 16, '0.0', { origin: [1, 0], color: 0xffd23c }).setDepth(260);
    }
    this.pauseBtn = BK.ui.text(this, 6, 18, 'Esc: szünet', { color: 0xfff2dc }).setDepth(260).setAlpha(0.7);
    if (BK.DEBUG) BK.ui.text(this, 6, 29, 'TESZT: Tab = szó kész, Ctrl+Enter = pálya kész', { color: 0xff9a7a }).setDepth(260);
  }

  addCoins(n) {
    this.levelCoins += n;
    this.profile.coins = Math.min(16000, this.profile.coins + n);   // usable in the shop right away
    this.coinText.setText(String(this.levelCoins));
    this.tweens.add({ targets: this.coinIcon, scale: 1.4, duration: 80, yoyo: true });
  }

  // ------------------------------------------------------------ intro / warm-up
  startIntro() {
    var s = this;
    var focus = BK.wordbank.focus(this.regionId).join(' ');
    var msg = this.levelIdx === 3 ? BK.T.boss + '!' : (this.daily ? BK.T.daily : BK.T.ready);
    if (this.practiceMode === 'story') msg = this.plan.storyTitle;
    var t = BK.ui.text(this, BK.W / 2, 60, msg, { size: 2, origin: [0.5, 0.5], color: 0xfff2dc }).setDepth(400);
    this.time.delayedCall(1100, function () {
      t.destroy();
      BK.audio.sfx('v_letsgo', { volume: 0.6 });
      s.beginWalk();
    });
  }

  startWarmup() {
    var s = this;
    this.state = 'warmup';
    // at most 8 keys: Region 4 (all capitals) and 6 (digits and marks) would be too long
    var keys = BK.wordbank.focus(this.regionId).slice();
    if (keys.length > 8) keys = this.rng.shuffle(keys).slice(0, 8);
    this.warmKeys = keys;
    this.warmI = 0;
    this.warmPanel = BK.ui.nine(this, 102, 18, 180, 110, 'ui_panel2').setDepth(400);
    var reg = BK.REGIONS[this.regionId - 1];
    var title = reg.capitals ? BK.T.shiftHint : BK.T.newKeys + ' ' + this.warmKeys.join(' ');
    this.warmTitle = BK.ui.text(this, 192, 46, title, { outline: false, origin: [0.5, 0.5], width: 160, align: 1 }).setDepth(401);
    this.warmBig = BK.ui.text(this, 192, 72, '', { outline: false, size: 3, origin: [0.5, 0.5], color: 0x2b1a14 }).setDepth(401);
    this.warmFinger = BK.ui.text(this, 192, 98, '', { outline: false, origin: [0.5, 0.5], color: 0x6b3a20 }).setDepth(401);
    this.showWarmKey();
  }

  showWarmKey() {
    var k = this.warmKeys[this.warmI];
    this.warmBig.setText(k);
    var f = BK.FINGER_OF[k];
    this.warmFinger.setText(BK.T.finger + ' ' + (f !== undefined ? BK.FINGER_NAMES[f] : ''));
    this.kb.setNext(k);
  }

  warmKey(ch) {
    var k = this.warmKeys[this.warmI];
    if (ch === k) {
      BK.audio.sfx('key_ok', { detune: this.warmI * 100 });
      BK.fx.spark(this, 192, 70);
      this.warmI++;
      if (this.warmI >= this.warmKeys.length) {
        var s = this;
        [this.warmPanel, this.warmTitle, this.warmBig, this.warmFinger].forEach(function (o) { o.destroy(); });
        BK.ui.toast(this, BK.W / 2, 60, BK.T.go, 0xffd23c, 2);
        BK.audio.sfx('v_go', { volume: 0.6 });
        this.state = 'start';
        this.time.delayedCall(700, function () { s.beginWalk(); });
      } else this.showWarmKey();
    } else {
      BK.audio.sfx('key_bad', { volume: 0.3 });
      this.kb.flashWrong(ch);
      this.tweens.add({ targets: this.warmBig, x: { from: 190, to: 192 }, duration: 160, ease: 'Elastic.easeOut' });
    }
  }

  // ------------------------------------------------------------ main loop
  beginWalk() {
    if (!this.startedAt) this.startedAt = performance.now();
    this.spawnNext();
  }

  spawnNext() {
    var def = this.queue.shift();
    if (!def) { this.endLevel(); return; }
    var Cls = BK.ENCOUNTERS[def.kind] || BK.Walker;
    this.enc = new Cls(this, def);
    this.enc.spawn(BK.W + 24);
    this.state = 'walk';
    this.hero.run();
    this.kb.setNext(null);
  }

  update(time, delta) {
    var dt = Math.min(delta, 50), s = this;
    this.kb.update();
    this.hero.update(dt);
    if (this.enc && this.enc.update) this.enc.update(dt);
    // particles
    this.particles.forEach(function (p) {
      p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000;
      if (p.spin) p.angle += p.spin;
      if (p.y > BK.GROUND_Y) { p.y = -4; p.x = Math.random() * (BK.W + 60); }
      if (p.x < -6) p.x = BK.W + 4;
    });
    // clouds drift a little even when standing
    this.skyLayers.forEach(function (t) { t.tilePositionX += t.speed * 0.15 * s.windBoost * dt / 16; });
    if (this.state === 'type') this.idleMs += dt;
    if (this.timerText && this.startedAt && this.state !== 'end') {
      this.timerText.setText(((performance.now() - this.startedAt) / 1000).toFixed(1));
    }
    if (this.state !== 'walk') return;

    var dx = this.speed * dt / 1000;
    this.ground.tilePositionX += dx;
    this.skyLayers.forEach(function (t) { t.tilePositionX += t.speed * dx; });
    this.decor.forEach(function (d) { d.x -= dx * d.speed; });
    var maxX = Math.max.apply(null, this.decor.map(function (d) { return d.x; }));
    this.decor = this.decor.filter(function (d) { if (d.x < -60) { d.destroy(); return false; } return true; });
    if (maxX < BK.W + 40) this.addDecor(maxX + 70 + Math.floor(this.rng() * 90));
    if (this.stepT === undefined) this.stepT = 0;
    this.stepT += dt;
    if (this.stepT > 280) { this.stepT = 0; BK.audio.sfx('step', { volume: 0.12 }); }

    if (this.enc) {
      this.enc.moveBy(dx + (this.enc.walkSpeed ? this.enc.walkSpeed() * dt / 1000 : 0));
      if (this.enc.arrived()) this.arrive();
    }
  }

  arrive() {
    this.state = 'type';
    this.hero.idle();
    this.idleMs = 0;
    this.enc.activate();
    this.activatedAt = performance.now();
    this.lastKeyAt = 0;
    this.refreshNext();
  }

  refreshNext() {
    if (this.enc) this.kb.setNext(this.enc.next);
    this.activatedAt = performance.now();
  }

  // ------------------------------------------------------------ typing
  onKey(e) {
    if (this.paused || this.overlayOpen) return;
    if (BK.DEBUG && this.debugKey(e)) return;
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return;     // shortcuts, but allow AltGr
    var key = e.key;
    if (key === 'Shift') { this.lastShift = e.code || e.location; return; }
    if (key === 'Dead') { this.layoutStrikes++; this.maybeLayoutHint(); return; }
    if (!key || key.length !== 1) return;
    e.preventDefault();
    var ch = BK.util.norm(key);
    if (this.state === 'warmup') { this.warmKey(ch); return; }
    if (this.state !== 'type' || !this.enc || this.enc.next === null) return;

    var now = performance.now();
    var expected = this.enc.next;
    // time spent typing: gaps longer than 3 s (thinking, looking around) count as 3 s
    var gap = this.lastKeyAt ? now - this.lastKeyAt : Math.min(now - this.activatedAt, 1500);
    this.stats.typingMs += Math.min(gap, 3000);
    var msSinceLast = this.lastKeyAt ? now - this.lastKeyAt : 0;
    this.lastKeyAt = now;
    this.idleMs = 0;

    // Caps Lock: a capital where a small letter was expected
    if (ch !== expected && ch.toLowerCase() === expected && e.getModifierState && e.getModifierState('CapsLock') && !this.capsWarned) {
      this.capsWarned = true;
      BK.ui.toast(this, BK.W / 2, 80, BK.T.capsOn, 0xffd23c);
    }
    var res = this.enc.type(ch);
    var ok = res !== 'bad';
    if (ok && ch !== ch.toLowerCase()) this.checkShiftSide(ch);
    BK.adaptive.record(this.profile, expected, ok, msSinceLast);

    if (!ok) {
      this.stats.wrong++;
      this.streak = 0;
      BK.audio.sfx('key_bad', { volume: 0.28 });
      this.kb.flashWrong(ch);
      if ((expected === 'z' && ch === 'y') || (expected === 'y' && ch === 'z') || (expected === 'é' && ch === ';')) {
        this.layoutStrikes++; this.maybeLayoutHint();
      }
      return;
    }
    this.stats.correct++;
    this.stats.chars++;
    this.streak++;
    BK.audio.sfx('key_ok', { volume: 0.4, detune: Math.min(this.streak, 12) * 50 });
    var hp = this.enc.hitPos();
    BK.fx.bolt(this, this.hero.x + 8, this.hero.y - 24, hp.x, hp.y);
    if (res === 'ok' || res === 'chunk') { this.kb.setNext(this.enc.next); return; }
    // whole encounter done
    this.kb.setNext(null);
    this.encounterDone();
  }

  // Capitals: the Shift on the OTHER hand is the touch-typing habit. Only a friendly tip, never an error.
  checkShiftSide(ch) {
    var f = BK.FINGER_OF[ch.toLowerCase()];
    if (f === undefined || !this.lastShift) return;
    var want = f <= 3 ? 'ShiftRight' : 'ShiftLeft';
    var used = this.lastShift === 2 ? 'ShiftRight' : (this.lastShift === 1 ? 'ShiftLeft' : this.lastShift);
    if (used === want) return;
    var now = performance.now();
    if (this.shiftTipAt && now - this.shiftTipAt < 20000) return;
    this.shiftTipAt = now;
    BK.ui.toast(this, BK.W / 2, 92, want === 'ShiftRight' ? 'Tipp: ehhez a jobb oldali Shift kell!' : 'Tipp: ehhez a bal oldali Shift kell!', 0xffd23c);
  }

  // Test mode (?debug): Tab finishes the current word, Ctrl+Enter ends the level
  debugKey(e) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (this.state === 'end') return true;
      if (!this.startedAt) this.startedAt = performance.now() - 60000;
      if (!this.stats.chars) { this.stats.chars = 50; this.stats.correct = 50; this.stats.typingMs = 60000; }
      if (this.enc) { this.enc.destroy(); this.enc = null; }
      this.queue = [];
      this.endLevel();
      return true;
    }
    if (e.key !== 'Tab') return false;
    e.preventDefault();
    if (this.state === 'warmup') { this.warmI = this.warmKeys.length - 1; this.warmKey(this.warmKeys[this.warmI]); return true; }
    if (this.state !== 'type' || !this.enc || this.enc.next === null) return true;
    var res = 'ok';
    while (this.enc.next !== null && res === 'ok') {
      res = this.enc.type(this.enc.next);
      this.stats.correct++; this.stats.chars++; this.stats.typingMs += 250;
    }
    if (res === 'done') { this.kb.setNext(null); this.encounterDone(); }
    return true;
  }

  maybeLayoutHint() {
    if (this.layoutStrikes >= 3 && !this.layoutWarned) {
      this.layoutWarned = true;
      var t = BK.ui.text(this, BK.W / 2, 92, BK.T.layoutHint, { origin: [0.5, 0.5], color: 0xffd23c, width: 300, align: 1 }).setDepth(400);
      this.time.delayedCall(5000, function () { t.destroy(); });
    }
  }

  encounterDone() {
    var s = this, enc = this.enc;
    this.state = 'finish';
    this.wordsDone++;
    BK.audio.sfx('word_done', { volume: 0.5 });
    this.hero.cheer();
    BK.ui.toast(this, this.hero.x + 10, this.hero.y - 52, BK.pick(BK.T.praise), 0xfff2a0);
    if (this.wordsDone % 6 === 0) BK.audio.sfx(BK.pick(['v_great', 'v_woo', 'v_wow', 'v_great_m', 'v_woo_m']), { volume: 0.6 });
    enc.finish().then(function () {
      enc.destroy();
      s.doneCount++;
      s.progFill.width = 100 * s.doneCount / s.total;
      s.enc = null;
      s.time.delayedCall(250, function () { s.spawnNext(); });
    });
  }

  // ------------------------------------------------------------ pause / overlays
  togglePause() {
    if (this.state === 'end' || this.overlayOpen) return;
    var s = this;
    if (this.paused) { this.pauseUi.forEach(function (o) { o.destroy(); }); this.paused = false; this.tweens.resumeAll(); this.anims.resumeAll(); return; }
    this.paused = true;
    this.tweens.pauseAll(); this.anims.pauseAll();
    var shade = this.add.rectangle(0, 0, BK.W, BK.H, 0x000000, 0.45).setOrigin(0, 0).setDepth(900);
    var panel = BK.ui.nine(this, 122, 40, 140, 112, 'ui_panel2').setDepth(901);
    var t = BK.ui.text(this, 192, 70, 'Szünet', { outline: false, size: 2, origin: [0.5, 0.5] }).setDepth(902);
    var b1 = BK.ui.button(this, 192, 96, 'Folytatom', function () { s.togglePause(); }, { w: 90 }).setDepth(902);
    var b2 = BK.ui.button(this, 192, 120, BK.T.map, function () { s.scene.start('Map'); }, { w: 90 }).setDepth(902);
    this.pauseUi = [shade, panel, t, b1, b2, b1.zone, b2.zone];
  }

  openOverlay(name, done) {
    var s = this;
    this.overlayOpen = true;
    this.state = 'overlay';
    this.scene.launch(name, { from: 'Level', onClose: function () {
      s.overlayOpen = false;
      s.state = 'finish';
      done();
    } });
    this.scene.pause();
  }

  // ------------------------------------------------------------ end
  endLevel() {
    this.state = 'end';
    this.hero.run();
    var st = this.stats, P = this.profile;
    var acc = st.correct + st.wrong ? st.correct / (st.correct + st.wrong) : 1;
    var wpm = BK.util.wpm(st.chars, st.typingMs);
    var target = BK.speedTarget(P.grade, this.regionId);
    var stars = 1;
    if (acc >= BK.STARS.two) stars = 2;
    if (acc >= BK.STARS.three && wpm >= target) stars = 3;
    var bonus = stars * (this.practiceMode ? 1 : 3) + (this.levelIdx === 3 ? 10 : 0);
    var lcode = this.daily ? -1 : this.practiceMode === 'practice' ? -2 : this.practiceMode === 'story' ? -3 : this.levelIdx;
    var res = { r: this.regionId, l: lcode, practice: this.practiceMode, storyId: this.plan.storyId, wpm: wpm, acc: acc, stars: stars,
      ms: Math.round(performance.now() - this.startedAt), coins: bonus, earned: this.levelCoins + bonus, bonus: bonus,
      daily: this.daily, target: target, levelCoins: this.levelCoins };
    if (P.settings.speedRun && !this.daily && !this.practiceMode) {
      var k = this.regionId + '-' + this.levelIdx;
      res.prevBestTime = P.bestTimes[k] || null;
      if (!P.bestTimes[k] || res.ms < P.bestTimes[k]) P.bestTimes[k] = res.ms;
    }
    res.newBest = BK.save.recordLevel(P, res);
    var s = this;
    this.tweens.add({ targets: this.hero.sprite, x: BK.W + 40, duration: 1200, ease: 'Quad.easeIn' });
    BK.audio.sfx('v_alldone', { volume: 0.6 });
    if (this.practiceMode === 'story') this.time.delayedCall(1300, function () { s.storyRecap(res); });
    else this.time.delayedCall(1300, function () { s.scene.start('Results', res); });
  }

  // The whole story on one page, read back once it is typed
  storyRecap(res) {
    var s = this;
    this.add.rectangle(BK.W / 2, BK.H / 2, BK.W, BK.H, 0x000000, 0.45).setDepth(900);
    BK.ui.nine(this, 20, 6, BK.W - 40, 186, 'ui_panel2').setDepth(901);
    this.add.rectangle(BK.W / 2, 204, BK.W, 24, 0x2b1a14, 1).setDepth(901);
    BK.ui.text(this, BK.W / 2, 36, this.plan.storyTitle, { outline: false, size: 2, origin: [0.5, 0.5] }).setDepth(902);
    BK.ui.text(this, 42, 50, this.plan.storyLines.join(' '), { outline: false, width: BK.W - 84, color: 0x4a2a18 }).setDepth(902);
    BK.ui.text(this, BK.W / 2, 142, BK.T.storyDone, { outline: false, origin: [0.5, 0.5], color: 0x9a3d1a }).setDepth(902);
    BK.audio.sfx('chime');
    var b = BK.ui.button(this, BK.W / 2, 204, BK.T.next + ' (Enter)', function () { s.scene.start('Results', res); }, { w: 86, h: 18, key: 'ENTER' });
    b.setDepth && b.setDepth(902);
  }
};
