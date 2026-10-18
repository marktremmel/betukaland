/*
 * WordBubble: the speech bubble that shows what to type.
 * Typed letters turn green and get a small hop; the next letter is
 * underlined; a wrong key only shakes the bubble a little.
 */
BK.WordBubble = class {
  constructor(scene, text, x, y, opts) {
    opts = opts || {};
    this.scene = scene;
    this.text = text;
    this.i = 0;
    // big letters for words, slightly smaller for sentences (they wrap to two lines)
    var px = opts.px || (text.length <= 14 ? 22 : 16);
    this.px = px;
    this.size = px / 11;
    var maxW = opts.maxWidth || 300;
    this.c = scene.add.container(x, y).setDepth(200);
    this.chars = [];
    var adv = function (str) { return BK.ui.measure(str, px, true); };
    // lay out words into lines, wrapping at spaces if too wide
    var words = text.split(' '), lines = [[]], lineW = [0], spaceW = adv(' ');
    words.forEach(function (w) {
      var ww = adv(w), cur = lines.length - 1;
      if (lineW[cur] > 0 && lineW[cur] + spaceW + ww > maxW) { lines.push([]); lineW.push(0); cur++; }
      lines[cur].push(w);
      lineW[cur] = adv(lines[cur].join(' '));
    });
    var lineH = Math.round(px * 1.3), W = Math.ceil(Math.max.apply(null, lineW)) + 14, H = lines.length * lineH + 8;
    this.w = W; this.h = H;
    var g = scene.add.graphics();
    g.fillStyle(0x5a3426, 1).fillRoundedRect(-W / 2 - 1, -H - 1, W + 2, H + 2, 4);
    g.fillStyle(0xfffaeb, 1).fillRoundedRect(-W / 2, -H, W, H, 3);
    var tail = scene.add.image(0, 3, 'tail').setOrigin(0.5, 1);
    this.c.add([g, tail]);
    this.under = scene.add.rectangle(0, 0, 4, Math.max(2, Math.round(px / 9)), 0xe0742c).setOrigin(0, 0);
    var self = this;
    lines.forEach(function (line, li) {
      var x0 = -lineW[li] / 2, ly = -H + 4 + li * lineH;
      var str = line.join(' ');
      // x of every letter from the width of the text before it (keeps the font's spacing)
      for (var k = 0; k < str.length; k++) {
        var ch = str[k], lx = x0 + adv(str.slice(0, k)), cw = adv(str.slice(0, k + 1)) - adv(str.slice(0, k));
        var t = null;
        if (ch !== ' ') {
          t = BK.ui.text(scene, lx, ly, ch, { outline: false, px: px, bold: true, color: 0x4a2c1c });
          t.baseY = t.y;
          self.c.add(t);
        }
        self.chars.push({ t: t, ch: ch, x: lx, y: ly, w: cw });
      }
      // the space between lines is still a character to type
      if (li < lines.length - 1) {
        self.chars.push({ t: null, ch: ' ', x: x0 + lineW[li], y: ly, w: spaceW });
      }
    });
    this.c.add(this.under);
    this.placeUnder();
    this.c.setScale(0.2);
    scene.tweens.add({ targets: this.c, scale: 1, duration: 180, ease: 'Back.easeOut' });
  }

  get next() { return this.i < this.text.length ? this.text[this.i] : null; }
  get done() { return this.i >= this.text.length; }

  placeUnder() {
    var c = this.chars[this.i];
    if (!c) { this.under.setVisible(false); return; }
    this.under.setVisible(true);
    this.under.x = c.x + 0.5; this.under.y = c.y + Math.round(this.px * 1.12);
    this.under.width = Math.max(3, c.w - 1);
  }

  // returns true if the key was correct
  type(ch) {
    var want = this.next;
    if (want === null) return false;
    if (ch === want) {
      var c = this.chars[this.i];
      if (c.t) {
        c.t.setTint(0x2e9e52);
        this.scene.tweens.add({ targets: c.t, y: c.t.baseY - 3, duration: 70, yoyo: true });
      }
      this.i++;
      this.placeUnder();
      return true;
    }
    // gentle shake, never anything scary
    var c0 = this.c, x0 = c0.x;
    this.scene.tweens.killTweensOf(c0);
    c0.setScale(1);
    this.scene.tweens.add({ targets: c0, x: { from: x0 - 2, to: x0 }, duration: 160, ease: 'Elastic.easeOut' });
    return false;
  }

  // Light from an RTX or chrome shot. RTX: a coloured rim around the bubble, a soft wash of
  // the colour inside it and the last letters typed glowing in it for a moment. Chrome: a
  // white shine that slides across the bubble, and the last letter flashes silver.
  light(c, kind) {
    var sc = this.scene, W = this.w, H = this.h, self = this;
    if (!this.c || !this.c.active) return;
    if (kind === 'g_rim' || kind === 'rtx') {
      var g = sc.add.graphics();
      g.fillStyle(c, 0.16).fillRoundedRect(-W / 2, -H, W, H, 3);
      g.lineStyle(2, c, 1).strokeRoundedRect(-W / 2 - 1.5, -H - 1.5, W + 3, H + 3, 4);
      this.c.addAt(g, 2);
      sc.tweens.add({ targets: g, alpha: 0, duration: 320, onComplete: function () { g.destroy(); } });
      // the glow follows the cursor: letters just typed get the colour, then go back
      var from = Math.max(0, this.i - 3), lit = [];
      for (var k = from; k < this.i; k++) if (this.chars[k] && this.chars[k].t) lit.push({ t: this.chars[k].t, w: (k - from + 1) / (this.i - from) });
      var cA = Phaser.Display.Color.IntegerToColor(c), cG = Phaser.Display.Color.IntegerToColor(0x2e9e52);
      sc.tweens.addCounter({ from: 1, to: 0, duration: 300, onUpdate: function (tw) {
        var v = tw.getValue();
        lit.forEach(function (o) {
          var f = v * o.w, m = Phaser.Display.Color.Interpolate.ColorWithColor(cG, cA, 1, f);
          if (o.t.active) o.t.setTint(Phaser.Display.Color.GetColor(m.r, m.g, m.b));
        });
      }, onComplete: function () { lit.forEach(function (o) { if (o.t.active) o.t.setTint(0x2e9e52); }); } });
    } else if (kind === 'g_pulse') {
      // the bubble breathes once, with a soft wash of the colour
      var pw = sc.add.graphics();
      pw.fillStyle(c, 0.2).fillRoundedRect(-W / 2, -H, W, H, 3);
      this.c.addAt(pw, 2);
      sc.tweens.add({ targets: pw, alpha: 0, duration: 260, onComplete: function () { pw.destroy(); } });
      if (!sc.tweens.isTweening(this.c)) sc.tweens.add({ targets: this.c, scale: 1.05, duration: 70, yoyo: true, ease: 'Sine.easeOut' });
    } else if (kind === 'g_rainbow') {
      // a rim in all colours, and the letters just typed in a rainbow for a moment
      var rg = sc.add.graphics(), n = 12;
      for (var q = 0; q < n; q++) {
        rg.lineStyle(2, Phaser.Display.Color.HSVToRGB(q / n, 0.75, 1).color, 1);
        var t0 = q / n, t1 = (q + 1) / n, P0 = this.rimPoint(t0), P1 = this.rimPoint(t1);
        rg.lineBetween(P0.x, P0.y, P1.x, P1.y);
      }
      this.c.addAt(rg, 2);
      sc.tweens.add({ targets: rg, alpha: 0, duration: 380, onComplete: function () { rg.destroy(); } });
      for (var k2 = Math.max(0, this.i - 3); k2 < this.i; k2++) (function (ch, hue) {
        if (!ch || !ch.t) return;
        ch.t.setTint(Phaser.Display.Color.HSVToRGB(hue, 0.8, 0.9).color);
        sc.time.delayedCall(260, function () { if (ch.t.active) ch.t.setTint(0x2e9e52); });
      })(this.chars[k2], (k2 * 0.13) % 1);
    } else if (kind === 'g_neon' || kind === 'neon') {
      // a neon sign: a bright tube around the bubble that buzzes on and slowly goes out
      if (this.neon) this.neon.destroy();
      var nb = this.neon = sc.add.graphics();
      nb.lineStyle(4, c, 0.35).strokeRoundedRect(-W / 2 - 3, -H - 3, W + 6, H + 6, 5);
      nb.lineStyle(1.5, c, 1).strokeRoundedRect(-W / 2 - 2, -H - 2, W + 4, H + 4, 5);
      nb.lineStyle(0.6, 0xffffff, 0.9).strokeRoundedRect(-W / 2 - 2, -H - 2, W + 4, H + 4, 5);
      this.c.addAt(nb, 0);
      sc.tweens.add({ targets: nb, alpha: { from: 0.2, to: 1 }, duration: 35, yoyo: true, repeat: 2, onComplete: function () {
        sc.tweens.add({ targets: nb, alpha: 0, delay: 250, duration: 500, onComplete: function () { nb.destroy(); if (self.neon === nb) self.neon = null; } });
      } });
      var lt = this.chars[this.i - 1];
      if (lt && lt.t) { lt.t.setTint(c); sc.time.delayedCall(220, function () { if (lt.t.active) lt.t.setTint(0x2e9e52); }); }
    } else {
      var bar = sc.add.graphics(), pos = { x: -W / 2 - 8 };
      this.c.addAt(bar, 2);
      sc.tweens.add({ targets: pos, x: W / 2 + 8, duration: 260, ease: 'Sine.easeInOut', onUpdate: function () {
        bar.clear();
        // a slanted band, kept inside the bubble
        var a = Math.max(-W / 2, pos.x - 4), b = Math.min(W / 2, pos.x + 4);
        if (b > a) { bar.fillStyle(0xffffff, 0.75); bar.fillRect(a, -H + 1, b - a, H - 2); }
      }, onComplete: function () { bar.destroy(); } });
      var last = this.chars[this.i - 1];
      if (last && last.t) {
        last.t.setTint(0xe8eef6);
        sc.time.delayedCall(140, function () { if (last.t.active) last.t.setTint(0x2e9e52); });
      }
    }
  }

  // a point on the bubble's edge, t from 0 to 1 going round
  rimPoint(t) {
    var W = this.w + 3, H = this.h + 3, L = 2 * (W + H), d = t * L, x0 = -W / 2, y0 = -this.h - 1.5;
    if (d < W) return { x: x0 + d, y: y0 };
    d -= W; if (d < H) return { x: x0 + W, y: y0 + d };
    d -= H; if (d < W) return { x: x0 + W - d, y: y0 + H };
    d -= W; return { x: x0, y: y0 + H - d };
  }

  // world position of the next letter (for sparks)
  nextWorldPos() {
    var c = this.chars[Math.max(0, this.i - 1)];
    return { x: this.c.x + (c ? c.x : 0), y: this.c.y + (c ? c.y : 0) };
  }

  moveTo(x, y) { this.c.x = x; this.c.y = y; }

  destroy(pop) {
    var c = this.c;
    if (pop) {
      this.scene.tweens.add({ targets: c, scale: 1.2, alpha: 0, duration: 200, onComplete: function () { c.destroy(); } });
    } else c.destroy();
  }
};
