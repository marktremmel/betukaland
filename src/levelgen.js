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
  build: function (regionId, levelIdx, profile, rng, opts) {
    if (levelIdx === 'practice' || levelIdx === 'story') return this.practice(regionId, levelIdx, profile, rng, opts || {});
    var reg = BK.REGIONS[regionId - 1];
    var band = (profile && profile.grade) || '3-4';
    var lang = (profile && profile.lang) || 'hu';
    var picker = new BK.wordbank.Picker(regionId, lang, band, rng, profile);
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
    var weather = rng.pick(['clear', 'clear', 'clear', 'leaves', 'wind', 'rain']);
    if (sky === 3 || reg.backdrop === 'moon') weather = rng.pick(['clear', 'wind']);
    var look = { sky: sky, bdTint: bdTint };

    if (li === 3 && !daily) {
      // Boss: sentences only
      var n = band === '3-4' ? 5 : 7;
      var texts = [];
      if (reg.stories) { picker.newStory(); for (var b0 = 0; b0 < n; b0++) texts.push(picker.storyLine()); }
      else for (var b = 0; b < n; b++) texts.push(picker.numbers && b % 2 ? picker.get('pairs') : picker.sentence());
      // a short warm-up road before the boss
      for (var w = 0; w < 4; w++) {
        out.push({ kind: w === 2 ? 'chest' : 'walker', creature: rng.pick(walkers), tint: reg.tint,
          texts: [w < 2 ? picker.get('words') : picker.get('pairs')],
          coins: w === 2 ? 3 : 1, item: w === 2 ? rng.pick(BK.ITEMS).id : undefined });
      }
      out.push({ kind: 'boss', creature: reg.boss, tint: reg.bossTint, texts: texts, coins: 12 + regionId * 2,
        name: reg.bossName, intro: reg.bossIntro, outro: reg.bossOutro });
      look.sky = sky; look.weather = 'clear';
      return { encounters: out, sky: sky, bdTint: bdTint, weather: 'clear', music: reg.bossMusic || 'm_boss', boss: true };
    }

    var budget = Math.round((BK.LEVEL_CHARS[band] || 100) * (daily ? 1.25 : 1));
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
    if (li >= 1 && !daily) specials.push({ at: 0.52, kind: 'rest' });
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
        if (sp.kind === 'shop') def.texts = [lang === 'en' ? 'shop' : BK.T.shopWord];
        if (sp.kind === 'rest') {
          var pd = BK.PETS.find(function (p) { return p.id === ownedPet; }) || rng.pick(BK.PETS);
          def.pet = pd.id;
          def.texts = [BK.wordbank.fits(pd.word, picker.set) ? pd.word : picker.get('syllables')];
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
      out.push({ kind: flyer ? 'flyer' : 'walker', creature: flyer ? 'gull' : rng.pick(walkers), texts: [t], coins: 1,
        tint: flyer ? reg.flyerTint : reg.tint });
      used += t.length + 1;
      count++;
    }

    // level 3 ends with the mini-boss: one sentence in 2-3 chunks
    if (li === 2 && !daily) {
      var sent = picker.sentence().split(' ');
      var chunks = [], per = Math.ceil(sent.length / (sent.length > 4 ? 3 : 2));
      for (var i = 0; i < sent.length; i += per) chunks.push(sent.slice(i, i + per).join(' '));
      out.push({ kind: 'mini', creature: reg.mini, tint: reg.miniTint, texts: chunks, coins: 6,
        intro: (BK.CREATURE_NAMES[reg.mini] || 'Valaki') + ' állja az utat!' });
    }

    var music = daily ? 'm_level3' : (reg.music ? reg.music[li % reg.music.length] : 'm_level1');
    return { encounters: out, sky: sky, bdTint: bdTint, weather: weather, music: music };
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
    var lines = [], title = null;
    if (mode === 'story') {
      var lib = BK.wordbank.storyLibrary(lang);
      var st = lib.find(function (x) { return x.id === opts.storyId; }) || lib[0];
      lines = st.lines.slice(); title = st.title;
    } else {
      var n = band === '3-4' ? 8 : 10;
      for (var i = 0; i < n; i++) lines.push(picker.sentence());
    }
    var out = lines.map(function (t, i) {
      var last = i === lines.length - 1;
      var flyer = !last && flyers.length > 0 && rng.chance(0.2);
      if (last) return { kind: 'chest', texts: [t], coins: 4, item: rng.pick(BK.ITEMS).id };
      return { kind: flyer ? 'flyer' : 'walker', creature: flyer ? 'gull' : rng.pick(walkers), texts: [t], coins: 1,
        tint: flyer ? reg.flyerTint : reg.tint };
    });
    var sky = reg.sky ? rng.pick(reg.sky) : null;
    var bdTint = !reg.sky && reg.bdTint && rng.chance(0.5) ? rng.pick(reg.bdTint) : null;
    return { encounters: out, sky: sky, bdTint: bdTint, weather: rng.pick(['clear', 'clear', 'leaves', 'wind']),
      music: mode === 'story' ? 'm_chill' : (reg.music ? reg.music[0] : 'm_level1'),
      practice: mode, storyTitle: title, storyLines: mode === 'story' ? lines : null, storyId: opts.storyId || null };
  },
};
