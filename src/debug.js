/*
 * Teacher's debug menu. Type the secret word  tmdebug  anywhere in the game (it is not shown
 * anywhere), then F2 opens the menu. The word again switches it off. The switch is kept on
 * this computer only. Nothing here goes into save codes on its own; it only changes the
 * current profile like playing would.
 */
BK.debug = {
  WORD: 'tmdebug',
  buf: '',
  on: function () { try { return localStorage.getItem('bk_debug') === '1'; } catch (e) { return false; } },
  set: function (v) { try { localStorage.setItem('bk_debug', v ? '1' : '0'); } catch (e) {} },
  init: function () {
    var d = this;
    window.addEventListener('keydown', function (e) {
      if (e.key && e.key.length === 1) {
        d.buf = (d.buf + e.key.toLowerCase()).slice(-d.WORD.length);
        if (d.buf === d.WORD) { d.buf = ''; d.set(!d.on()); d.note(d.on() ? 'Debug: BE (F2: menü)' : 'Debug: KI'); }
      }
      if (e.key === 'F2' && d.on()) { e.preventDefault(); d.menu(); }
    }, true);
  },
  note: function (t) {
    var sc = window.BK_GAME && BK_GAME.scene.getScenes(true)[0];
    if (sc && BK.ui && BK.ui.toast) BK.ui.toast(sc, BK.W / 2, 40, t, 0x9fe0ff, 1, 900);
  },
  menu: function () {
    var P = BK.state.profile, d = this;
    var acts = [
      ['coins', '+500 érme'], ['rares', '+5 ritka kincs'], ['items', 'Minden kincs ×3'], ['dishes', 'Minden étel ×2'],
      ['regions', 'Minden vidék kész (3 csillag)'], ['halloween', 'Halloween kész'], ['magic', 'Minden varázs és figura'],
      ['castle', 'Minden vártárgy'], ['tales', 'Minden mese kész'], ['win', 'Ezt a pályát megnyerem (3 csillag)'],
      ['progress', 'Kihagyott pálya (teszt)'], ['map', 'Vissza a térképre'], ['off', 'Debug kikapcsolása'],
    ];
    var html = '<h2>Debug</h2><p class="small">' + (P ? BK.html.esc(P.nick) : 'nincs profil') + '</p><div class="row">' +
      acts.map(function (a) { return '<button data-a="' + a[0] + '">' + a[1] + '</button>'; }).join('') + '</div><div class="row"><button id="bk-close">Bezár</button></div>';
    var el = BK.html.show(html);
    el.querySelector('#bk-close').onclick = function () { BK.html.hide(); };
    el.querySelectorAll('button[data-a]').forEach(function (b) {
      b.onclick = function () { d.run(b.getAttribute('data-a')); };
    });
  },
  run: function (a) {
    var P = BK.state.profile, sc = BK_GAME.scene.getScenes(true)[0];
    if (!P && a !== 'off') { this.note('Előbb válassz profilt'); return; }
    if (a === 'coins') P.coins += 500;
    if (a === 'rares') { P.rares = P.rares || {}; for (var i = 0; i < 5; i++) { var r = BK.RARES[i % BK.RARES.length]; P.rares[r.id] = (P.rares[r.id] || 0) + 1; } }
    if (a === 'items') BK.ITEMS.forEach(function (it) { P.items[it.id] = 3; });
    if (a === 'dishes') { P.dishes = P.dishes || {}; BK.RECIPES.forEach(function (r) { P.dishes[r.id] = (P.dishes[r.id] || 0) + 2; }); }
    if (a === 'regions') BK.REGIONS.forEach(function (r) { if (P.progress[r.id]) P.progress[r.id].stars = [3, 3, 3, 3]; });
    if (a === 'halloween') { P.halloween = { stars: [3, 3, 3, 3] }; if (P.pets.indexOf('bat') < 0) P.pets.push('bat'); }
    if (a === 'magic') {
      [BK.SHOT_SHAPES, BK.SHOT_COLOURS, BK.SHOT_IMPACTS, BK.SHOT_GLOWS, BK.KB_THEMES || []].forEach(function (l) { l.forEach(function (o) { if (P.fx.owned.indexOf(o.id) < 0) P.fx.owned.push(o.id); }); });
      P.figures = BK.HEROES.filter(function (h) { return h.lock; }).map(function (h) { return h.id; });
      BK.OUTFITS.forEach(function (o) { if (P.outfits.indexOf(o.id) < 0) P.outfits.push(o.id); });
    }
    if (a === 'castle') { var C = BK.castleData(P); BK.CASTLE_PROPS.forEach(function (o) { C.inv[o.id] = Math.max(3, C.inv[o.id] || 0); if (C.props.indexOf(o.id) < 0) C.props.push(o.id); }); C.frames = 4; }
    if (a === 'tales') { P.tales = P.tales || {}; BK.TALES.forEach(function (t) { P.tales[t.id] = { at: 0, done: 3 }; }); }
    if (a === 'win') {
      var L = BK_GAME.scene.getScene('Level');
      if (!L || !L.sys.isActive() || L.state === 'end') { this.note('Nincs futó pálya'); return; }
      BK.html.hide();
      L.stats.correct = Math.max(60, L.stats.correct); L.stats.wrong = 0; L.stats.chars = Math.max(300, L.stats.chars);
      L.stats.typingMs = 30000; L.startedAt = performance.now() - 30000;
      L.endLevel();
      return;
    }
    if (a === 'map') { BK.html.hide(); BK_GAME.scene.getScenes(true).forEach(function (x) { if (x.scene.key !== 'Map') x.scene.stop(); }); BK_GAME.scene.start('Map'); return; }
    if (a === 'progress') { var cur = BK.REGIONS.filter(function (r) { return r.playable; }); cur.forEach(function (r, i) { if (i < 3 && P.progress[r.id]) P.progress[r.id].stars = i === 1 ? [0, 2, 0, 1] : [3, 3, 3, 3]; }); }
    if (a === 'off') { this.set(false); BK.html.hide(); this.note('Debug: KI'); return; }
    BK.save.persist();
    BK.html.hide();
    this.note('Kész: ' + a);
    // redraw what is on screen
    if (sc && sc.scene.key === 'Map') sc.scene.restart({});
  },
};
