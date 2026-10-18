/*
 * Narrator: a little character flies in and tells a bit of the story in a
 * video-game dialogue box. The text appears letter by letter with a
 * synthesised blip "voice" (BK.audio.blip). Enter, Space or a click shows the
 * whole page at once, then goes on to the next page; after the last page
 * onDone() runs.
 *
 *   new BK.Narrator(scene, { sprite: 'hw_bat_fly', name: 'Denevérke', text: '...', voice: 700, onDone: fn })
 */
BK.Narrator = class {
  constructor(scene, o) {
    var s = scene, self = this;
    this.scene = s; this.o = o;
    this.pages = BK.Narrator.paginate(o.text, o.perPage || 120);
    this.page = 0; this.shown = 0; this.objs = [];
    var keep = function (x) { self.objs.push(x); return x; };
    var bx = 74, by = 58, bw = BK.W - 86, bh = 52;
    this.box = { x: bx, y: by, w: bw, h: bh };
    keep(s.add.rectangle(BK.W / 2, BK.H / 2, BK.W, BK.H, 0x000000, 0.25).setDepth(890).setInteractive());
    // a classic game dialogue box: dark, with a glowing orange edge
    var g = keep(s.add.graphics().setDepth(891));
    g.fillStyle(0x1e1030, 0.94).fillRoundedRect(bx, by, bw, bh, 5);
    g.lineStyle(2, 0xffa040, 1).strokeRoundedRect(bx, by, bw, bh, 5);
    g.lineStyle(1, 0x7a4aaa, 1).strokeRoundedRect(bx + 3, by + 3, bw - 6, bh - 6, 3);
    // name tag
    var tag = keep(BK.ui.text(s, bx + 14, by - 6, o.name || '', { origin: [0, 0.5], color: 0xffe9a0, px: 10, bold: true }).setDepth(893));
    keep(s.add.rectangle(tag.x - 3, tag.y, tag.displayWidth + 6, 12, 0x3a1850, 0.95).setOrigin(0, 0.5).setStrokeStyle(1, 0xffa040).setDepth(892));
    this.txt = keep(BK.ui.text(s, bx + 12, by + 10, '', { outline: false, width: bw - 24, color: 0xfff2dc }).setDepth(893));
    this.more = keep(BK.ui.text(s, bx + bw - 12, by + bh - 9, '▼', { origin: [0.5, 0.5], color: 0xffa040, px: 9 }).setDepth(893).setVisible(false));
    s.tweens.add({ targets: this.more, y: this.more.y + 2, duration: 300, yoyo: true, repeat: -1 });
    this.hint = keep(BK.ui.text(s, bx + bw - 22, by + bh - 9, 'Enter', { origin: [1, 0.5], color: 0xb8a8c8, px: 8 }).setDepth(893).setVisible(false));
    // the narrator flies in from the left and bobs beside the box
    var key = o.sprite && BK_MANIFEST.sprites[o.sprite] ? o.sprite : 'crow_fly';
    var spr = this.spr = keep(s.add.sprite(-20, by + 22, key).setDepth(894));
    spr.play(key);
    spr.setFlipX(key === 'crow_fly');            // the crow is drawn facing left
    if (spr.height > 34) spr.setScale(34 / spr.height);
    s.tweens.add({ targets: spr, x: bx - 20, duration: 500, ease: 'Back.easeOut', onComplete: function () {
      s.tweens.add({ targets: spr, y: spr.y - 4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      self.startPage();
    } });
    BK.audio.sfx('ui', { volume: 0.4 });
    this.onKey = function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); e.stopPropagation();
      self.advance();
    };
    window.addEventListener('keydown', this.onKey, true);
    this.objs[0].on('pointerup', function () { self.advance(); });
    s.events.once('shutdown', function () { self.destroy(); });
  }

  // split into pages of whole sentences, about n characters each
  static paginate(text, n) {
    var parts = text.match(/[^.!?]+[.!?]*\s*/g) || [text], pages = [], cur = '';
    parts.forEach(function (p) {
      if (cur && (cur + p).length > n) { pages.push(cur.trim()); cur = ''; }
      cur += p;
    });
    if (cur.trim()) pages.push(cur.trim());
    return pages;
  }

  startPage() {
    var self = this, s = this.scene, full = this.pages[this.page];
    this.shown = 0; this.typing = true;
    this.more.setVisible(false); this.hint.setVisible(false);
    if (this.timer) this.timer.remove();
    this.timer = s.time.addEvent({ delay: 28, loop: true, callback: function () {
      self.shown++;
      var ch = full[self.shown - 1];
      self.txt.setText(full.slice(0, self.shown));
      if (ch && /\p{L}/u.test(ch) && self.shown % 2) self.voice(ch);
      if (self.shown >= full.length) self.endPage();
    } });
  }

  // a blip pitched by the vowel nearest this letter: it sounds a little like talking
  voice(ch) {
    var c = ch.toLowerCase(), base = this.o.voice || 640;
    var semi = { a: 0, á: 1, e: 3, é: 4, i: 7, í: 8, o: -2, ó: -1, ö: 2, ő: 2, u: -4, ú: -3, ü: 5, ű: 5 }[c];
    if (semi === undefined) semi = (c.charCodeAt(0) % 5) - 2;
    BK.audio.blip(base * Math.pow(2, semi / 12) * (0.97 + Math.random() * 0.06), { len: semi > 0 ? 0.05 : 0.04 });
  }

  endPage() {
    this.typing = false;
    if (this.timer) { this.timer.remove(); this.timer = null; }
    this.txt.setText(this.pages[this.page]);
    this.more.setVisible(true); this.hint.setVisible(true);
  }

  advance() {
    if (this.done) return;
    if (this.typing) { this.endPage(); return; }
    BK.audio.sfx('ui', { volume: 0.3 });
    if (++this.page < this.pages.length) { this.startPage(); return; }
    this.finish();
  }

  finish() {
    var self = this, s = this.scene;
    this.done = true;
    window.removeEventListener('keydown', this.onKey, true);
    s.tweens.killTweensOf(this.spr);
    s.tweens.add({ targets: this.spr, x: BK.W + 30, y: this.spr.y - 30, duration: 500, ease: 'Quad.easeIn' });
    s.time.delayedCall(250, function () { self.destroy(); if (self.o.onDone) self.o.onDone(); });
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey, true);
    if (this.timer) this.timer.remove();
    this.objs.forEach(function (o) { if (o && o.destroy) o.destroy(); });
    this.objs = [];
  }
};
