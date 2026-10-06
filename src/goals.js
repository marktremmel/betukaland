/*
 * Daily goals and the streak: something to aim for every day, also after
 * every region is finished.
 *
 * Each day a profile gets three small goals (picked from the list below by
 * the date, so they change daily). Every finished goal pays GOAL_COINS; all
 * three pay a BONUS on top. The streak counts days in a row on which the
 * child finished at least one round (a level, practice, story, drill or run).
 *
 * Stored on the profile:
 *   p.goals  = { date, list: [{ id, n, have, done }], bonus }
 *   p.streak = { days, last, best }
 */
BK.goals = (function () {
  var GOAL_COINS = 10, BONUS = 15;

  // n: target (per grade band when an object). avail(p): can this child do it at all?
  var TEMPLATES = [
    { id: 'chars', n: { '3-4': 250, '5-6': 400 }, hu: 'Gépelj be {n} betűt', en: 'Type {n} letters' },
    { id: 'rounds', n: 3, hu: 'Fejezz be {n} kört (pálya vagy gyakorlás)', en: 'Finish {n} rounds (levels or practice)' },
    { id: 'stars3', n: 1, hu: 'Szerezz 3 csillagot', en: 'Get 3 stars' },
    { id: 'acc', n: 1, hu: 'Érj el legalább 95% pontosságot', en: 'Reach at least 95% accuracy' },
    { id: 'story', n: 1, hu: 'Írj le egy egész történetet', en: 'Type a whole story', avail: function (p) { return storyOpen(p); } },
    { id: 'weak', n: 1, hu: 'Gyakorold a nehéz betűidet', en: 'Practise your tricky letters' },
    { id: 'daily', n: 1, hu: 'Játszd le a Kihívást', en: 'Play the Challenge' },
    { id: 'endless', n: { '3-4': 15, '5-6': 25 }, hu: 'Végtelen út: jusson el {n} szóig', en: 'Endless road: reach {n} words' },
  ];

  function storyOpen(p) {
    return BK.wordbank.storyLibrary(p.lang || 'hu').some(function (st) { return BK.save.regionOpen(p, st.region); });
  }
  function tpl(id) { return TEMPLATES.filter(function (t) { return t.id === id; })[0]; }
  function target(t, p) { return typeof t.n === 'object' ? (t.n[p.grade] || t.n['3-4']) : t.n; }
  function yesterday(d) {
    var x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() - 1);
    return x.toISOString().slice(0, 10);
  }

  // Today's goals (made fresh on a new day)
  function today(p) {
    var d = BK.util.today();
    if (p.goals && p.goals.date === d) return p.goals;
    var rng = BK.util.rng(BK.util.hash('goals:' + d + ':' + p.id));
    // one "amount" goal plus two others
    var first = rng.pick(['chars', 'rounds']);
    var rest = TEMPLATES.filter(function (t) { return t.id !== 'chars' && t.id !== 'rounds' && (!t.avail || t.avail(p)); });
    rng.shuffle(rest);
    var ids = [first, rest[0].id, rest[1].id];
    p.goals = { date: d, bonus: false, list: ids.map(function (id) { return { id: id, n: target(tpl(id), p), have: 0, done: false }; }) };
    return p.goals;
  }

  function text(g) {
    var t = tpl(g.id);
    return (BK.uiLang === 'en' ? t.en : t.hu).replace('{n}', g.n);
  }

  /**
   * Called after every round (from BK.save.recordLevel). res: the level result
   * ({ chars, stars, acc, daily, practice, words }). Returns what was finished
   * just now: { done: [goal texts], coins, bonus }.
   */
  function update(p, res) {
    var G = today(p), out = { done: [], coins: 0, bonus: false };
    // streak: one finished round a day keeps it going
    var d = BK.util.today(), S = p.streak || (p.streak = { days: 0, last: null, best: 0 });
    if (S.last !== d) { S.days = S.last === yesterday(d) ? S.days + 1 : 1; S.last = d; S.best = Math.max(S.best || 0, S.days); }
    G.list.forEach(function (g) {
      if (g.done) return;
      if (g.id === 'chars') g.have += res.chars || 0;
      else if (g.id === 'rounds') g.have += 1;
      else if (g.id === 'stars3') g.have = res.stars >= 3 ? 1 : g.have;
      else if (g.id === 'acc') g.have = res.acc >= 0.95 && (res.chars || 0) >= 20 ? 1 : g.have;
      else if (g.id === 'story') g.have = res.practice === 'story' ? 1 : g.have;
      else if (g.id === 'weak') g.have = res.practice === 'weak' ? 1 : g.have;
      else if (g.id === 'daily') g.have = res.daily ? 1 : g.have;
      else if (g.id === 'endless') g.have = res.practice === 'endless' ? Math.max(g.have, res.words || 0) : g.have;
      if (g.have >= g.n) {
        g.have = g.n; g.done = true;
        out.done.push(text(g)); out.coins += GOAL_COINS;
      }
    });
    if (!G.bonus && G.list.every(function (g) { return g.done; })) { G.bonus = true; out.bonus = true; out.coins += BONUS; }
    p.coins = Math.min(16000, p.coins + out.coins);
    return out;
  }

  // Streak shown today: still counts if the child played yesterday and not yet today
  function streak(p) {
    var S = p.streak, d = BK.util.today();
    if (!S || !S.last) return 0;
    return (S.last === d || S.last === yesterday(d)) ? S.days : 0;
  }

  return { today: today, update: update, text: text, streak: streak, doneCount: function (p) {
    return today(p).list.filter(function (g) { return g.done; }).length;
  }, GOAL_COINS: GOAL_COINS, BONUS: BONUS };
})();
