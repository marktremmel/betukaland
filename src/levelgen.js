/*
 * Level generator: builds a 2-4 minute chain of encounters.
 *
 * Input: region, level index (0,1,2 = normal levels, 3 = boss, 'daily'),
 * grade band, a seeded RNG and the profile (for adaptive word picks).
 * Output: { encounters: [def...], sky, weather, music, phases }
 * A def is { kind, texts: [...], creature, coins, item, ... } and becomes an
 * encounter object in the Level scene (see encounters.js).
 */
BK.levelgen = {
  /*
   * Pace: how long a level is depends on the child. From the WPM of the last
   * few rounds the level gets about two minutes of typing (a little more for
   * grade 5-6), so a slower typist does not sit three times as long on the same
   * level, and a fast one gets more. Between 55 % and 140 % of the normal
   * amount; until there are three rounds to go on, the normal amount.
   */
  pace: function (profile) {
    var band = (profile && profile.grade) || '3-4';
    var h = ((profile && profile.history) || []).filter(function (x) { return x.practice !== 'endless' && x.wpm > 0; }).slice(-8);
    if (h.length < 3) return 1;
    var w = h.map(function (x) { return x.wpm; }).sort(function (a, b) { return a - b; })[Math.floor(h.length / 2)];
    var minutes = band === '3-4' ? 2 : 2.2;
    return BK.util.clamp(w * 5 * minutes / (BK.LEVEL_CHARS[band] || 100), 0.55, 1.4);
  },

  build: function (regionId, levelIdx, profile, rng, opts) {
    if (levelIdx === 'cook') return this.cook(regionId, profile, rng, opts || {});
    if (levelIdx === 'tale' || levelIdx === 'practice' || levelIdx === 'story' || levelIdx === 'weak' || levelIdx === 'endless') return this.practice(regionId, levelIdx, profile, rng, opts || {});
    if (levelIdx === 'halloween') return this.halloween(regionId, profile, rng, opts || {});
    if (levelIdx === 'arena') return this.arena(regionId, profile, rng, opts || {});
    var reg = (opts && opts.reg) || BK.REGIONS[regionId - 1];
    var band = (profile && profile.grade) || '3-4';
    var lang = (profile && profile.lang) || 'hu';
    var picker = new BK.wordbank.Picker(regionId, lang, band, rng, profile);
    if (reg.theme) picker = BK.levelgen.themed(picker, lang, rng);
    var daily = levelIdx === 'daily';
    var li = daily ? 1 : levelIdx;
    var phases = daily ? ['syllables', 'words', 'pairs'] : BK.LEVEL_PHASES[li];
    if (reg.stories) phases = [['sentences'], ['sentences', 'story'], ['story'], ['story']][li];
    var out = [];
    var me = BK.heroOf(profile).creature;
    var walkers = reg.walkers.filter(function (w) { return w !== me; });
    if (!walkers.length) walkers = reg.walkers;
    var flyers = (reg.flyers || []).filter(function (w) { return w !== me; });

    // time of day and weather: sky regions pick a sky, backdrop regions sometimes get a warmer light
    var sky = null, bdTint = null;
    if (reg.sky) {
      sky = rng.pick(reg.sky);
      if (rng.chance(0.12)) sky = rng.pick([4, 6, 7]);       // sometimes an evening sky
    } else if (reg.bdTint) bdTint = rng.chance(0.6) ? rng.pick(reg.bdTint) : null;
    else if (rng.chance(0.2)) bdTint = 0xffe0d0;
    var weather = rng.pick(['clear', 'clear', 'clear', 'leaves', 'blow', 'blow', 'wind', 'rain']);
    if (sky === 3 || reg.backdrop === 'moon') weather = rng.pick(['clear', 'wind', 'blow']);
    var look = { sky: sky, bdTint: bdTint };

    if (li === 3 && !daily) {
      // Boss: sentences only
      var n = (band === '3-4' ? 5 : 7) + (reg.theme ? 2 : 0);   // the Pumpkin King is a longer fight
      n = Math.max(3, Math.round(n * BK.util.clamp(this.pace(profile), 0.6, 1.3)));     // fewer sentences for a slower typist
      var texts = [];
      if (reg.theme === 'halloween') {
        // the Pumpkin King says his own lines, in story order (those that fit the keys)
        var kl = (BK.HALLOWEEN_KING[lang] || BK.HALLOWEEN_KING.hu).map(BK.util.norm).filter(function (t) { return BK.wordbank.fits(t, picker.set); });
        if (kl.length > n) { var all = kl; kl = []; for (var q = 0; q < n; q++) kl.push(all[Math.round(q * (all.length - 1) / (n - 1))]); }   // spread over the story
        texts = kl.slice(0, n);
        while (texts.length < n) texts.splice(Math.max(0, texts.length - 1), 0, picker.sentence());   // fill before the last line
      } else if (reg.stories) { picker.newStory(); for (var b0 = 0; b0 < n; b0++) texts.push(picker.storyLine()); }
      else for (var b = 0; b < n; b++) texts.push(picker.numbers && b % 2 ? picker.get('pairs') : picker.sentence());
      // a short warm-up road before the boss
      for (var w = 0; w < 4; w++) {
        var cw = rng.pick(walkers);
        out.push({ kind: w === 2 ? 'chest' : 'walker', creature: cw, tint: (reg.tints || {})[cw] || reg.tint,
          texts: [w < 2 ? picker.get('words') : picker.get('pairs')],
          coins: w === 2 ? 3 : 1, item: w === 2 ? rng.pick(BK.ITEMS).id : undefined });
      }
      var specials = null;
      if (reg.theme === 'halloween') {
        // the King sends marks to catch: slower and fewer for 3-4, faster for 5-6
        // only marks this child's computer can make (Settings: Jelek súgója)
        var chars = (BK.HW_SPECIALS[band] || BK.HW_SPECIALS['3-4']).filter(function (c) { return BK.keyHint(c, profile) !== null; });
        specials = band === '3-4' ? { chars: chars, every: 10000, speed: 12 } : { chars: chars, every: 5000, speed: 21 };
      }
      out.push({ kind: 'boss', creature: reg.boss, tint: reg.bossTint, texts: texts, coins: 12 + regionId * 2, maxWidth: 170,
        name: reg.bossName, intro: reg.bossIntro, outro: reg.bossOutro, specials: specials });
      look.sky = sky; look.weather = 'clear';
      return { encounters: out, sky: sky, bdTint: bdTint, weather: 'clear', music: reg.bossMusic || 'm_boss', boss: true };
    }

    var budget = Math.round((BK.LEVEL_CHARS[band] || 100) * (daily ? 1.25 : 1) * this.pace(profile));
    var used = 0, count = 0;
    var phaseOf = function () {
      // first part of the level uses the easier phase
      var p = used / budget;
      return phases.length > 1 && p >= 0.45 ? phases[1] : phases[0];
    };
    var harder = function () { return phases[phases.length - 1]; };

    // which specials appear, and roughly where (fraction of the level)
    var specials = [];
    specials.push({ at: 0.25 + rng() * 0.1, kind: 'chest' });
    if (li >= 0) specials.push({ at: 0.4 + rng() * 0.1, kind: 'gate' });
    if (li >= 1 || daily) specials.push({ at: 0.6 + rng() * 0.1, kind: 'bridge' });
    if (li >= 1 && !daily && !(profile && profile.settings && profile.settings.rest === false)) specials.push({ at: 0.52, kind: 'rest' });
    if (rng.chance(li === 2 ? 1 : 0.5)) specials.push({ at: 0.78, kind: 'shop' });
    if (rng.chance(0.4)) specials.push({ at: 0.85, kind: 'chest' });
    specials.sort(function (a, b) { return a.at - b.at; });

    var ownedPet = profile && profile.pet;
    var safety = 0;
    while (used < budget && safety++ < 60) {
      var frac = used / budget;
      if (specials.length && frac >= specials[0].at) {
        var sp = specials.shift();
        var def = { kind: sp.kind, coins: 2 };
        if (sp.kind === 'chest') { def.texts = [picker.get(harder())]; def.item = rng.pick(BK.ITEMS).id; def.coins = 3; }
        if (sp.kind === 'gate') def.texts = [picker.get(li === 0 ? 'syllables' : 'words')];
        if (sp.kind === 'bridge') def.texts = [li === 0 ? picker.get('syllables') + ' ' + picker.get('syllables') : picker.pair()];
        if (sp.kind === 'shop') def.texts = [lang === 'en' ? 'shop' : 'bolt'];
        if (sp.kind === 'rest') {
          var pd = BK.PETS.find(function (p) { return p.id === ownedPet; }) || rng.pick(BK.PETS);
          def.pet = pd.id;
          var pw = lang === 'en' ? (pd.wordEn || pd.word) : pd.word;   // the pet's name in the child's word language
          def.texts = [BK.wordbank.fits(pw, picker.set) ? pw : picker.get('syllables')];
          def.coins = 2;
        }
        // shop and rest words may use keys not unlocked yet; fall back to practice material
        if (!BK.wordbank.fits(def.texts[0], picker.set)) def.texts = [picker.get(phaseOf())];
        out.push(def);
        used += def.texts.join('').length;
        continue;
      }
      var phase = phaseOf();
      var flyer = flyers.length > 0 && rng.chance(0.25);
      var t = picker.get(phase);
      var cr = flyer ? (reg.flyer || 'gull') : rng.pick(walkers);
      out.push({ kind: flyer ? 'flyer' : 'walker', creature: cr, texts: [t], coins: 1,
        tint: (reg.tints || {})[cr] || (flyer ? reg.flyerTint : reg.tint) });
      used += t.length + 1;
      count++;
    }

    // level 3 ends with the mini-boss: one sentence in 2-3 chunks
    if (li === 2 && !daily) {
      var sent = picker.sentence().split(' ');
      var chunks = [], per = Math.ceil(sent.length / (sent.length > 4 ? 3 : 2));
      for (var i = 0; i < sent.length; i += per) chunks.push(sent.slice(i, i + per).join(' '));
      out.push({ kind: 'mini', creature: reg.mini, tint: reg.miniTint, texts: chunks, coins: 6,
        intro: BK.L((reg.miniName || BK.CREATURE_NAMES[reg.mini] || 'Valaki') + ' állja az utat!', (reg.miniName || BK.CREATURE_NAMES[reg.mini] || 'Someone') + ' blocks the way!') });
    }

    var music = daily ? 'm_level3' : (reg.music ? reg.music[li % reg.music.length] : 'm_level1');
    return { encounters: out, sky: sky, bdTint: bdTint, weather: weather, music: music };
  },

  /*
   * Halloween Night: opts.stage 0..2 are built like level 3 (stage 2 keeps its
   * mini-boss, the mummy), stage 3 like a boss level with the Pumpkin King, all with the keys of
   * regionId and the night look from BK.halloweenRegion. No warm-up.
   */
  /*
   * Boss arena: one boss, alone, with the keys of its own region (the Pumpkin King: as in
   * Halloween Night). opts.boss is 'r1'..'r7' or 'king'; opts.hard adds two sentences and
   * marks to catch (the Pumpkin King's marks come faster).
   */
  arena: function (regionId, profile, rng, opts) {
    var king = opts.boss === 'king', band = (profile && profile.grade) || '3-4';
    var plan = king ? this.build(regionId, 3, profile, rng, { reg: BK.halloweenRegion(regionId, 3) }) : this.build(regionId, 3, profile, rng);
    var boss = plan.encounters.filter(function (e) { return e.kind === 'boss'; })[0];
    if (opts.hard) {
      var picker = new BK.wordbank.Picker(regionId, (profile && profile.lang) || 'hu', band, rng, profile);
      boss.texts.splice(boss.texts.length - 1, 0, picker.sentence(), picker.sentence());
      var chars = (BK.HW_SPECIALS[band] || BK.HW_SPECIALS['3-4']).filter(function (c) { return BK.keyHint(c, profile) !== null; });
      boss.specials = king ? { chars: chars, every: band === '3-4' ? 7500 : 3800, speed: band === '3-4' ? 15 : 25 }
        : { chars: chars, every: band === '3-4' ? 9000 : 4800, speed: band === '3-4' ? 13 : 21 };
    }
    boss.coins = 0;                     // the arena pays at the end (more the first time)
    plan.encounters = [boss];
    if (king) plan.reg = BK.halloweenRegion(regionId, 3);
    plan.practice = 'arena';
    plan.arenaId = opts.boss;
    plan.hard = !!opts.hard;
    plan.boss = true;
    return plan;
  },

  /* Kitchen: the recipe's sentences at the hearth, one after the other; then the dish is ready. */
  cook: function (regionId, profile, rng, opts) {
    var r = BK.RECIPES.find(function (x) { return x.id === opts.recipeId; }) || BK.RECIPES[0];
    var lang = (profile && profile.lang) === 'en' ? 'en' : 'hu';
    var reg = BK.REGIONS[regionId - 1];
    return { encounters: [{ kind: 'kitchen', texts: r[lang].map(BK.util.norm), coins: 0, frame: r.frame, maxWidth: 200 }],
      sky: reg.sky ? reg.sky[0] : null, bdTint: null, weather: 'clear', music: 'm_chill', practice: 'cook', recipeId: r.id, storyTitle: r.name };
  },

  halloween: function (regionId, profile, rng, opts) {
    var stage = Math.max(0, Math.min(3, opts.stage || 0));
    var reg = BK.halloweenRegion(regionId, stage);
    // built like level 3 (words and pairs, no single-letter drills), or the boss level
    var plan = this.build(regionId, stage === 3 ? 3 : 2, profile, rng, { reg: reg });
    if (stage < 2) plan.encounters = plan.encounters.filter(function (e) { return e.kind !== 'mini'; });
    plan.reg = reg;
    plan.practice = 'halloween';
    plan.stage = stage;
    plan.sky = reg.sky[0];         // always the stage's own night (or dusk) sky
    if (!plan.boss) { plan.weather = rng.pick(['clear', 'leaves', 'leaves', 'blow', 'wind']); plan.music = 'm_moon'; }
    return plan;
  },

  /*
   * A picker that mixes Halloween words and sentences into the normal word
   * bank, but only those that fit the keys (picker.set). Anything else is the
   * normal material.
   */
  themed: function (picker, lang, rng) {
    var fits = function (t) { return BK.wordbank.fits(t, picker.set) && !BK.wordbank.blocked(t); };
    var words = (BK.HALLOWEEN_WORDS[lang] || []).filter(fits);
    var sents = (BK.HALLOWEEN_SENTENCES[lang] || []).filter(fits);
    var get = picker.get.bind(picker), sentence = picker.sentence.bind(picker);
    picker.get = function (phase) {
      if (words.length && (phase === 'words' || phase === 'syllables') && rng.chance(0.7)) return rng.pick(words);
      if (words.length > 1 && phase === 'pairs' && rng.chance(0.7)) {
        var a = rng.pick(words), b = rng.pick(words), p2 = a + ' ' + b;
        if (a !== b && fits(p2)) return p2;
      }
      return get(phase);
    };
    var queue = rng.shuffle(sents.slice());
    picker.sentence = function () { return queue.length && rng.chance(0.85) ? queue.pop() : sentence(); };   // no sentence twice
    return picker;
  },

  /*
   * Practice corner (Gyakorlás):
   *   'practice' - short sentences made only of the keys the child has, one per creature
   *   'story'    - one story from the storybook, sentence by sentence; the last line opens a chest
   * No mini-boss, no boss, no shop: just typing, a gentle walk and coins.
   */
  practice: function (regionId, mode, profile, rng, opts) {
    var reg = BK.REGIONS[regionId - 1];
    var band = (profile && profile.grade) || '3-4';
    var lang = (profile && profile.lang) || 'hu';
    var picker = new BK.wordbank.Picker(regionId, lang, band, rng, profile, true);
    var me = BK.heroOf(profile).creature;
    var walkers = reg.walkers.filter(function (w) { return w !== me; });
    if (!walkers.length) walkers = reg.walkers;
    var flyers = (reg.flyers || []).filter(function (w) { return w !== me; });
    var lines = [], title = null, weakKeys = null;
    var letterOk = function (c) { return c !== ' ' && /\p{L}/u.test(c); };
    if (mode === 'endless') {
      // no list: the Level scene asks gen(i) for the i-th creature, for ever
      var gen = function (i) {
        var t = picker.get(i < 8 ? 'words' : (rng.chance(0.3) ? 'pairs' : 'words'));
        var flyer = flyers.length > 0 && rng.chance(0.2);
        return { kind: flyer ? 'flyer' : 'walker', creature: flyer ? 'gull' : rng.pick(walkers), texts: [t], coins: 1,
          tint: flyer ? reg.flyerTint : reg.tint };
      };
      return { encounters: [], gen: gen, sky: reg.sky ? rng.pick(reg.sky) : null, bdTint: null, weather: 'clear',
        music: reg.music ? reg.music[reg.music.length - 1] : 'm_level3', practice: 'endless' };
    }
    if (mode === 'weak') {
      // the child's weakest keys (from the adaptive data) that this region allows
      weakKeys = BK.adaptive.weakest(profile, 8).filter(function (k) { return picker.set[k] && letterOk(k); }).slice(0, 3);
      if (weakKeys.length < 2) {
        var f0 = BK.wordbank.focus(regionId).map(function (c) { return c.toLowerCase(); }).filter(function (c) { return picker.set[c]; });
        if (f0.length < 2) f0 = Object.keys(picker.set).filter(letterOk).filter(function (c) { return c === c.toLowerCase(); });
        rng.shuffle(f0); weakKeys = f0.slice(0, 3);
      }
      var has = function (w) { return weakKeys.some(function (k) { return w.toLowerCase().indexOf(k) >= 0; }); };
      var pool = picker.words.filter(has);
      var V = picker.vowels.length ? picker.vowels : ['a'];
      // two warm-up drills made of the tricky keys, then real words that contain them
      for (var d = 0; d < 2; d++) {
        var toks = [];
        for (var q = 0; q < 4; q++) {
          var k = weakKeys[(d * 4 + q) % weakKeys.length], v = rng.pick(V), tk = rng.chance(0.5) ? k + v : v + k;
          toks.push(BK.wordbank.blocked(tk) ? k + k : tk);
        }
        lines.push(toks.join(' '));
      }
      var nw = (band === '3-4' ? 8 : 10) - 2;
      rng.shuffle(pool);
      for (var j = 0; j < nw; j++) lines.push(pool.length ? pool[j % pool.length] : picker.get('words'));
      title = weakKeys.join(' ');
    } else if (mode === 'tale') {
      // a part of a tale, from where the child stopped last time
      var tale = BK.TALES.find(function (x) { return x.id === opts.taleId; }) || BK.TALES[0];
      var part = BK.talePart(profile, tale);
      lines = tale.lines.slice(part.from, part.to).map(BK.util.norm);
      title = tale.title;
      opts.tale = { id: tale.id, from: part.from, to: part.to, total: tale.lines.length };
    } else if (mode === 'story') {
      var lib = BK.wordbank.storyLibrary(lang);
      var st = lib.find(function (x) { return x.id === opts.storyId; }) || lib[0];
      if (!st) { mode = 'practice'; } else { lines = st.lines.slice(); title = st.title; opts.storyId = st.id; }
    } else {
      var n = Math.max(4, Math.round((band === '3-4' ? 8 : 10) * BK.util.clamp(this.pace(profile), 0.6, 1.3)));
      for (var i = 0; i < n; i++) lines.push(picker.sentence());
    }
    if (!lines.length) for (var i2 = 0; i2 < (band === '3-4' ? 8 : 10); i2++) lines.push(picker.sentence());
    var out = lines.map(function (t, i) {
      var last = i === lines.length - 1;
      var flyer = !last && flyers.length > 0 && rng.chance(0.2);
      if (last) return { kind: 'chest', texts: [t], coins: 4, item: rng.pick(BK.ITEMS).id };
      return { kind: flyer ? 'flyer' : 'walker', creature: flyer ? 'gull' : rng.pick(walkers), texts: [t], coins: 1,
        tint: flyer ? reg.flyerTint : reg.tint };
    });
    var sky = reg.sky ? rng.pick(reg.sky) : null;
    var bdTint = !reg.sky && reg.bdTint && rng.chance(0.5) ? rng.pick(reg.bdTint) : null;
    return { encounters: out, sky: sky, bdTint: bdTint, weather: rng.pick(['clear', 'clear', 'leaves', 'blow', 'wind']),
      music: mode === 'story' || mode === 'tale' ? 'm_chill' : (reg.music ? reg.music[0] : 'm_level1'),
      practice: mode, storyTitle: title, storyLines: mode === 'story' || mode === 'tale' ? lines : null, storyId: opts.storyId || null, weakKeys: weakKeys,
      tale: opts.tale || null };
  },
};
