/*
 * Encounters: the things the hero meets on the road.
 *
 * Every encounter has a list of texts to type ("chunks"). The Level scene
 * scrolls the world until the encounter reaches its stop point, then calls
 * activate(), feeds it keys through type(), and calls finish() when all
 * chunks are done. finish() returns a Promise that resolves when the
 * encounter has played its ending (poof, chest opening, gate lowering...).
 *
 * Kinds: walker, flyer, gate, bridge, chest, mini (mini-boss), boss, shop, rest.
 * To add a kind: subclass BK.Encounter and register it in BK.ENCOUNTERS.
 */
BK.Encounter = class {
  constructor(level, def) {
    this.level = level;
    this.scene = level;
    this.def = def;
    this.texts = def.texts || [];
    this.chunk = 0;
    this.bubble = null;
    this.parts = [];          // display objects that scroll with the world
    this.stopX = def.stopX || BK.TARGET_X;
    this.x = 0;
    this.coins = def.coins || 1;
  }
  // world scrolls left by dx
  moveBy(dx) {
    this.x -= dx;
    this.parts.forEach(function (p) { p.x -= dx; });
  }
  get anchorX() { return this.x; }
  arrived() { return this.x <= this.stopX; }
  bubbleY() { return BK.GROUND_Y - 44; }
  activate() { this.showChunk(); }
  showChunk() {
    if (this.bubble) this.bubble.destroy(false);
    var text = this.texts[this.chunk];
    var bx = BK.util.clamp(this.bubbleX ? this.bubbleX() : this.anchorX, 70, BK.W - 70);
    this.bubble = new BK.WordBubble(this.scene, text, bx, this.bubbleY(), { maxWidth: this.def.maxWidth || 220 });
    // keep wide bubbles on screen
    var half = this.bubble.w / 2 + 4;
    // and below the top bar (tall two-line bubbles)
    this.bubble.moveTo(BK.util.clamp(bx, half, BK.W - half), Math.max(this.bubbleY(), this.bubble.h + 20));
  }
  get next() { return this.bubble ? this.bubble.next : null; }
  // returns 'bad' | 'ok' | 'chunk' | 'done'
  type(ch) {
    if (!this.bubble) return 'bad';
    if (!this.bubble.type(ch)) { this.onWrong(); return 'bad'; }
    this.onCorrect();
    if (!this.bubble.done) return 'ok';
    this.chunk++;
    if (this.chunk < this.texts.length) {
      this.onChunk();
      var self = this;
      this.bubble.destroy(true);
      this.bubble = null;
      this.scene.time.delayedCall(320, function () { self.showChunk(); self.level.refreshNext(); });
      return 'chunk';
    }
    this.bubble.destroy(true);
    this.bubble = null;
    return 'done';
  }
  onCorrect() {}
  onWrong() {}
  onChunk() {}
  finish() { return Promise.resolve(); }
  hitPos() { return { x: this.x, y: BK.GROUND_Y - 14 }; }
  destroy() {
    if (this.bubble) this.bubble.destroy(false);
    this.parts.forEach(function (p) { if (p && p.destroy) p.destroy(); });
    this.parts = [];
  }
  // helpers
  poof(target, big) {
    var s = this.scene, x = target.x, y = target.y - (target.displayHeight || 20) / 2;
    BK.fx.burst(s, x, y, big);
    BK.audio.sfx('poof', { volume: 0.5 });
    return new Promise(function (ok) {
      s.tweens.add({ targets: target, scale: 0.2, alpha: 0, angle: 20, duration: 260, ease: 'Back.easeIn', onComplete: ok });
    });
  }
};

/** A creature that walks (or hops) in from the right. */
BK.Walker = class extends BK.Encounter {
  constructor(level, def) {
    super(level, def);
    this.kindKey = def.creature || 'frog';
  }
  spawn(x) {
    var key = BK.CREATURES[this.kindKey];
    this.x = x;
    this.spr = this.scene.add.sprite(x, BK.GROUND_Y + 1, key).setOrigin(0.5, 1).setDepth(40);
    this.spr.play(key);
    this.spr.setFlipX(BK.FACES_LEFT[this.kindKey] !== true);
    this.tint = this.def.tint;
    if (this.tint) this.spr.setTint(this.tint);
    this.parts.push(this.spr);
  }
  // white flash on a hit, then back to the creature's own colour
  flash(ms) {
    var s = this.spr, tint = this.tint;
    s.setTintFill(0xffffff);
    this.scene.time.delayedCall(ms || 50, function () { s.clearTint(); if (tint) s.setTint(tint); });
  }
  walkSpeed() { return 14; }   // pixels per second on top of the world scroll
  hitPos() { return { x: this.spr.x, y: this.spr.y - this.spr.displayHeight / 2 }; }
  bubbleY() { return Math.max(46, BK.GROUND_Y - this.spr.displayHeight - 10); }
  activate() {
    // a frog taunts; the others keep stepping on the spot, slower (a frozen mid-step frame looked stuck)
    if (this.kindKey === 'frog') this.spr.play('frog_taunt');
    else this.spr.anims.timeScale = 0.45;
    super.activate();
  }
  onWrong() {
    this.scene.tweens.add({ targets: this.spr, y: this.spr.y - 3, duration: 80, yoyo: true });
  }
  onCorrect() { this.flash(50); }
  finish() {
    BK.fx.coins(this.scene, this.spr.x, this.spr.y - 10, this.coins);
    return this.poof(this.spr);
  }
};

