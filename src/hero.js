/*
 * The hero (the figure the child picked, in the chosen outfit) and the
 * optional pet that follows.
 */
BK.Hero = class {
  constructor(scene, x, y, profile) {
    this.scene = scene;
    var def = this.def = BK.heroOf(profile);
    this.k = { idle: BK.outfitKey(def.idle, profile), run: BK.outfitKey(def.run, profile) };
    this.groundY = def.flies ? y - 22 : y;
    this.sprite = scene.add.sprite(x, this.groundY, this.k.idle).setOrigin(0.5, 1).setDepth(50);
    // heroes look right, towards what is coming
    this.sprite.setFlipX(BK.FACES_LEFT[def.id] === true);
    this.state = '';
    this.idle();
    this.pet = null;
    var petDef = profile && profile.pet ? BK.PETS.find(function (p) { return p.id === profile.pet; }) : null;
    if (petDef) {
      this.petDef = petDef;
      this.pet = scene.add.sprite(x - 26, petDef.flies ? y - 40 : y, petDef.sprite).setOrigin(0.5, 1).setDepth(49);
      this.pet.play(petDef.sprite);
      this.pet.setFlipX(BK.FACES_LEFT[petDef.sprite.split('_')[0]] === true);   // pets look the way the hero walks
      this.pet.baseY = this.pet.y;
    }
    this.t = 0;
  }
  run() {
    if (this.state === 'run') return;
    this.state = 'run';
    this.sprite.play(this.k.run);
    if (this.sprite.anims.isPaused) this.sprite.anims.resume();   // idle() may have paused it
  }
  idle() {
    if (this.state === 'idle') return;
    this.state = 'idle';
    this.sprite.play(this.k.idle);
    // figures without a separate standing animation stand still on their first frame
    if (this.def.idle === this.def.run && !this.def.flies) { this.sprite.anims.pause(); this.sprite.setFrame(0); }
  }
  // tiny hop when a word is finished
  cheer() {
    var s = this.sprite, y = this.groundY;
    this.scene.tweens.add({ targets: s, y: y - 6, duration: 110, yoyo: true, ease: 'Quad.easeOut' });
  }
  update(dt) {
    this.t += dt;
    var sp = this.sprite;
    // figures with no standing animation (most drawn ones) breathe and shift their weight now and
    // then, so they do not stand frozen while the child types
    if (!this.def.flies && this.def.idle === this.def.run) {
      if (!this.bs) this.bs = { x: sp.scaleX, y: sp.scaleY };
      if (this.state === 'idle') {
        var br = Math.sin(this.t / 420);
        sp.setScale(this.bs.x * (1 - br * 0.012), this.bs.y * (1 + br * 0.025));
        this.fidget = (this.fidget || 2500 + Math.random() * 2500) - dt;
        if (this.fidget <= 0) {
          // two steps of the walk, then back to standing
          this.fidget = 3500 + Math.random() * 4000;
          var self = this, f = 1 + Math.floor(Math.random() * 2);
          sp.setFrame(f);
          this.scene.time.delayedCall(140, function () { if (self.state === 'idle' && sp.active) sp.setFrame(f + 1); });
          this.scene.time.delayedCall(300, function () { if (self.state === 'idle' && sp.active) sp.setFrame(0); });
        }
      } else if (sp.scaleY !== this.bs.y) sp.setScale(this.bs.x, this.bs.y);
    }
    // the frog looks back over its shoulder now and then
    if (this.def.id === 'frog') {
      this.look = (this.look || 4000 + Math.random() * 4000) - dt;
      if (this.look <= 0) {
        this.look = 5000 + Math.random() * 5000;
        var face = BK.FACES_LEFT.frog === true;
        sp.setFlipX(!face);
        this.scene.time.delayedCall(700, function () { if (sp.active) sp.setFlipX(face); });
      }
    }
    if (this.def.flies && !this.scene.tweens.isTweening(this.sprite)) this.sprite.y = this.groundY + Math.round(Math.sin(this.t / 260) * 2);
    if (this.pet) {
      if (this.petDef.flies) this.pet.y = this.pet.baseY + Math.sin(this.t / 260) * 3;
      if (this.pet.anims.isPlaying === false) this.pet.play(this.petDef.sprite);
    }
  }
  get x() { return this.sprite.x; }
  get y() { return this.groundY; }
};
