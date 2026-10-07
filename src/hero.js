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
    if (this.def.flies && !this.scene.tweens.isTweening(this.sprite)) this.sprite.y = this.groundY + Math.round(Math.sin(this.t / 260) * 2);
    if (this.pet) {
      if (this.petDef.flies) this.pet.y = this.pet.baseY + Math.sin(this.t / 260) * 3;
      if (this.pet.anims.isPlaying === false) this.pet.play(this.petDef.sprite);
    }
  }
  get x() { return this.sprite.x; }
  get y() { return this.groundY; }
};
