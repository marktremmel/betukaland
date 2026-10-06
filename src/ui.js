/*
 * UI helpers: text, 9-slice wood panels, buttons, stars, toasts.
 * Everything is drawn in base resolution (384x216) and scaled by the camera.
 */
BK.ui = {};

// 9-slice definitions: texture key -> [left, right, top, bottom] insets
BK.ui.NINE = {
  ui_panel:  [8, 8, 24, 8],
  ui_panel2: [16, 16, 18, 18],
  ui_btn:    [6, 6, 8, 8],
  ui_btn_down: [6, 6, 8, 8],
  ui_btn_s:  [6, 6, 8, 8],
  ui_btn_s_down: [6, 6, 8, 8],
  ui_slot:   [6, 6, 6, 6],
  ui_slot_sel: [6, 6, 6, 6],
  ui_slot_off: [6, 6, 6, 6],
  ui_field:  [5, 5, 5, 5],
  ui_banner: [10, 10, 6, 6],
};

// Called once after textures load: cut every 9-slice texture into 9 frames
BK.ui.prepareNine = function (scene) {
  Object.keys(BK.ui.NINE).forEach(function (key) {
    if (!scene.textures.exists(key)) return;
    var tex = scene.textures.get(key), src = tex.getSourceImage();
    var W = src.width, H = src.height, n = BK.ui.NINE[key];
    // trim transparent rows of the button art (it has 3 px of air on top)
    var top0 = key.indexOf('btn') >= 0 && key.indexOf('down') < 0 ? 3 : 0;
    var xs = [0, n[0], W - n[1], W], ys = [top0, top0 + n[2], H - n[3], H];
    for (var j = 0; j < 3; j++) for (var i = 0; i < 3; i++) {
      tex.add('n' + (j * 3 + i), 0, xs[i], ys[j], xs[i + 1] - xs[i], ys[j + 1] - ys[j]);
    }
  });
};

/** A stretchable wood panel. Returns a Container; (x, y) is the top-left. */
BK.ui.nine = function (scene, x, y, w, h, key) {
  key = key || 'ui_panel2';
  var n = BK.ui.NINE[key], c = scene.add.container(x, y);
  var xs = [0, n[0], w - n[1]], ws = [n[0], Math.max(0, w - n[0] - n[1]), n[1]];
  var ys = [0, n[2], h - n[3]], hs = [n[2], Math.max(0, h - n[2] - n[3]), n[3]];
  for (var j = 0; j < 3; j++) for (var i = 0; i < 3; i++) {
    if (!ws[i] || !hs[j]) continue;
    var im = scene.add.image(xs[i], ys[j], key, 'n' + (j * 3 + i)).setOrigin(0, 0);
    im.setDisplaySize(ws[i], hs[j]);
    c.add(im);
  }
  c.w = w; c.h = h;
  return c;
};

/**
 * Text in the chosen font (BK.FONT; Andika by default: made for children
 * learning to read, every Hungarian letter, clear I/l/1, single-storey a and g).
 * opts: { size: 1|2|3|4, px (exact size), bold,
 *         color: 0xffffff, outline: true, align: 0|1|2, origin: [x,y], width }
 * Outlined text (default) reads on any background; outline: false is for panels.
 * Rendered at BK.RES, so it stays sharp at any zoom.
 */
BK.ui.PX = 11;
BK.ui.text = function (scene, x, y, str, opts) {
  opts = opts || {};
  var size = opts.size || 1;
  // size 1 = 11 px body text, 2 = 16 px headings, 3 = 24, 4 = 32 (titles)
  var px = opts.px || (size === 1 ? BK.ui.PX : 8 * size);
  var outline = opts.outline !== false;
  var bold = opts.bold !== undefined ? opts.bold : (size >= 2 || outline);
  var style = {
    fontFamily: BK.FONT, fontSize: px + 'px', fontStyle: bold ? 'bold' : 'normal', color: '#ffffff',
    align: ['left', 'center', 'right'][opts.align || 0],
  };
  if (outline) { style.stroke = '#2b1a14'; style.strokeThickness = Math.max(2, Math.round(px / 6)); }
  if (opts.width) style.wordWrap = { width: opts.width, useAdvancedWrap: true };
  var t = scene.add.text(x, y, str, style);
  t.setResolution(BK.RES || 1);
  t.setLineSpacing(-Math.round(px * 0.22));
  if (opts.color !== undefined) t.setTint(opts.color);
  else if (!outline) t.setTint(0x4a2c1c);
  var o = opts.origin || [0, 0];
  t.setOrigin(o[0], o[1]);
  return t;
};

// Width of a string in the game font (world pixels)
BK.ui.measure = (function () {
  var ctx = null;
  return function (str, px, bold) {
    if (!ctx) ctx = document.createElement('canvas').getContext('2d');
    ctx.font = (bold ? 'bold ' : '') + px + 'px ' + BK.FONT;
    return ctx.measureText(str).width;
  };
})();

/**
 * Wood button. (x, y) is the centre. opts: { w, h, small, key (keyboard key name
 * that also presses it, e.g. 'ENTER' or 'ONE'), color, disabled }
 */
