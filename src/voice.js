/*
 * Spoken lines (tools/voice: Piper and Kokoro for the characters and the narration, Azure Noémi
 * for the words the child types). The lines are joined into a few long files per language
 * (itch.io allows about 1000 files); data/voice_index.js says where each line starts and ends
 * in which file. A file is loaded only when one of its lines is first played, and the game works
 * the same without the files.
 *   BK.voice.say(text, lang)       a character or the narrator speaks (Settings: Felolvasás)
 *   BK.voice.typed(text, lang)     what the child is about to type (Settings: Szavak felolvasása)
 *   BK.voice.stop()
 * A text not recorded as a whole (a word pair) is said word by word, when every word is there.
 */
BK.voice = (function () {
  var cur = null, seq = 0;
  var key = function (t) { return String(t || '').replace(/["„”“()]/g, '').replace(/\s+/g, ' ').trim().toLowerCase(); };
  var idx = function (lang) { return (window.BK_VOICE && BK_VOICE[lang]) || null; };
  var settings = function () { var P = BK.state && BK.state.profile; return (P && P.settings) || {}; };
  function files(text, lang) {
    var I = idx(lang); if (!I || !text) return null;
    var k = key(text);
    if (I[k]) return [I[k]];
    // a word pair or a short phrase: word by word
    var ws = k.replace(/[.,!?:;]/g, '').split(' ').filter(Boolean);
    if (ws.length > 1 && ws.length <= 4 && ws.every(function (w) { return I[w]; })) return ws.map(function (w) { return I[w]; });
    return null;
  }
  var els = {};                // one <audio> per bundle, kept for the next line
  function el(lang, file) {
    var k = lang + '/' + file;
    if (!els[k]) { els[k] = new Audio('assets/voice/' + k); els[k].preload = 'auto'; }
    return els[k];
  }
  var tick = null;
  function play(list, lang, opts) {
    BK.voice.stop();
    if (!list || !list.length) return false;
    var my = ++seq, i = 0;
    var done = function () { if (my === seq) { cur = null; if (tick) { clearInterval(tick); tick = null; } BK.audio.duck && BK.audio.duck(false); if (opts && opts.onEnd) opts.onEnd(); } };
    var next = function () {
      if (my !== seq) return;
      if (i >= list.length) { done(); return; }
      var e = list[i++], a = el(lang, e[0]), start = e[1], end = e[2];
      cur = a;
      var tries = 0;
      var go = function () {
        if (my !== seq) return;
        var at = Math.max(0, start - 0.02);
        try { a.currentTime = at; } catch (x) {}
        // a server that cannot send part of a file: wait until the whole bundle is there, then seek
        if (Math.abs(a.currentTime - at) > 0.25 && tries++ < 1) { a.addEventListener('canplaythrough', go, { once: true }); return; }
        a.volume = (opts && opts.volume) || 1;
        var p = a.play(); if (p && p.catch) p.catch(function () { done(); });
        if (tick) clearInterval(tick);
        // stop at the end of the line (the silence after it gives some room)
        tick = setInterval(function () {
          if (my !== seq) { clearInterval(tick); return; }
          if (a.currentTime >= end + 0.05 || a.ended) { a.pause(); clearInterval(tick); tick = null; setTimeout(next, 120); }
        }, 25);
      };
      if (a.readyState >= 1) go();
      else { a.addEventListener('loadedmetadata', go, { once: true }); a.addEventListener('error', done, { once: true }); a.load(); }
    };
    BK.audio.duck && BK.audio.duck(true);
    next();
    return true;
  }
  return {
    has: function (text, lang) { return !!files(text, lang || BK.uiLang); },
    // who speaks a recorded text ('king', 'reader', ...), or null
    charOf: function (text, lang) { var I = idx(lang || BK.uiLang), e = I && I[key(text)]; return e ? e[3] : null; },
    // narration and characters: on unless switched off in Settings
    say: function (text, lang, opts) {
      if (settings().voice === false) return false;
      return play(files(text, lang || BK.uiLang), lang || BK.uiLang, opts);
    },
    // the text to type, by the Settings choice: 'off', 'miss' (after two wrong keys), 'always'
    typed: function (text, lang, why) {
      var m = settings().readAloud || 'miss';
      if (m === 'off' || (m === 'miss' && why !== 'miss' && why !== 'ask')) return false;
      return play(files(text, lang), lang);
    },
    stop: function () { seq++; if (tick) { clearInterval(tick); tick = null; } if (cur) { try { cur.pause(); } catch (e) {} cur = null; } BK.audio.duck && BK.audio.duck(false); },
    speaking: function () { return !!cur; },
  };
})();
