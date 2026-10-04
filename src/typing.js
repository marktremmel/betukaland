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
    var size = opts.size || (text.length <= 14 ? 2 : 1);
    this.size = size;
    var maxW = opts.maxWidth || 300;
    this.c = scene.add.container(x, y).setDepth(200);
    this.chars = [];
    // lay out characters, wrapping at spaces if too wide
    var adv = function (ch) {
      var d = scene.cache.bitmapFont.get('m5x7').data.chars[ch.charCodeAt(0)];
      return (d ? d.xAdvance : 5) * size;
    };
    var words = text.split(' '), lines = [[]], lineW = [0], spaceW = adv(' ');
    words.forEach(function (w, wi) {
      var ww = 0; for (var k = 0; k < w.length; k++) ww += adv(w[k]);
      var cur = lines.length - 1;
      if (lineW[cur] > 0 && lineW[cur] + spaceW + ww > maxW) { lines.push([]); lineW.push(0); cur++; }
      if (lineW[cur] > 0 || wi > 0 && lines[cur].length === 0 && cur === 0) { /* noop */ }
      lines[cur].push(w);
      lineW[cur] += (lines[cur].length > 1 ? spaceW : 0) + ww;
    });
    var lineH = 13 * size, W = Math.max.apply(null, lineW) + 10, H = lines.length * lineH + 6;
    this.w = W; this.h = H;
    var g = scene.add.graphics();
    g.fillStyle(0x5a3426, 1).fillRoundedRect(-W / 2 - 1, -H - 1, W + 2, H + 2, 4);
    g.fillStyle(0xfffaeb, 1).fillRoundedRect(-W / 2, -H, W, H, 3);
    var tail = scene.add.image(0, 3, 'tail').setOrigin(0.5, 1);
    this.c.add([g, tail]);
    this.under = scene.add.rectangle(0, 0, 4, size, 0xe0742c).setOrigin(0, 0);
    var self = this, idx = 0;
    lines.forEach(function (line, li) {
      var lx = -lineW[li] / 2, ly = -H + 3 + li * lineH;
      var str = line.join(' ');
      for (var k = 0; k < str.length; k++) {
        var ch = str[k];
        var t = scene.add.bitmapText(lx, ly - 2 * size, 'm5x7', ch, 16).setScale(size).setTint(0x4a2c1c);
        t.baseY = t.y;
        self.c.add(t);
        self.chars.push({ t: t, ch: ch, x: lx, y: ly, w: adv(ch) });
        lx += adv(ch);
        idx++;
      }
      // the space between lines is still a character to type
      if (li < lines.length - 1) {
        self.chars.push({ t: null, ch: ' ', x: lx, y: ly, w: spaceW });
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
    this.under.x = c.x; this.under.y = c.y + 10 * this.size;
    this.under.width = Math.max(2, c.w - this.size);
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