/** A gull that flies in and hovers. */
BK.Flyer = class extends BK.Walker {
  spawn(x) {
    this.kindKey = this.def.creature && BK.CREATURES[this.def.creature] ? this.def.creature : 'gull';
    super.spawn(x);
    this.spr.y = BK.GROUND_Y - 40;
    this.baseY = this.spr.y;
    this.t = Math.random() * 1000;
  }
  walkSpeed() { return 22; }
  update(dt) { this.t += dt; this.spr.y = this.baseY + Math.sin(this.t / 220) * 4; }
  activate() { BK.Encounter.prototype.activate.call(this); }
  bubbleY() { return this.baseY - 30; }
};

/** A wooden gate made of planks; it sinks into the ground when the word is typed. */
BK.Gate = class extends BK.Encounter {
  spawn(x) {
    this.x = x;
    var s = this.scene;
    this.planks = [];
    for (var col = 0; col < 2; col++) for (var row = 0; row < 4; row++) {
      var p = s.add.image(x - 8 + col * 16, BK.GROUND_Y - 8 - row * 16, 'plank').setDepth(45);
      this.planks.push(p); this.parts.push(p);
    }
    this.sign = s.add.sprite(x, BK.GROUND_Y - 72, 'signpost', 1).setDepth(46);
    this.parts.push(this.sign);
    this.stopX = BK.TARGET_X + 10;
  }
  bubbleY() { return BK.GROUND_Y - 84; }
  hitPos() { return { x: this.x, y: BK.GROUND_Y - 30 }; }
  onCorrect() {
    var p = this.planks[BK.util.clamp(Math.floor(Math.random() * this.planks.length), 0, this.planks.length - 1)];
    this.scene.tweens.add({ targets: p, x: p.x + 1, duration: 40, yoyo: true });
  }
  finish() {
    var s = this.scene;
    BK.audio.sfx('gate');
    BK.fx.coins(s, this.x, BK.GROUND_Y - 40, this.coins);
    var self = this;
    return new Promise(function (ok) {
      s.tweens.add({ targets: self.planks.concat([self.sign]), y: '+=80', alpha: 0, duration: 500, ease: 'Quad.easeIn', onComplete: ok });
    });
  }
};

/** A wobbly bridge over a gap. Each correct letter steadies a plank. */
BK.Bridge = class extends BK.Encounter {
  spawn(x) {
    var s = this.scene;
    this.x = x;
    this.gapW = 64;
    this.stopX = BK.TARGET_X - 40;
    // the gap: water below the ground line
    this.gap = s.add.rectangle(x, BK.GROUND_Y, this.gapW, BK.KB_TOP - BK.GROUND_Y, 0x3d8bd9).setOrigin(0, 0).setDepth(30);
    this.gapTop = s.add.rectangle(x, BK.GROUND_Y + 6, this.gapW, 2, 0xbfe6ff).setOrigin(0, 0).setDepth(31);
    this.planks = [];
    for (var i = 0; i < 4; i++) {
      var p = s.add.image(x + 8 + i * 16, BK.GROUND_Y + 2, 'plank').setOrigin(0.5, 0.5).setDepth(35).setAngle((i % 2 ? 1 : -1) * 8);
      p.baseY = p.y; this.planks.push(p);
    }
    this.parts.push(this.gap, this.gapTop);
    this.parts = this.parts.concat(this.planks);
    this.steady = 0;
    this.t = 0;
  }
  get anchorX() { return this.x + this.gapW / 2; }
  bubbleY() { return BK.GROUND_Y - 40; }
  hitPos() { return { x: this.x + 8 + Math.min(this.steady, 3) * 16, y: BK.GROUND_Y }; }
  update(dt) {
    this.t += dt;
    var idle = this.level.idleMs || 0;
    var amp = this.active ? (1 + Math.min(3, idle / 1500)) : 1;
    for (var i = this.steady; i < this.planks.length; i++) {
      var p = this.planks[i];
      p.y = p.baseY + Math.sin(this.t / 120 + i) * amp;
      p.angle = Math.sin(this.t / 150 + i * 2) * 6 * amp / 2;
    }
  }
  activate() { this.active = true; BK.audio.sfx('wobble', { volume: 0.35 }); super.activate(); }
  onCorrect() {
    var total = this.texts.join('').length, typed = 0;
    for (var c = 0; c < this.chunk; c++) typed += this.texts[c].length;
    typed += this.bubble ? this.bubble.i : 0;
    var want = Math.floor(typed / total * this.planks.length);
    while (this.steady < want && this.steady < this.planks.length) {
      var p = this.planks[this.steady];
      p.y = p.baseY; p.angle = 0;
      p.setTint(0xfff2c0);
      this.steady++;
    }
  }
  finish() {
    this.planks.forEach(function (p) { p.y = p.baseY; p.angle = 0; p.clearTint(); });
    this.steady = this.planks.length;
    BK.fx.coins(this.scene, this.anchorX, BK.GROUND_Y - 20, this.coins);
    return Promise.resolve();
  }
};

