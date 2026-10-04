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

  function zoomFor() {
    var z = Math.floor(Math.min(window.innerWidth / BK.W, window.innerHeight / BK.H));
    return Math.max(1, z);
  }

  var config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: BK.W,
    height: BK.H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#2b1a14',
    scale: { mode: Phaser.Scale.NONE, zoom: zoomFor(), autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { disableWebAudio: false },
    input: { keyboard: { target: window } },
    scene: [BK.BootScene, BK.TitleScene, BK.CreditsScene, BK.ProfilesScene, BK.NewProfileScene, BK.PlacementScene,
      BK.MapScene, BK.PracticeScene, BK.LevelScene, BK.ResultsScene, BK.ShopScene, BK.BagScene, BK.SettingsScene, BK.TeacherScene],
  };

  var game = new Phaser.Game(config);
  window.BK_GAME = game;

  window.addEventListener('resize', function () {
    game.scale.setZoom(zoomFor());
  });
  // Space, quote and slash would scroll or open quick-find in some browsers
  window.addEventListener('keydown', function (e) {
    if (BK.DEBUG && e.key === 'Tab') e.preventDefault();
    if ((e.key === ' ' || e.key === "'" || e.key === '/' || e.key === 'Backspace') && document.getElementById('overlay').style.display !== 'flex') e.preventDefault();
  });
})();
