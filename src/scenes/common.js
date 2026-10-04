/*
 * Shared bits for menu scenes: the current player, a scenic background,
 * and the HTML overlay used for the save-code and teacher screens
 * (real text fields, copy/paste and file pickers work best as HTML).
 */
BK.state = { profile: null };

BK.setProfile = function (p) {
  BK.state.profile = p;
  if (p) { BK.save.setLast(p.id); BK.audio.apply(p.settings); }
};

// Sky + ground + a few trees; optional running bunny
BK.menuBackground = function (scene, sky, opts) {
  opts = opts || {};
  sky = sky || 1;
  var layers = BK_MANIFEST.skies[sky].length, out = { layers: [] };
  for (var i = 1; i <= layers; i++) {
    var t = scene.add.tileSprite(0, 0, BK.W, BK.H, 'sky' + sky + '_' + i).setOrigin(0, 0);
    t.tilePositionY = 50; t.speed = (i - 1) * 0.05;
    out.layers.push(t);
  }
  var gy = opts.groundY || 180;
  scene.add.image(60, gy + 1, 'tree').setOrigin(0.5, 1).setTint(0xa8c890);
  scene.add.image(330, gy + 1, 'tree').setOrigin(0.5, 1);
  scene.add.image(250, gy + 1, 'bush').setOrigin(0.5, 1);
  out.ground = scene.add.tileSprite(0, gy, BK.W, BK.H - gy, 'ground').setOrigin(0, 0);
  scene.events.on('update', function (t, d) {
    out.layers.forEach(function (l) { l.tilePositionX += l.speed * d / 16; });
    if (opts.scroll) out.ground.tilePositionX += d / 16;
  });
  return out;
};

// Profile picture: the chosen hero, standing, in its outfit
BK.avatarSprite = function (scene, x, y, idx, profile) {
  var h = BK.HEROES[idx] || BK.HEROES[0];
  var key = BK.outfitKey(h.idle, profile);
  var s = scene.add.sprite(x, y, key).setOrigin(0.5, 1);
  s.play(key);
  if (h.idle === h.run && !h.flies) { s.anims.pause(); s.setFrame(0); }
  s.setFlipX(BK.FACES_LEFT[h.id] === true);
  return s;
};

// ------------------------------------------------------------------ HTML overlay
BK.html = {
  el: function () { return document.getElementById('overlay'); },
  show: function (html) {
    var el = this.el();
    el.innerHTML = '<div class="ov-card">' + html + '</div>';
    el.style.display = 'flex';
    if (window.BK_GAME) BK_GAME.input.keyboard.enabled = false;
    return el;
  },
  hide: function () {
    var el = this.el();
    el.style.display = 'none';
    el.innerHTML = '';
    if (window.BK_GAME) BK_GAME.input.keyboard.enabled = true;
  },
  esc: function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  },
};