/** A treasure chest: bonus word, gives coins and an item. */
BK.Chest = class extends BK.Encounter {
  spawn(x) {
    this.x = x;
    this.spr = this.scene.add.sprite(x, BK.GROUND_Y + 1, 'chest', 0).setOrigin(0.5, 1).setDepth(40);
    this.parts.push(this.spr);
    this.stopX = BK.TARGET_X - 10;
  }
  bubbleY() { return BK.GROUND_Y - 30; }
  activate() { BK.ui.toast(this.scene, this.x, 36, BK.T.chestText, 0xffd23c); super.activate(); }
  finish() {
    var s = this.scene, spr = this.spr, self = this;
    BK.audio.sfx('chest');
    return new Promise(function (ok) {
      var f = 0;
      s.time.addEvent({ delay: 70, repeat: 4, callback: function () { spr.setFrame(Math.min(4, ++f)); } });
      s.time.delayedCall(380, function () {
        var item = self.def.item;
        if (item) {
          var it = BK.ITEMS.find(function (i) { return i.id === item; });
          var P = BK.state.profile;
          if (P) P.items[item] = (P.items[item] || 0) + 1;      // saved with the level result
          var icon = s.add.image(spr.x, spr.y - 14, 'icons_food', it.frame).setDepth(210).setScale(1);
          s.tweens.add({ targets: icon, y: icon.y - 30, duration: 400, ease: 'Quad.easeOut' });
          s.tweens.add({ targets: icon, x: 300, y: 8, delay: 650, duration: 450, ease: 'Quad.easeIn', onComplete: function () { icon.destroy(); } });
          BK.ui.toast(s, spr.x, spr.y - 50, it.name + '!', 0xfff2c0);
        }
        BK.fx.coins(s, spr.x, spr.y - 14, self.coins);
        s.time.delayedCall(700, ok);
      });
    });
  }
};

/** Mini-boss: one sentence in chunks, a heart for each chunk. */
BK.Mini = class extends BK.Walker {
  constructor(level, def) {
    super(level, def);
    this.kindKey = def.creature || 'toad';
  }
  spawn(x) {
    super.spawn(x);
    this.stopX = BK.TARGET_X + 20;
    this.hearts = [];
    for (var i = 0; i < this.texts.length; i++) {
      var h = this.scene.add.sprite(0, 0, 'heart', 0).setDepth(60);
      this.hearts.push(h); this.parts.push(h);
    }
    this.layoutHearts();
  }
  layoutHearts() {
    var self = this, n = this.hearts.length;
    this.hearts.forEach(function (h, i) { h.x = self.spr.x + (i - (n - 1) / 2) * 12; h.y = Math.max(28, self.spr.y - self.spr.displayHeight - 4); });
  }
  moveBy(dx) { super.moveBy(dx); }
  bubbleY() { return Math.max(50, BK.GROUND_Y - this.spr.displayHeight - 16); }
  activate() {
    if (this.def.intro) BK.ui.toast(this.scene, 120, 66, this.def.intro, 0xffe9c8);
    BK.Encounter.prototype.activate.call(this);
  }
  onChunk() {
    var h = this.hearts[this.chunk - 1];
    BK.audio.sfx('boss_hit');
    if (h) this.scene.tweens.add({ targets: h, y: h.y - 10, alpha: 0, duration: 300 });
    var s = this.spr;
    this.flash(80);
    this.scene.tweens.add({ targets: s, x: s.x + 6, duration: 90, yoyo: true });
  }
  finish() {
    var last = this.hearts[this.hearts.length - 1];
    if (last) last.setVisible(false);
    BK.fx.coins(this.scene, this.spr.x, this.spr.y - 20, this.coins);
    return this.poof(this.spr, true);
  }
};

