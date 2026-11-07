/*
 * Spoken lines (tools/voice: Piper and Kokoro for the characters and the narration, Azure Noémi
 * for the words the child types). data/voice_index.js maps every recorded text to its file in
 * assets/voice/<lang>/; nothing is loaded until it is played, and the game works the same
 * without the files.
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
    if (I[k]) return [I[k][0]];
    // a word pair or a short phrase: word by word
    var ws = k.replace(/[.,!?:;]/g, '').split(' ').filter(Boolean);
    if (ws.length > 1 && ws.length <= 4 && ws.every(function (w) { return I[w]; })) return ws.map(function (w) { return I[w][0]; });
    return null;
  }
  function play(list, lang, opts) {
    BK.voice.stop();
    if (!list || !list.length) return false;
    var my = ++seq, i = 0;
    var next = function () {
      if (my !== seq || i >= list.length) { if (my === seq) { cur = null; BK.audio.duck && BK.audio.duck(false); if (opts && opts.onEnd) opts.onEnd(); } return; }
      var a = new Audio('assets/voice/' + lang + '/' + list[i++]);
      a.volume = (opts && opts.volume) || 1;
      cur = a;
      a.onended = function () { setTimeout(next, 120); };
      a.onerror = function () { if (my === seq) { cur = null; BK.audio.duck && BK.audio.duck(false); } };
      var p = a.play(); if (p && p.catch) p.catch(function () { if (my === seq) { cur = null; BK.audio.duck && BK.audio.duck(false); } });
    };
    BK.audio.duck && BK.audio.duck(true);
    next();
    return true;
  }
  return {
    has: function (text, lang) { return !!files(text, lang || BK.uiLang); },
    // who speaks a recorded text ('king', 'reader', ...), or null
    charOf: function (text, lang) { var I = idx(lang || BK.uiLang), e = I && I[key(text)]; return e ? e[2] : null; },
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
    stop: function () { seq++; if (cur) { try { cur.pause(); } catch (e) {} cur = null; } BK.audio.duck && BK.audio.duck(false); },
    speaking: function () { return !!cur; },
  };
})();
