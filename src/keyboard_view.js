/*
 * On-screen keyboard in the child's layout (Hungarian QWERTZ or English QWERTY).
 * - keys colour-coded by finger (or plain when finger colours are off)
 * - keys not unlocked yet are dimmed
 * - the next key is outlined and gently pulses; Shift too when needed
 * - a wrong key flashes softly
 * Can be hidden from the settings (advanced players).
 */
BK.KeyboardView = class {
  constructor(scene, opts) {
    this.scene = scene;
    this.opts = opts || {};
    this.allowed = this.opts.allowed || {};
    this.colours = this.opts.fingers !== false;
    this.keys = {};
    this.y0 = BK.KB_TOP;
    var KW = 15, KH = 13, G = 1;
    this.KW = KW; this.KH = KH;
    var total = 13 * (KW + G);
    var x0 = Math.floor((BK.W - total - 22) / 2) + 6;
    this.panel = scene.add.rectangle(0, this.y0, BK.W, BK.H - this.y0, 0x3e2c28).setOrigin(0, 0).setDepth(300);
    this.edge = scene.add.rectangle(0, this.y0, BK.W, 1, 0x9a6446).setOrigin(0, 0).setDepth(300);
    this.g = scene.add.graphics().setDepth(301);
    this.labels = [];
    var self = this;
    BK.KB_ROWS.forEach(function (row, r) {
      row.keys.forEach(function (k, i) {
        var x = x0 + row.offset + i * (KW + G), y = self.y0 + 4 + r * (KH + G);
        self.keys[k] = { x: x, y: y, w: KW, h: KH, k: k };
        var t = BK.ui.text(scene, x + KW / 2, y + KH / 2 - 1, k, { outline: false, px: 10, bold: true, origin: [0.5, 0.5] }).setDepth(302);
        self.keys[k].t = t;
      });
    });
    // Shift keys and space
    var r3y = this.y0 + 4 + 3 * (KH + G);
    var bottom = BK.KB_ROWS[3].keys, firstBottom = this.keys[bottom[0]], lastBottom = this.keys[bottom[bottom.length - 1]];
    this.keys.shiftL = { x: x0 - 25, y: r3y, w: firstBottom.x - G - (x0 - 25), h: KH, k: 'shiftL' };
    this.keys.shiftR = { x: lastBottom.x + KW + G, y: r3y, w: 34, h: KH, k: 'shiftR' };
    this.keys[' '] = { x: x0 + 3 * (KW + G) + 3, y: r3y + KH + G, w: 6 * (KW + G), h: 9, k: ' ' };
    ['shiftL', 'shiftR'].forEach(function (s) {
      var K = self.keys[s];
      K.t = BK.ui.text(scene, K.x + K.w / 2, K.y + K.h / 2 - 1, 'shift', { outline: false, px: 8, bold: true, origin: [0.5, 0.5] }).setDepth(302);
    });
    // finger hint text on the right
    this.hint = BK.ui.text(scene, BK.W - 4, BK.H - 2, '', { origin: [1, 1], color: 0xffe9c8, px: 9 }).setDepth(303);
    this.next = null; this.shiftNeeded = null; this.flash = null; this.flashT = 0; this.pulse = 0;
    this.draw();
  }

  setAllowed(set) { this.allowed = set; this.draw(); }

  // ch: next character expected (or null)
  setNext(ch) {
    if (!ch) { this.next = null; this.shiftNeeded = null; this.hint.setText(''); this.draw(); return; }
    var base = BK.util.baseKey(ch);
    this.next = base;
    this.shiftNeeded = null;
    if (BK.util.needsShift(ch)) {
      // the Shift on the other hand from the key's finger
      var f = BK.FINGER_OF[base];
      this.shiftNeeded = (f !== undefined && f <= 3) ? 'shiftR' : 'shiftL';
    }
    var f2 = BK.FINGER_OF[base];
    var name = f2 !== undefined ? BK.FINGER_NAMES[f2] : '';
    this.hint.setText(name);
    if (f2 !== undefined) this.hint.setTint(BK.FINGER_COLOURS[f2]);
    this.draw();
  }

  flashWrong(ch) {
    var base = BK.util.baseKey(ch);
    if (!this.keys[base]) return;
    this.flash = base; this.flashT = 14; this.draw();
  }

  update() {
    this.pulse = (this.pulse + 1) % 60;
    if (this.flashT > 0) { this.flashT--; if (!this.flashT) this.flash = null; }
    if (this.pulse % 6 === 0 || this.flashT) this.draw();
  }

  draw() {
    var g = this.g, self = this;
    g.clear();
    Object.keys(this.keys).forEach(function (k) {
      var K = self.keys[k];
      var on = k === ' ' || k === 'shiftL' || k === 'shiftR' || !!self.allowed[k];
      var f = BK.FINGER_OF[k];
      var col = (self.colours && f !== undefined) ? BK.FINGER_COLOURS[f] : 0xd8cfc4;
      if (k === 'shiftL') col = self.colours ? BK.FINGER_COLOURS[0] : 0xd8cfc4;
      if (k === 'shiftR') col = self.colours ? BK.FINGER_COLOURS[7] : 0xd8cfc4;
      if (!on) col = Phaser.Display.Color.GetColor(
        ((col >> 16) & 255) * 0.35 + 40, ((col >> 8) & 255) * 0.35 + 34, (col & 255) * 0.35 + 32);
      var isNext = k === self.next || k === self.shiftNeeded;
      // key body + darker bottom edge
      g.fillStyle(0x1c1210, 1).fillRect(K.x, K.y, K.w, K.h);
      g.fillStyle(col, 1).fillRect(K.x + 1, K.y + 1, K.w - 2, K.h - 3);
      g.fillStyle(Phaser.Display.Color.ValueToColor(col).darken(25).color, 1).fillRect(K.x + 1, K.y + K.h - 2, K.w - 2, 1);
      if (k === 'f' || k === 'j') { g.fillStyle(0x2b1a14, 1).fillRect(K.x + 6, K.y + K.h - 4, 3, 1); }  // home bumps
      if (self.flash === k) { g.fillStyle(0xffffff, 0.55).fillRect(K.x + 1, K.y + 1, K.w - 2, K.h - 2); }
      if (isNext) {
        var a = self.pulse < 30 ? 1 : 0.55;
        g.lineStyle(2, 0xffffff, a).strokeRect(K.x - 1, K.y - 1, K.w + 2, K.h + 2);
      }
      if (K.t) K.t.setTint(on ? 0x2b1a14 : 0x6e5e58);
    });
  }

  setVisible(v) {
    [this.panel, this.edge, this.g, this.hint].forEach(function (o) { o.setVisible(v); });
    var self = this;
    Object.keys(this.keys).forEach(function (k) { if (self.keys[k].t) self.keys[k].t.setVisible(v); });
  }
};