/** Region boss: several sentences, a big heart bar, a friendly ending. */
BK.Boss = class extends BK.Mini {
  constructor(level, def) {
    super(level, def);
    this.kindKey = def.creature || 'frogknight';
  }
  spawn(x) {
    BK.Walker.prototype.spawn.call(this, x);
    this.stopX = BK.TARGET_X + 40;
    this.baseY = BK.GROUND_Y + 1;
    if (this.spr.height > 120) {         // the big dragon flies in the sky
      this.spr.setOrigin(0.5, 0.5);
      this.baseY = 66;
      this.spr.y = this.baseY;
      this.tall = true;
    }
    this.hearts = [];
    var n = this.texts.length;
    for (var i = 0; i < n; i++) {
      var h = this.scene.add.sprite(0, 0, 'boss_heart', 0).setDepth(260);
      h.setVisible(false);
      this.hearts.push(h);
    }
  }
  layoutHearts() {}
  activate() {
    var x = this.spr.x, n = this.hearts.length, gap = Math.min(18, 140 / n);
    var hy = this.tall ? 30 : BK.GROUND_Y - 84;
    this.hearts.forEach(function (h, i) { h.setPosition(x + (i - (n - 1) / 2) * gap, hy); h.setVisible(true); });
    this.nameTag = BK.ui.text(this.scene, x, this.tall ? hy + 10 : hy - 22, this.def.name || '', { origin: [0.5, 0], color: 0xffe9c8 }).setDepth(260);
    BK.ui.toast(this.scene, 150, BK.GROUND_Y - 6, this.def.intro || '', 0xffe9c8, 1, 1500);
    BK.Encounter.prototype.activate.call(this);
    this.fighting = true;
    this.specT = this.def.specials ? this.def.specials.every - 2500 : 0;     // the first one comes soon
  }
  bubbleX() { return 150; }
  // below the hearts and the name (the big dragon flies high), and a little narrower
  bubbleY() { return this.tall ? BK.GROUND_Y - 30 : BK.GROUND_Y - 44; }
  update(dt) {
    this.tt = (this.tt || 0) + dt;
    if (this.spr && this.active !== false) this.spr.y = this.baseY + Math.round(Math.sin(this.tt / 300) * (this.tall ? 3 : 1));
    if (this.def.specials && this.fighting) this.updateSpecials(dt);
  }
  // ---- special characters (Halloween King): every few seconds the boss sends a slow
  // bubble with a mark like ! ? @ # €. Typing that mark pops it (and earns a coin);
  // if it reaches the hero it only bumps him. Nothing can be lost.
  updateSpecials(dt) {
    var sp = this.def.specials, lv = this.level;
    this.specT = (this.specT || 0) + dt;
    if (!this.proj && this.specT >= sp.every) {
      this.specT = 0;
      var ch = sp.chars[Math.floor(Math.random() * sp.chars.length)];
      if (ch === this.lastSpec && sp.chars.length > 1) ch = sp.chars[(sp.chars.indexOf(ch) + 1) % sp.chars.length];
      this.lastSpec = ch;
      this.spawnSpecial(ch);
    }
    var p = this.proj;
    if (!p) return;
    p.x -= sp.speed * dt / 1000;
    p.y = p.baseY + Math.sin(this.tt / 260) * 3;
    p.c.setPosition(p.x, p.y); p.t.setPosition(p.x, p.y - 1); if (p.h) p.h.setPosition(p.x, p.y + 15);
    if (p.x <= lv.hero.x + 14) {
      // it reached the hero: a bump, no harm
      BK.audio.sfx('key_bad', { volume: 0.4 });
      lv.tweens.add({ targets: lv.hero.sprite, x: lv.hero.sprite.x - 6, duration: 90, yoyo: true });
      BK.ui.toast(lv, 120, 66, BK.L('Hoppá! Legközelebb kapd el!', 'Oops! Catch the next one!'), 0xffd23c);
      this.killSpecial(false);
    }
  }
  spawnSpecial(ch) {
    var s = this.scene, x = this.spr.x - 30, y = BK.GROUND_Y - 34;
    var c = s.add.graphics().setDepth(225);
    c.fillStyle(0x3a1850, 0.95).fillCircle(0, 0, 10).lineStyle(2, 0xffa040, 1).strokeCircle(0, 0, 10);
    var t = BK.ui.text(s, x, y, ch, { origin: [0.5, 0.5], size: 1, px: 14, bold: true, color: 0xffe9a0 }).setDepth(226);
    var hint = BK.keyHint(ch);
    var h = hint ? BK.ui.text(s, x, y + 15, hint, { origin: [0.5, 0.5], px: 8, color: 0xfff2dc }).setDepth(226) : null;
    c.setPosition(x, y);
    this.proj = { ch: ch, x: x, y: y, baseY: y, c: c, t: t, h: h };
    BK.audio.sfx('ui', { volume: 0.5 });
    this.level.kb.setNext(ch);
  }
  killSpecial(caught) {
    var p = this.proj;
    if (!p) return;
    this.proj = null;
    if (caught) { BK.fx.burst(this.scene, p.x, p.y, false); BK.fx.coins(this.scene, p.x, p.y, 1); }
    [p.c, p.t, p.h].forEach(function (o) { if (o) o.destroy(); });
    if (this.level.kb && this.next !== null) this.level.kb.setNext(this.next);
  }
  // called by the Level before normal typing; true = the key popped the bubble
  trySpecial(ch) {
    if (!this.proj || ch !== this.proj.ch) return false;
    var p = this.proj;
    BK.fx.bolt(this.level, this.level.hero.x + 8, this.level.hero.y - 24, p.x, p.y);
    this.killSpecial(true);
    return true;
  }
  onChunk() {
    var h = this.hearts[this.chunk - 1];
    if (h) { h.play({ key: 'boss_heart', repeat: 0 }); this.scene.time.delayedCall(800, function () { h.setAlpha(0.25); }); }
    BK.audio.sfx('boss_hit');
    var s = this.spr;
    this.flash(80);
    this.scene.tweens.add({ targets: s, x: s.x + 18, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
    BK.audio.sfx(BK.pick(['v_great', 'v_woo', 'v_great_m']), { volume: 0.7 });
  }
  finish() {
    var s = this.scene, self = this;
    this.fighting = false;
    this.killSpecial(false);
    // the last heart breaks too, and only then does the boss give in
    var last = this.hearts[this.hearts.length - 1];
    if (last) { last.play({ key: 'boss_heart', repeat: 0 }); s.time.delayedCall(800, function () { last.setAlpha(0.25); }); }
    BK.audio.sfx('boss_hit');
    this.flash(80);
    return new Promise(function (ok) {
      s.time.delayedCall(900, function () {
        if (self.nameTag) self.nameTag.destroy();
        BK.audio.sfx('v_wow', { volume: 0.8 });
        BK.fx.confetti(s, self.spr.x, self.spr.y - 40);
        BK.fx.coins(s, self.spr.x, self.spr.y - 30, self.coins);
        BK.ui.toast(s, BK.W / 2, 60, self.def.outro || BK.L('Barátok lettetek!', 'You made friends!'), 0xffd23c, 2);
        s.tweens.add({ targets: self.spr, x: BK.W + 80, duration: 1400, delay: 600, ease: 'Quad.easeIn', onComplete: ok });
        self.spr.setFlipX(!self.spr.flipX);
        self.hearts.forEach(function (h) { s.tweens.add({ targets: h, alpha: 0, delay: 1200, duration: 300 }); });
      });
    });
  }
  destroy() { this.fighting = false; this.killSpecial(false); super.destroy(); this.hearts.forEach(function (h) { h.destroy(); }); }
};

/** Karou's shop: type "bolt" to open it. */
BK.Shop = class extends BK.Encounter {
  spawn(x) {
    this.x = x;
    this.stall = BK.ui.nine(this.scene, x - 22, BK.GROUND_Y - 30, 44, 30, 'ui_panel');
    this.stall.setDepth(39);
    this.bird = this.scene.add.sprite(x, BK.GROUND_Y - 26, 'karou_sit').setOrigin(0.5, 1).setDepth(41);
    this.bird.play('karou_sit');
    this.parts.push(this.stall, this.bird);
    this.stopX = BK.TARGET_X - 10;
  }
  bubbleY() { return BK.GROUND_Y - 60; }
  activate() {
    BK.audio.sfx('v_hiya', { volume: 0.6 });
    BK.ui.toast(this.scene, this.x, BK.GROUND_Y - 84, BK.T.shopGreet, 0xffe9c8);
    super.activate();
  }
  finish() {
    var level = this.level;
    return new Promise(function (ok) {
      level.openOverlay('Shop', ok);
    });
  }
};

/** Rest spot: a breather with a tip, then feed the pet by typing its name. */
BK.Rest = class extends BK.Encounter {
  spawn(x) {
    var s = this.scene;
    this.x = x;
    this.sign = s.add.sprite(x - 20, BK.GROUND_Y + 1, 'signpost', 0).setOrigin(0.5, 1).setDepth(40);
    var petId = this.def.pet;
    var pd = BK.PETS.find(function (p) { return p.id === petId; }) || BK.PETS[0];
    this.pd = pd;
    this.pet = s.add.sprite(x + 14, pd.flies ? BK.GROUND_Y - 20 : BK.GROUND_Y + 1, pd.sprite).setOrigin(0.5, 1).setDepth(41);
    this.pet.play(pd.sprite);
    this.pet.setFlipX(BK.FACES_LEFT[pd.sprite.split('_')[0]] !== true);
    this.parts.push(this.sign, this.pet);
    this.stopX = BK.TARGET_X - 20;
  }
  bubbleY() { return BK.GROUND_Y - 36; }
  activate() {
    var s = this.scene, self = this;
    BK.audio.music(BK.MUSIC.chill);
    var panel = BK.ui.nine(s, 82, 24, 220, 64, 'ui_panel2').setDepth(250);
    var t1 = BK.ui.text(s, 192, 48, BK.T.restText, { outline: false, origin: [0.5, 0.5], size: 1 }).setDepth(251);
    var t2 = BK.ui.text(s, 192, 60, BK.T.restTip, { outline: false, origin: [0.5, 0.5], color: 0x6b3a20 }).setDepth(251);
    s.time.delayedCall(3200, function () {
      panel.destroy(); t1.destroy(); t2.destroy();
      BK.ui.toast(s, BK.W / 2 - 60, 44, BK.T.feedPet + ' ' + self.pd.name, 0xffe9c8);
      BK.Encounter.prototype.activate.call(self);
      self.level.refreshNext();
    });
  }
  delayed() { return true; }
  finish() {
    BK.audio.sfx('chirp');
    var s = this.scene;
    for (var i = 0; i < 3; i++) {
      var h = s.add.sprite(this.pet.x + (i - 1) * 8, this.pet.y - 20, 'heart', 0).setDepth(60);
      s.tweens.add({ targets: h, y: h.y - 20, alpha: 0, delay: i * 120, duration: 700, onComplete: function (tw, t) { t[0].destroy(); } });
    }
    BK.fx.coins(s, this.pet.x, this.pet.y - 16, this.coins);
    var level = this.level;
    return new Promise(function (ok) { s.time.delayedCall(600, function () { level.playLevelMusic(); ok(); }); });
  }
};

BK.ENCOUNTERS = { walker: BK.Walker, flyer: BK.Flyer, gate: BK.Gate, bridge: BK.Bridge, chest: BK.Chest,
  mini: BK.Mini, boss: BK.Boss, shop: BK.Shop, rest: BK.Rest };

// creature id -> animation key
BK.CREATURES = { frog: 'frog_walk', mush: 'mush_walk', crab: 'crab_walk', crabkid: 'crabkid_walk', sandbug: 'sandbug_walk',
  starfish: 'starfish_idle', octopus: 'octopus_idle', shell: 'shell_idle', gull: 'gull_fly', crow: 'crow_fly', toad: 'toad_idle',
  frogknight: 'frogknight_idle', bigbird: 'bigbird_fly', dragon: 'dragon_fly', babydragon: 'babydragon_idle', slime: 'slime_idle' };

// ---------------------------------------------------------------------------
// Shared effects
// ---------------------------------------------------------------------------
BK.fx = {
  spark: function (scene, x, y) {
    var s = scene.add.sprite(x, y, 'fx_impact').setDepth(220);
    s.play({ key: 'fx_impact', repeat: 0 });
    s.on('animationcomplete', function () { s.destroy(); });
  },
  burst: function (scene, x, y, big) {
    var s = scene.add.sprite(x, y, big ? 'fx_burst_b' : 'fx_burst').setDepth(220);
    s.play({ key: big ? 'fx_burst_b' : 'fx_burst', repeat: 0 });
    s.on('animationcomplete', function () { s.destroy(); });
  },
  // The magic from the hero to the target at each correct key: the shape and
  // colour chosen in the shop (BK.SHOT_SHAPES / BK.SHOT_COLOURS, profile.fx).
  bolt: function (scene, x0, y0, x1, y1, fx) {
    fx = fx || (BK.state.profile && BK.state.profile.fx) || {};
    var shape = fx.shape || 'wave', set = BK.fx.colourSet(fx.colour);
    BK.fx.shotN = (BK.fx.shotN || 0) + 1;
    var n = BK.fx.shotN, tone = fx.tone || 0;
    var col = function (k) { return BK.fx.shotColour(set, tone, n + (k || 0)); };
    BK.fx.shotTextures(scene);
    var dx = x1 - x0, dy = y1 - y0, len = Math.max(1, Math.sqrt(dx * dx + dy * dy)), nx = -dy / len, ny = dx / len;
    var hit = function () {
      BK.fx.spark(scene, x1, y1);
      if (set.rtx) BK.fx.flare(scene, x1, y1);
      if (set.chrome) BK.fx.glint(scene, x1, y1);
    };
    // a moving thing: the shape, with a soft glow behind it for RTX and a shine for chrome
    var piece = function (key, x, y, k, scale) {
      var parts = [];
      if (set.rtx) parts.push(scene.add.image(x, y, 'shot_glow').setTint(BK.fx.shotColour(set, tone, n + 3)).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8).setDepth(220));
      var im = scene.add.image(x, y, key).setTint(col(k)).setDepth(221).setScale(scale || 1);
      if (set.rtx) im.setBlendMode(Phaser.BlendModes.ADD);
      if (set.chrome) scene.tweens.add({ targets: { p: 0 }, p: 1, duration: 60, yoyo: true, repeat: 3, onUpdate: function (tw) {
        var v = Math.round(160 + 95 * Math.abs(Math.sin(tw.progress * Math.PI))); im.setTint(Phaser.Display.Color.GetColor(v, v, Math.min(255, v + 12)));
      } });
      parts.push(im);
      return parts;
    };
    var fly = function (parts, ms, extra, done) {
      scene.tweens.add(Object.assign({ targets: parts, x: x1, y: y1, duration: ms || 120, ease: 'Quad.easeIn',
        onComplete: function () { parts.forEach(function (p) { p.destroy(); }); (done || hit)(); } }, extra || {}));
    };
    // something left behind on the way, fading
    var trail = function (x, y, key, k, scale, ms) {
      var d = scene.add.image(x, y, key).setTint(col(k)).setDepth(220).setScale(scale || 1);
      if (set.rtx) d.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: d, alpha: 0, scale: (scale || 1) * 0.3, duration: ms || 160, onComplete: function () { d.destroy(); } });
    };
    if (shape === 'star' || shape === 'sparkle') {
      fly(piece('shot_' + shape, x0, y0, 0, 1), 130, { angle: shape === 'star' ? 360 : 0, scale: { from: 0.8, to: 1.25 } });
      if (shape === 'sparkle') for (var i = 1; i <= 4; i++) (function (i) {
        scene.time.delayedCall(i * 22, function () {
          var f = 0.15 + i * 0.17;
          trail(x0 + dx * f + nx * (i % 2 ? 3 : -3), y0 + dy * f + ny * (i % 2 ? 3 : -3), 'shot_sparkle', i, 0.55, 200);
        });
      })(i);
    } else if (shape === 'wave') {
      // the standard: a dot that wiggles on its way
      var head = { t: 0 };
      scene.tweens.add({ targets: head, t: 1, duration: 150, ease: 'Linear', onUpdate: function () {
        var off = Math.sin(head.t * Math.PI * 4) * 4 * (1 - head.t);
        trail(x0 + dx * head.t + nx * off, y0 + dy * head.t + ny * off, 'shot_dot', 0, 1.2, 130);
      }, onComplete: hit });
    } else if (shape === 'comet') {
      // a bright round head with a long tail of embers
      var c = piece('shot_ball', x0, y0, 0, 1);
      var tr = { t: 0 };
      scene.tweens.add({ targets: tr, t: 1, duration: 150, ease: 'Quad.easeIn', onUpdate: function () {
        var x = x0 + dx * tr.t, y = y0 + dy * tr.t;
        c.forEach(function (p) { p.x = x; p.y = y; });
        trail(x - dx * 0.04 + nx * (Math.random() - 0.5) * 3, y - dy * 0.04 + ny * (Math.random() - 0.5) * 3, 'shot_dot', 1 + Math.floor(Math.random() * 3), 1, 260);
      }, onComplete: function () { c.forEach(function (p) { p.destroy(); }); hit(); } });
    } else if (shape === 'code') {
      // little bits of code streaming to the target, like in the films
      var glyphs = ['0', '1', '{', '}', '<', '>', '/', ';', '#'];
      for (var g2 = 0; g2 < 6; g2++) (function (g2) {
        scene.time.delayedCall(g2 * 20, function () {
          var off = (g2 % 3 - 1) * 4;
          var t = scene.add.text(x0 + nx * off, y0 + ny * off, glyphs[(n * 7 + g2 * 3) % glyphs.length],
            { fontFamily: 'monospace', fontSize: '8px', fontStyle: 'bold', color: '#' + col(g2).toString(16).padStart(6, '0') })
            .setOrigin(0.5).setDepth(221).setResolution(BK.RES || 1);
          if (set.rtx) t.setBlendMode(Phaser.BlendModes.ADD);
          scene.tweens.add({ targets: t, x: x1 + nx * off * 0.3, y: y1 + ny * off * 0.3, duration: 140, ease: 'Linear', onComplete: function () {
            t.destroy(); if (g2 === 5) hit();
          } });
          // a short "segment" left behind
          trail(x0 + dx * 0.3 + nx * off, y0 + dy * 0.3 + ny * off, 'shot_seg', g2, 1, 180);
        });
      })(g2);
    } else if (shape === 'bolt') {
      // a zigzag of lightning, there at once, gone quickly
      // every bolt different: 4-8 kinks at uneven spacing, random sides and sizes, sometimes a fork
      var gr = scene.add.graphics().setDepth(221), steps = 4 + Math.floor(Math.random() * 5), pts = [{ x: x0, y: y0 }], f0 = 0;
      for (var k = 1; k < steps; k++) {
        f0 = Math.min(0.95, f0 + (0.6 + Math.random() * 0.8) / steps);
        var j = (Math.random() < 0.5 ? 1 : -1) * (1.5 + Math.random() * 8);
        pts.push({ x: x0 + dx * f0 + nx * j, y: y0 + dy * f0 + ny * j });
      }
      pts.push({ x: x1, y: y1 });
      var fork = null;
      if (Math.random() < 0.45 && pts.length > 3) {
        var fp = pts[1 + Math.floor(Math.random() * (pts.length - 2))], fs = Math.random() < 0.5 ? 1 : -1, fl = 6 + Math.random() * 10;
        fork = [fp, { x: fp.x + dx / len * fl * 0.6 + nx * fs * fl * 0.5, y: fp.y + dy / len * fl * 0.6 + ny * fs * fl * 0.5 },
          { x: fp.x + dx / len * fl + nx * fs * fl * 0.3 + (Math.random() - 0.5) * 4, y: fp.y + dy / len * fl + ny * fs * fl * 0.3 }];
      }
      if (set.rtx) gr.setBlendMode(Phaser.BlendModes.ADD);
      [[5, col(1), 0.35], [3, col(), 1], [1, 0xffffff, 0.9]].forEach(function (l) {
        gr.lineStyle(l[0], l[1], l[2]); gr.strokePoints(pts);
        if (fork) { gr.lineStyle(Math.max(1, l[0] - 1), l[1], l[2]); gr.strokePoints(fork); }
      });
      scene.tweens.add({ targets: gr, alpha: 0, duration: 170, onComplete: function () { gr.destroy(); } });
      scene.time.delayedCall(30, hit);
    } else if (shape === 'grav') {
      // a ring that pulses on the way and rolls out wide where it lands
      var r = piece('shot_ring', x0, y0, 0, 0.5);
      fly(r, 160, { scale: 1, ease: 'Sine.easeIn' }, function () {
        hit();
        for (var q = 0; q < 2; q++) (function (q) {
          var w = scene.add.image(x1, y1, 'shot_ring').setTint(col(q + 1)).setDepth(221).setScale(0.6);
          if (set.rtx) w.setBlendMode(Phaser.BlendModes.ADD);
          scene.tweens.add({ targets: w, scale: 2.6 + q, alpha: 0, delay: q * 70, duration: 280, onComplete: function () { w.destroy(); } });
        })(q);
      });
    } else {
      fly(piece('shot_dot', x0, y0, 0, 1));
    }
  },
  colourSet: function (id) { return BK.SHOT_COLOURS.find(function (c) { return c.id === id; }) || BK.SHOT_COLOURS[0]; },
  // the colour of a shot: one picked colour, the rainbow, or the set's own
  shotColour: function (set, tone, k) {
    if (set.rainbow) return Phaser.Display.Color.HSVToRGB(((k * 0.09) % 1), 0.75, 1).color;
    if (set.rtx) return [0xfff8e8, 0x8ae8ff, 0xffc070, 0xd8a0ff][k % 4];
    if (set.pick) return set.cols[Math.min(tone || 0, set.cols.length - 1)];
    return set.cols[k % set.cols.length];
  },
  // RTX: a lens flare where the shot lands: a wide streak and a few ghost circles
  flare: function (scene, x, y) {
    var add = Phaser.BlendModes.ADD;
    var streak = scene.add.image(x, y, 'shot_glow').setTint(0x8ad8ff).setBlendMode(add).setDepth(222).setScale(4, 0.35).setAlpha(0.9);
    var core = scene.add.image(x, y, 'shot_glow').setTint(0xffffff).setBlendMode(add).setDepth(222).setScale(1.4);
    scene.tweens.add({ targets: [streak, core], alpha: 0, duration: 260, onComplete: function () { streak.destroy(); core.destroy(); } });
    // ghosts along the line through the screen centre, like a camera lens
    var cx = BK.W / 2, cy = BK.KB_TOP / 2;
    [0.5, 1.1, 1.6].forEach(function (f, i) {
      var gx = x + (cx - x) * f * 1.2, gy = y + (cy - y) * f * 1.2;
      var gh = scene.add.image(gx, gy, 'shot_ring').setTint([0xffb060, 0x80ffd0, 0xc090ff][i]).setBlendMode(add).setDepth(222).setScale(0.6 + i * 0.5).setAlpha(0.5);
      scene.tweens.add({ targets: gh, alpha: 0, duration: 300, onComplete: function () { gh.destroy(); } });
    });
  },
  // chrome: a quick white star glint where the shot lands
  glint: function (scene, x, y) {
    var g = scene.add.image(x - 2, y - 3, 'shot_sparkle').setTint(0xffffff).setDepth(222).setScale(0.3);
    scene.tweens.add({ targets: g, scale: 1.4, angle: 45, alpha: { from: 1, to: 0 }, duration: 240, onComplete: function () { g.destroy(); } });
  },
  // small white shapes for the shots, drawn once and tinted per shot
  shotTextures: function (scene) {
    if (scene.textures.exists('shot_glow')) return;
    var g = scene.make.graphics({ x: 0, y: 0, add: false });
    var star = function (cx, cy, pts, ro, ri) {
      var p = [];
      for (var i = 0; i < pts * 2; i++) { var a = -Math.PI / 2 + i * Math.PI / pts, r = i % 2 ? ri : ro; p.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); }
      g.fillPoints(p, true);
    };
    g.fillStyle(0xffffff, 1); star(4.5, 4.5, 5, 4.5, 2); g.generateTexture('shot_star', 9, 9); g.clear();
    g.fillStyle(0xffffff, 1); star(4.5, 4.5, 4, 4.5, 1.2); g.generateTexture('shot_sparkle', 9, 9); g.clear();
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 3, 3); g.generateTexture('shot_dot', 3, 3); g.clear();
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 1, 4); g.generateTexture('shot_seg', 1, 4); g.clear();
    g.fillStyle(0xffffff, 1); g.fillCircle(3, 3, 3); g.generateTexture('shot_ball', 6, 6); g.clear();
    g.lineStyle(1.5, 0xffffff, 1); g.strokeCircle(6, 6, 4.5); g.generateTexture('shot_ring', 12, 12); g.clear();
    // a soft round glow, for RTX
    for (var r = 8; r > 0; r--) { g.fillStyle(0xffffff, 0.09 + (8 - r) * 0.025); g.fillCircle(8, 8, r); }
    g.generateTexture('shot_glow', 16, 16);
    g.destroy();
  },
  coins: function (scene, x, y, n) {
    var level = scene;
    for (var i = 0; i < n; i++) {
      (function (i) {
        var c = scene.add.sprite(x, y, 'coin').setDepth(230);
        c.play('coin');
        scene.tweens.add({ targets: c, x: x + (i - (n - 1) / 2) * 10, y: y - 16, duration: 250, delay: i * 60, ease: 'Quad.easeOut' });
        scene.tweens.add({ targets: c, x: 12, y: 9, delay: 380 + i * 60, duration: 420, ease: 'Quad.easeIn', onComplete: function () {
          c.destroy();
          BK.audio.sfx('coin', { volume: 0.35, detune: i * 100 });
          if (level.addCoins) level.addCoins(1);
        } });
      })(i);
    }
  },
  confetti: function (scene, x, y) {
    for (var i = 0; i < 18; i++) {
      var c = scene.add.sprite(x, y, 'fx_confetti', i % 4).setDepth(230);
      var a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 50;
      scene.tweens.add({ targets: c, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r - 20, alpha: 0, duration: 900 + Math.random() * 500,
        ease: 'Quad.easeOut', onComplete: function (tw, t) { t[0].destroy(); } });
    }
  },
};
