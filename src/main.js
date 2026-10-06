/*
 * Starts Phaser with pixel-perfect scaling: the 384x216 canvas is zoomed by
 * the largest whole number that fits the window (3x on 1366x768, 4x on 1080p),
 * nearest-neighbour, centred.
 */
(function () {
  // ?resetpin in the address clears the teacher PIN (keeps every profile)
  if (/[?&]resetpin\b/.test(location.search)) {
    var st = BK.save.load();
    st.teacher.pinHash = null;
    BK.save.persist();
  }

  BK.setUiLang(BK.save.uiLang());

  // Display size: the 384x216 world is shown at the largest whole-number zoom
  // that fits the window (3x on 1366x768, 4x on 1080p). The canvas itself is
  // drawn at that size times the screen's pixel density, and every scene's
  // camera zooms in by BK.RES, so pixel art stays sharp and text (real font,
  // rendered at full resolution) stays crisp instead of blocky.
  function zoomFor() {
    var z = Math.floor(Math.min(window.innerWidth / BK.W, window.innerHeight / BK.H));
    return Math.max(1, z);
  }
  var DPR = Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)));
  BK.RES = Math.min(8, zoomFor() * DPR);

  // every scene: camera shows the 384x216 world at BK.RES
  var scenes = [BK.BootScene, BK.TitleScene, BK.CreditsScene, BK.ProfilesScene, BK.NewProfileScene, BK.PlacementScene,
    BK.MapScene, BK.PracticeScene, BK.LevelScene, BK.ResultsScene, BK.ShopScene, BK.BagScene, BK.SettingsScene, BK.TeacherScene];
  scenes.forEach(function (C) {
    var create = C.prototype.create;
    C.prototype.create = function () {
      this.cameras.main.setZoom(BK.RES).centerOn(BK.W / 2, BK.H / 2);
      return create ? create.apply(this, arguments) : undefined;
    };
  });

  function start() {
    var config = {
      type: Phaser.AUTO,
      parent: 'game',
      width: BK.W * BK.RES,
      height: BK.H * BK.RES,
      pixelArt: true,
      roundPixels: true,
      backgroundColor: '#2b1a14',
      scale: { mode: Phaser.Scale.NONE, zoom: zoomFor() / BK.RES, autoCenter: Phaser.Scale.CENTER_BOTH },
      audio: { disableWebAudio: false },
      input: { keyboard: { target: window } },
      scene: scenes,
    };
    var game = new Phaser.Game(config);
    window.BK_GAME = game;
    window.addEventListener('resize', function () {
      game.scale.setZoom(zoomFor() / BK.RES);
    });
  }

  // Load the fonts (embedded in assets/fonts/fonts.js) before any text is drawn
  BK.applyFont(BK.save.font(), null);
  var faces = [];
  if (window.FontFace && window.BK_FONT_DATA) {
    BK.FONTS.forEach(function (F) {
      var data = BK_FONT_DATA[F.id];
      if (!data) return;
      [['regular', '400'], ['bold', '700']].forEach(function (w) {
        var face = new FontFace(F.family, 'url(' + data[w[0]] + ')', { weight: w[1] });
        document.fonts.add(face);
        faces.push(face.load().catch(function (e) { console.warn('font failed', F.id, e); }));
      });
    });
  }
  var started = false;
  var go = function () { if (!started) { started = true; start(); } };
  Promise.all(faces).then(go);
  setTimeout(go, 3000);     // never wait forever for a font

  // Space, quote and slash would scroll or open quick-find in some browsers
  window.addEventListener('keydown', function (e) {
    if (BK.DEBUG && e.key === 'Tab') e.preventDefault();
    if ((e.key === ' ' || e.key === "'" || e.key === '/' || e.key === 'Backspace') && document.getElementById('overlay').style.display !== 'flex') e.preventDefault();
  });
})();
