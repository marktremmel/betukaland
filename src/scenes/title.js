/*
 * Title screen: logo, running bunny, press any key.
 */
BK.TitleScene = class extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    var s = this;
    BK.menuBackground(this, 1, { scroll: true, groundY: 176 });
    var hero = this.add.sprite(96, 177, 'bunny_run').setOrigin(0.5, 1); hero.play('bunny_run');
    var frog = this.add.sprite(300, 177, 'frog_taunt').setOrigin(0.5, 1).setFlipX(true); frog.play('frog_taunt');
    var gull = this.add.sprite(318, 104, 'gull_fly'); gull.play('gull_fly');
    this.tweens.add({ targets: gull, y: 110, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    var title = BK.ui.text(this, BK.W / 2, 44, BK.T.title, { size: 4, origin: [0.5, 0.5], color: 0xffd23c });
    BK.ui.text(this, BK.W / 2, 74, BK.T.subtitle, { size: 2, origin: [0.5, 0.5], color: 0xfff2dc });
    this.tweens.add({ targets: title, y: 47, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    var press = BK.ui.text(this, BK.W / 2, 118, BK.T.pressKey, { origin: [0.5, 0.5], color: 0xffffff });
    this.tweens.add({ targets: press, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    BK.ui.button(this, 42, 202, BK.T.teacher, function () { s.scene.start('Teacher'); }, { w: 66, h: 18 });
    BK.ui.button(this, BK.W - 42, 202, BK.T.credits, function () { s.scene.start('Credits'); }, { w: 66, h: 18 });
    // interface language: Magyar / English (the button shows the other one)
    var lb = BK.ui.button(this, BK.W - 36, 14, BK.T.language, function () {
      BK.applyUiLang(BK.uiLang === 'en' ? 'hu' : 'en', null);
      s.scene.restart();
    }, { w: 60, h: 18 });
    lb.zone.on('pointerdown', function () { s.langClick = true; });
    if (BK.DEBUG) BK.ui.text(this, BK.W / 2, 140, BK.L('TESZT MÓD: minden pálya nyitva', 'TEST MODE: every level open'), { origin: [0.5, 0.5], color: 0xff9a7a });
    BK.ui.text(this, BK.W / 2, 208, 'v' + BK.VERSION, { origin: [0.5, 0.5], color: 0xfff2dc }).setAlpha(0.6);

    BK.audio.music(BK.MUSIC.title);
    var go = function () { if (s.leaving) return; s.leaving = true; BK.audio.sfx('chime'); s.scene.start('Profiles'); };
    this.input.keyboard.once('keydown', function (e) { if (e.key !== 'Tab') go(); });
    var zone = this.add.zone(BK.W / 2, 110, BK.W, 150).setInteractive();
    zone.on('pointerup', function () { if (!s.langClick) go(); });
    if (!BK.save.storageOk()) {
      BK.ui.text(this, BK.W / 2, 140, BK.L('A böngésző nem enged menteni. A haladás nem marad meg.', 'This browser does not allow saving. Progress will be lost.'), { origin: [0.5, 0.5], color: 0xff9a7a });
    }
  }
};

/*
 * Credits: every pack used, from assets/manifest.js (BK_CREDITS).
 */
BK.CreditsScene = class extends Phaser.Scene {
  constructor() { super('Credits'); }
  create() {
    var s = this;
    BK.menuBackground(this, 2, { groundY: 196 });
    BK.ui.nine(this, 14, 4, BK.W - 28, 190, 'ui_panel2');
    BK.ui.text(this, BK.W / 2, 36, BK.T.creditsTitle, { outline: false, size: 2, origin: [0.5, 0.5] });
    var y = 48;
    var EN = { 'Grafika': 'Graphics', 'Felület': 'Interface', 'Ikonok': 'Icons', 'Effektek': 'Effects', 'Égbolt': 'Skies',
      'Betűtípus': 'Font', 'Zene': 'Music', 'Hangok': 'Sounds', 'Motor': 'Engine' };
    (window.BK_CREDITS || []).forEach(function (c) {
      BK.ui.text(s, 34, y, BK.uiLang === 'en' ? (EN[c[0]] || c[0]) : c[0], { outline: false, color: 0x9a3d1a });
      var t = BK.ui.text(s, 100, y, c[1], { outline: false, width: 250 });
      y += 11;
    });
    
    BK.ui.button(this, BK.W / 2, 204, BK.T.back, function () { s.scene.start('Title'); }, { w: 70, h: 18, key: 'ESC' });
  }
};
