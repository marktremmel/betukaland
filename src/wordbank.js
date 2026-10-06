/*
 * Word bank: turns the big word lists into practice material for one region
 * and phase, using only keys the child has unlocked.
 *
 * Phases: letters -> syllables -> words -> pairs -> sentences.
 * Adaptive: about a third of the picks favour the child's weakest keys
 * (BK.adaptive.weakness), and most picks include the region's new keys.
 */
BK.wordbank = (function () {
  var VOWELS = 'aáeéiíoóöőuúüű';
  var BLOCK = ['fasz', 'szar', 'kaka', 'kak', 'fos', 'segg', 'pina', 'kur', 'buzi', 'ass', 'sex', 'szex',
    'fuck', 'shit', 'dick', 'hülye', 'pöcs', 'geci', 'cigi', 'pisa', 'kúr'];
  var cache = {};

  function splitWords(text) {
    var seen = {}, out = [];
    text.split(/\s+/).forEach(function (w) {
      w = BK.util.norm(w.trim());
      if (w && !seen[w]) { seen[w] = 1; out.push(w); }
    });
    return out;
  }

  function lists(lang) {
    if (!cache[lang]) {
      cache[lang] = lang === 'en'
        ? { words: splitWords(window.BK_WORDS_EN || ''), sentences: (window.BK_SENTENCES_EN || []).map(BK.util.norm),
            nouns: splitWords(window.BK_NOUNS_EN || ''), stories: window.BK_STORIES_EN || [] }
        : { words: splitWords(window.BK_WORDS_HU || ''), sentences: (window.BK_SENTENCES_HU || []).map(BK.util.norm),
            nouns: splitWords(window.BK_NOUNS_HU || ''), stories: window.BK_STORIES_HU || [] };
    }
    return cache[lang];
  }

  // All characters allowed once region r (1-based) is unlocked
  function allowed(r) {
    var set = { ' ': 1 };
    var caps = false;
    for (var i = 0; i < r && i < BK.REGIONS.length; i++) {
      var reg = BK.REGIONS[i];
      reg.keys.split('').forEach(function (c) { set[c] = 1; });
      if (reg.capitals) caps = true;
    }
    if (caps) {
      Object.keys(set).forEach(function (c) { var u = c.toUpperCase(); if (u !== c) set[u] = 1; });
    }
    // a keyboard without accent keys (English QWERTY): never ask for á é í ó ö ő ú ü ű
    if (BK.layout && !BK.layout.accents) BK.ACCENTS.split('').forEach(function (c) { delete set[c]; });
    return set;
  }

  // The keys a region introduces (what its letters/syllables phases drill)
  function focus(r) {
    var reg = BK.REGIONS[r - 1];
    var noAcc = function (c) { return !(BK.layout && !BK.layout.accents && BK.ACCENTS.indexOf(c) >= 0); };
    if (reg.capitals) return 'ASDFJKLÉGHQWERTZUIOPYXCVBNM'.split('').filter(noAcc);
    if (reg.stories || !reg.keys) return [];
    return reg.keys.replace(/[,.\-]/g, '').split('').filter(noAcc);
  }

  function fits(word, set) {
    for (var i = 0; i < word.length; i++) if (!set[word[i]]) return false;
    return true;
  }
  function blocked(tok) {
    var t = tok.toLowerCase();
    for (var i = 0; i < BLOCK.length; i++) if (t.indexOf(BLOCK[i]) >= 0) return true;
    return false;
  }
  function hasAny(word, chars) {
    for (var i = 0; i < chars.length; i++) if (word.indexOf(chars[i]) >= 0) return true;
    return false;
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  /**
   * A Picker hands out practice strings for one region + language + band.
   * rng: BK.util.rng instance (seeded for daily challenge)
   * profile: used for adaptive weighting (may be null)
   */
  function Picker(regionId, lang, band, rng, profile, practice) {
    this.r = regionId;
    this.practice = !!practice;     // practice mode: every sentence the keys allow, not only the region's new ones
    this.rng = rng;
    this.profile = profile;
    this.band = band;
    this.set = allowed(regionId);
    this.focus = focus(regionId);
    this.recent = [];
    // English has no accented words: Region 5 practises them with Hungarian words
    if (lang === 'en' && BK.layout.accents && BK.REGIONS[regionId - 1].keys.indexOf('á') >= 0) lang = 'hu';
    var L = lists(lang);
    this.lang = lang;
    this.numbers = /[0-9]/.test(BK.REGIONS[regionId - 1].keys);
    this.stories = (L.stories || []).map(function (st) { return (st.lines || st).map(BK.util.norm); });
    this.storyI = -1; this.lineI = 0;
    var maxLen = band === '3-4' ? 7 : 10;
    var set = this.set;
    this.words = L.words.filter(function (w) { return w.length <= maxLen && fits(w, set); });
    if (BK.REGIONS[regionId - 1].capitals || regionId >= 4) {
      // from Region 4 on, some words come capitalised
      var capped = this.words.map(cap).filter(function (w) { return fits(w, set); });
      this.capWords = capped;
    }
    this.sentences = L.sentences.filter(function (s) { return fits(s, set); });
    if (BK.REGIONS[regionId - 1].stories) {
      var big = this.sentences.filter(function (x) { return /^[A-ZÁÉÍÓÖŐÚÜŰ"]/.test(x) && x.length >= 12; });
      if (big.length >= 5) this.sentences = big;
    }
    this.nouns = (L.nouns || []).filter(function (w) { return w.length <= 7 && fits(w, set); });
    // Prefer sentences that need this region's skills (not typeable one region earlier)
    if (regionId > 1 && !this.practice) {
      var prev = allowed(regionId - 1);
      var fresh = this.sentences.filter(function (s) { return !fits(s, prev); });
      if (fresh.length >= 3) this.sentences = fresh;
    }
    var letters = Object.keys(set).filter(function (c) { return c !== ' '; });
    this.vowels = letters.filter(function (c) { return VOWELS.indexOf(c) >= 0; });
    this.consonants = letters.filter(function (c) { return VOWELS.indexOf(c) < 0 && /\p{L}/u.test(c) && c === c.toLowerCase(); });
  }

  Picker.prototype._fresh = function (tok) {
    if (this.recent.indexOf(tok) >= 0) return false;
    this.recent.push(tok);
    if (this.recent.length > 10) this.recent.shift();
    return true;
  };

  Picker.prototype._adaptivePick = function (cands) {
    var rng = this.rng, prof = this.profile;
    if (!cands.length) return null;
    if (prof && rng.chance(0.35)) {
      var w = cands.map(function (c) { return 1 + 6 * BK.adaptive.wordWeakness(prof, c); });
      return rng.weighted(cands, w);
    }
    return rng.pick(cands);
  };

  Picker.prototype.letters = function () {
    var f = this.focus.length ? this.focus : Object.keys(this.set).filter(function (c) { return c !== ' ' && /\p{L}/u.test(c); });
    var rng = this.rng, n = this.band === '3-4' ? 1 + rng.int(2) : 2 + rng.int(2);
    for (var tries = 0; tries < 20; tries++) {
      var t = '';
      // first letter: weak keys get extra chances
      var cands = f.slice();
      var first = this._adaptivePick(cands);
      t += first;
      for (var i = 1; i < n; i++) t += rng.chance(0.5) ? first : rng.pick(f);
      if (!blocked(t) && this._fresh(t)) return t;
    }
    return t;
  };

  Picker.prototype.syllables = function () {
    var rng = this.rng, V = this.vowels, C = this.consonants, f = this.focus;
    if (!V.length || !C.length) return this.letters();
    var capitals = BK.REGIONS[this.r - 1].capitals;
    for (var tries = 0; tries < 30; tries++) {
      var c = (f.length && rng.chance(0.6)) ? rng.pick(f).toLowerCase() : rng.pick(C);
      if (VOWELS.indexOf(c) >= 0) c = rng.pick(C);
      var v = (f.length && rng.chance(0.4)) ? rng.pick(f.filter(function (x) { return VOWELS.indexOf(x) >= 0; }).concat(V)) : rng.pick(V);
      var shape = rng.int(3), t;
      if (shape === 0) t = c + v;
      else if (shape === 1) t = v + c;
      else t = c + v + rng.pick(C);
      if (capitals) t = cap(t);
      if (!fits(t, this.set) || blocked(t)) continue;
      if (this._fresh(t)) return t;
    }
    return t;
  };

  Picker.prototype.word = function () {
    var pool = this.words, rng = this.rng;
    if (this.capWords && rng.chance(BK.REGIONS[this.r - 1].capitals ? 0.6 : 0.25)) pool = this.capWords;
    if (!pool.length) return this.syllables();
    var f = this.focus;
    var withFocus = f.length ? pool.filter(function (w) { return hasAny(w, f); }) : [];
    var src = (withFocus.length >= 5 && rng.chance(0.65)) ? withFocus : pool;
    for (var tries = 0; tries < 20; tries++) {
      var w = this._adaptivePick(src);
      if (this._fresh(w)) return w;
    }
    return rng.pick(src);
  };

  Picker.prototype.pair = function () {
    var a = this.word(), b = this.word();
    if (this.r >= 4) b = b.toLowerCase();   // only the first word of a pair may start with a capital
    var p = a + ' ' + b;
    return fits(p, this.set) ? p : a;
  };

  Picker.prototype.sentence = function () {
    var rng = this.rng;
    var pool = this.sentences;
    var fresh = pool.filter(function (s) { return this.recent.indexOf(s) < 0; }, this);
    if (fresh.length) { var s = rng.pick(fresh); this._fresh(s); return s; }
    if (pool.length) return rng.pick(pool);
    // fallback: three words
    return [this.word(), this.word(), this.word()].join(' ');
  };

  // ---- Region 6: numbers and punctuation -------------------------------
  Picker.prototype._num = function () {
    var r = this.rng.int(10);
    if (r < 4) return String(1 + this.rng.int(9));
    if (r < 8) return String(10 + this.rng.int(90));
    return String(100 + this.rng.int(1900));
  };
  Picker.prototype._noun = function () { return this.nouns.length ? this.rng.pick(this.nouns) : this.rng.pick(this.words); };
  Picker.prototype.numLetters = function () {
    var rng = this.rng, f = this.focus;
    var t = rng.chance(0.65) ? rng.pick('0123456789'.split('')) : rng.pick(f);
    if (this.band !== '3-4' && rng.chance(0.5)) t += rng.pick('0123456789'.split(''));
    return t;
  };
  Picker.prototype.numSyllables = function () {
    var rng = this.rng, n = this._num();
    return rng.pick([n, n, n + '!', n + '?', '(' + n + ')', (1 + rng.int(12)) + ':' + (10 + rng.int(50))]);
  };
  Picker.prototype.numWord = function () {
    var rng = this.rng, w = this._noun(), n = this._num();
    var hu = this.lang === 'hu';
    return rng.pick([n + ' ' + w, n + ' ' + w, cap(w) + '!', cap(w) + '?', '(' + n + ')', '"' + cap(w) + '"',
      hu ? w + ': ' + n : w + ': ' + n]);
  };
  Picker.prototype.numPair = function () {
    var rng = this.rng, w = this._noun(), n = this._num(), m = 1 + rng.int(9);
    var hu = this.lang === 'hu';
    var t = rng.pick(hu
      ? ['Hány ' + w + '? ' + m + '!', 'Van ' + n + ' ' + w + '.', cap(w) + ': ' + n + ' darab.', 'Itt van ' + m + ' ' + w + '!',
         '"Hol ' + (/^[aáeéiíoóöőuúüű]/.test(w) ? 'az ' : 'a ') + w + '?"']
      : ['How many? ' + m + '!', 'I have ' + n + '.', cap(w) + ': ' + n + '.', '"Where is my ' + w + '?"']);
    return fits(t, this.set) ? t : n + ' ' + w;
  };

  // ---- Region 7: stories, one sentence at a time -------------------------
  Picker.prototype.newStory = function () {
    if (!this.stories.length) return null;
    this.storyI = this.rng.int(this.stories.length);
    this.lineI = 0;
    return this.stories[this.storyI];
  };
  Picker.prototype.storyLine = function () {
    if (this.storyI < 0 || this.lineI >= this.stories[this.storyI].length) { if (!this.newStory()) return this.sentence(); }
    return this.stories[this.storyI][this.lineI++];
  };

  Picker.prototype.get = function (phase) {
    if (this.numbers) {
      switch (phase) {
        case 'letters': return this.numLetters();
        case 'syllables': return this.numSyllables();
        case 'words': return this.numWord();
        case 'pairs': return this.numPair();
      }
    }
    if (phase === 'story') return this.storyLine();
    switch (phase) {
      case 'letters': return this.letters();
      case 'syllables': return this.syllables();
      case 'words': return this.word();
      case 'pairs': return this.pair();
      case 'sentences': return this.sentence();
    }
    return this.word();
  };

  // Storybook: every story with the first region whose keys can type it
  function storyLibrary(lang) {
    var L = lists(lang);
    return (L.stories || []).map(function (st) {
      var lines = (st.lines || st).map(BK.util.norm), need = 0;
      for (var r = 1; r <= BK.REGIONS.length; r++) {
        var a = allowed(r);
        if (lines.every(function (l) { return fits(l, a); })) { need = r; break; }
      }
      return { id: st.id, title: st.title, lines: lines, region: need };
    }).filter(function (st) { return st.region > 0; });   // a story this keyboard cannot type is left out
  }

  return {
    Picker: Picker,
    storyLibrary: storyLibrary,
    allowed: allowed,
    focus: focus,
    fits: fits,
    lists: lists,
    // Words that require region r's new keys (placement test material)
    placementWords: function (r, lang, n, rng) {
      var p = new Picker(r, lang, '5-6', rng, null);
      var prev = r > 1 ? allowed(r - 1) : null;
      var pool = (BK.REGIONS[r - 1].capitals ? p.capWords : p.words) || [];
      var need = pool.filter(function (w) { return !prev || !fits(w, prev); });
      if (BK.REGIONS[r - 1].keys.match(/[0-9]/)) {
        // numbers stage: mix digits into short phrases
        need = [];
        for (var i = 0; i < 20; i++) need.push((rng.int(90) + 1) + ' ' + rng.pick(p.words));
      }
      rng.shuffle(need);
      return need.slice(0, n);
    },
  };
})();
