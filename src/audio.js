/*
 * Sound: short effects through Phaser (Web Audio, decoded once),
 * music through a plain <audio> element (streams, low memory on Chromebooks).
 * Both respect the current profile's settings.
 */
BK.audio = (function () {
  var game = null, musicEl = null, musicKey = null, wantMusic = true, wantSfx = true;
  var VOL = 0.45;            // music volume
  var unlockBound = false;

  function url(key) {
    var u = BK_MANIFEST.music[key];
    return (window.BK_PACK && BK_PACK[u]) || u;
  }

  function tryPlay() {
    if (!musicEl || !wantMusic) return;
    var p = musicEl.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked until the first key or click */ });
  }

  function bindUnlock() {
    if (unlockBound) return;
    unlockBound = true;
    var h = function () { tryPlay(); };
    window.addEventListener('keydown', h);
    window.addEventListener('pointerdown', h);
  }

  return {
    init: function (g) { game = g; bindUnlock(); },

    apply: function (settings) {
      wantMusic = !!(settings ? settings.music : true);
      wantSfx = !!(settings ? settings.sfx : true);
      if (!wantMusic && musicEl) musicEl.pause();
      if (wantMusic) tryPlay();
    },

    sfx: function (key, opts) {
      if (!wantSfx || !game || !game.cache.audio.exists(key)) return;
      opts = opts || {};
      try {
        game.sound.play(key, { volume: opts.volume !== undefined ? opts.volume : 0.6, rate: opts.rate || 1, detune: opts.detune || 0 });
      } catch (e) { /* ignore audio errors */ }
    },

    music: function (key) {
      if (key === musicKey && musicEl) { tryPlay(); return; }
      musicKey = key;
      var old = musicEl;
      if (old) {
        var fade = setInterval(function () {
          old.volume = Math.max(0, old.volume - 0.08);
          if (old.volume <= 0.01) { clearInterval(fade); old.pause(); old.src = ''; }
        }, 40);
      }
      if (!key) { musicEl = null; return; }
      musicEl = new Audio(url(key));
      musicEl.loop = true;
      musicEl.volume = VOL;
      tryPlay();
    },

    stopMusic: function () { this.music(null); },
  };
})();
