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

    // A tiny synthesised "voice" blip (Web Audio, no file): the narrator's talking
    // sound, one blip per letter, pitched by the vowel, like in old video games.
    blip: function (freq, opts) {
      if (!wantSfx || !game || !game.sound || !game.sound.context) return;
      opts = opts || {};
      try {
        var ctx = game.sound.context, t = ctx.currentTime, len = opts.len || 0.045;
        var o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o1.type = 'square'; o2.type = 'triangle';
        o1.frequency.setValueAtTime(freq, t); o2.frequency.setValueAtTime(freq * 1.5, t);
        o1.frequency.exponentialRampToValueAtTime(freq * (opts.slide || 0.92), t + len);
        f.type = 'lowpass'; f.frequency.value = opts.cutoff || 2400;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(opts.volume || 0.07, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(game.sound.masterVolumeNode || ctx.destination);
        o1.start(t); o2.start(t); o1.stop(t + len + 0.02); o2.stop(t + len + 0.02);
      } catch (e) { /* no Web Audio: silent */ }
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