BK.ui.button = function (scene, x, y, label, onClick, opts) {
  opts = opts || {};
  var w = opts.w || 80, h = Math.max(16, opts.h || 20);   // the wood art needs 16 px
  var c = scene.add.container(x - w / 2, y - h / 2);
  var up = BK.ui.nine(scene, 0, 0, w, h, 'ui_btn');
  var down = BK.ui.nine(scene, 0, 1, w, h - 1, 'ui_btn_down').setVisible(false);
  var lift = h >= 18 ? 3 : (h >= 16 ? 1 : 0);      // the font's accent room sits above the letters
  var txt = BK.ui.text(scene, w / 2, h / 2 - lift, label, { outline: false, origin: [0.5, 0.5], color: opts.color || 0x4a2c1c });
  c.add([up, down, txt]);
  c.setSize(w, h);
  var zone = scene.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
  c.zone = zone;
  c.label = txt;
  var press = function () {
    if (c.disabled) return;
    BK.audio.sfx('ui');
    up.setVisible(false); down.setVisible(true); txt.y = h / 2 - lift + 1;
    scene.time.delayedCall(90, function () {
      up.setVisible(true); down.setVisible(false); txt.y = h / 2 - lift;
      onClick();
    });
  };
  zone.on('pointerover', function () { if (!c.disabled) txt.setTint(0x9a3d1a); });
  zone.on('pointerout', function () { txt.setTint(c.disabled ? 0x9a8a80 : (opts.color || 0x4a2c1c)); });
  zone.on('pointerup', press);
  c.press = press;
  c.setDisabled = function (d) { c.disabled = d; c.setAlpha(d ? 0.55 : 1); txt.setTint(d ? 0x9a8a80 : (opts.color || 0x4a2c1c)); };
  c.destroyAll = function () { zone.destroy(); c.destroy(); };
  if (opts.key) {
    scene.input.keyboard.on('keydown-' + opts.key, function () { if (c.visible && !c.disabled && zone.input && zone.input.enabled) press(); });
  }
  if (opts.disabled) c.setDisabled(true);
  return c;
};

// Stars drawn as pixel textures generated at boot ('star_on', 'star_off')
BK.ui.stars = function (scene, x, y, n, max, spacing) {
  var c = scene.add.container(x, y);
  max = max || 3; spacing = spacing || 12;
  for (var i = 0; i < max; i++) {
    c.add(scene.add.image(i * spacing - (max - 1) * spacing / 2, 0, i < n ? 'star_on' : 'star_off'));
  }
  return c;
};

// A short message that floats up and fades
BK.ui.toast = function (scene, x, y, str, color, size, hold) {
  var t = BK.ui.text(scene, x, y, str, { size: size || 1, color: color || 0xffffff, origin: [0.5, 0.5] });
  t.setDepth(500);
  scene.tweens.add({ targets: t, y: y - 18, alpha: 0, delay: hold || 0, duration: 1100, ease: 'Cubic.easeIn', onComplete: function () { t.destroy(); } });
  return t;
};

// Pixel-art textures generated in code (stars, keycap shading, white pixel)
BK.ui.makeTextures = function (scene) {
  var star = [
    '....#....',
    '...#y#...',
    '...#y#...',
    '####yy###',
    '#yyyyyyy#',
    '.#yyyyy#.',
    '..#yyy#..',
    '.#yy#yy#.',
    '#y#...#y#',
    '##.....##',
  ];
  function draw(key, pattern, colours) {
    if (scene.textures.exists(key)) return;
    var h = pattern.length, w = pattern[0].length;
    var tex = scene.textures.createCanvas(key, w, h), ctx = tex.getContext();
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var ch = pattern[y][x];
      if (colours[ch]) { ctx.fillStyle = colours[ch]; ctx.fillRect(x, y, 1, 1); }
    }
    tex.refresh();
  }
  draw('star_on', star, { '#': '#7a3b10', 'y': '#ffd23c' });
  draw('star_off', star, { '#': '#5a4a44', 'y': '#a8988c' });
  draw('px', ['#'], { '#': '#ffffff' });
  // small dark speech-bubble tail
  draw('tail', ['#####', '#www#', '.#w#.', '..#..'], { '#': '#5a3426', 'w': '#fffaeb' });
  // crown (mastery) and flame (streak)
  var crown = [
    '#...#...#',
    '#y.#y#.y#',
    '#yy#y#yy#',
    '#yyyyyyy#',
    '#yryyyry#',
    '#yyyyyyy#',
    '#########',
  ];
  draw('crown_on', crown, { '#': '#7a3b10', 'y': '#ffd23c', 'r': '#e04848' });
  draw('crown_off', crown, { '#': '#5a4a44', 'y': '#a8988c', 'r': '#8a7a70' });
  draw('flame', [
    '...#....',
    '..#o#...',
    '..#oo#..',
    '.#oyo#..',
    '.#oyyo#.',
    '#oyyyyo#',
    '#oywwyo#',
    '#oywwyo#',
    '.#oyyo#.',
    '..####..',
  ], { '#': '#7a2a10', 'o': '#f07028', 'y': '#ffd23c', 'w': '#fff6c8' });
  draw('flame_off', [
    '...#....', '..#o#...', '..#oo#..', '.#oyo#..', '.#oyyo#.', '#oyyyyo#', '#oywwyo#', '#oywwyo#', '.#oyyo#.', '..####..',
  ], { '#': '#5a4a44', 'o': '#8a7a70', 'y': '#a8988c', 'w': '#c8bcb4' });
};
