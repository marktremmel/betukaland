/*
 * Boot: loads every asset listed in assets/manifest.js.
 *
 * We do not use Phaser's file loader because the game must also run when
 * index.html is opened straight from disk (file://), where browsers block
 * file requests. In that case index.html first loads assets/pack.js, which
 * holds every file as a data URI in window.BK_PACK; resolve() then hands out
 * those instead of URLs. Online (GitHub Pages) the normal URLs are used.
 */
/*
 * HD sprites (the figures drawn with ChatGPT): the sheet is drawn at hd times the game size.
 * Every frame keeps sampling the whole drawing but reports, and is drawn at, the game size,
 * so the rest of the game sees a normal sprite while the high-resolution canvas shows the
 * detail. Frame UVs are computed before the sizes are divided, and nothing re-computes them
 * (the game never crops these sprites).
 */
BK.hdTexture = function (tex, k) {
  tex.getFrameNames(true).forEach(function (name) {
    var f = tex.get(name);
    ['cutWidth', 'cutHeight', 'width', 'height', 'realWidth', 'realHeight', 'halfWidth', 'halfHeight',
      'centerX', 'centerY', 'x', 'y'].forEach(function (p) {
      var d = Object.getOwnPropertyDescriptor(f, p);
      if (d && d.writable && typeof f[p] === 'number') f[p] /= k;
    });
    // realWidth and realHeight are read from here
    var D = f.data;
    [[D.sourceSize, 1], [D.spriteSourceSize, 1], [D.cut, 0]].forEach(function (a) {
      var o = a[0]; if (!o) return;
      (a[1] ? ['w', 'h', 'x', 'y'] : ['w', 'h']).forEach(function (p) { if (typeof o[p] === 'number') o[p] /= k; });
    });
    if (typeof D.radius === 'number') D.radius /= k;
  });
  // a whole number of screen pixels per drawn pixel looks sharpest; otherwise smooth it
  var px = (BK.RES || 1) / k;
  if (Math.abs(px - Math.round(px)) > 0.01 || px < 1) tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  tex.hd = k;
};

BK.BootScene = class extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    var self = this, M = window.BK_MANIFEST;
    var resolve = function (u) { return (window.BK_PACK && BK_PACK[u]) || u; };
    var jobs = [];

    var bar = this.add.rectangle(BK.W / 2 - 80, BK.H / 2, 0, 6, 0xffd23c).setOrigin(0, 0.5);
    this.add.rectangle(BK.W / 2, BK.H / 2, 162, 8).setStrokeStyle(1, 0xffffff);
    this.cameras.main.setBackgroundColor('#2b1a14');

    function image(key, url, frame) {
      return new Promise(function (ok) {
        var img = new Image();
        img.onload = function () {
          if (frame) self.textures.addSpriteSheet(key, img, { frameWidth: frame.fw, frameHeight: frame.fh });
          else self.textures.addImage(key, img);
          if (frame && frame.hd) BK.hdTexture(self.textures.get(key), frame.hd);
          ok();
        };
        img.onerror = function () { console.warn('image failed', url); ok(); };
        img.src = resolve(url);
      });
    }
    function text(url) {
      var u = resolve(url);
      if (u.indexOf('data:') === 0) {
        var bin = atob(u.slice(u.indexOf(',') + 1)), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return Promise.resolve(new TextDecoder('utf-8').decode(bytes));
      }
      return fetch(u).then(function (r) { return r.text(); });
    }
    function sound(key, url) {
      var sm = self.sound;
      if (!sm || !sm.decodeAudio || !sm.context) return Promise.resolve();
      var u = resolve(url);
      var data = u.indexOf('data:') === 0 ? Promise.resolve(u) : fetch(u).then(function (r) { return r.arrayBuffer(); });
      return data.then(function (d) {
        return new Promise(function (ok) {
          var done = function (k) { if (k === key) { sm.off('decoded', done); ok(); } };
          sm.on('decoded', done);
          setTimeout(ok, 4000);       // never block the game on a bad file
          sm.decodeAudio(key, d);
        });
      }).catch(function (e) { console.warn('sound failed', key, e); });
    }

    Object.keys(M.sprites).forEach(function (k) { jobs.push(function () { return image(k, M.sprites[k].url, M.sprites[k]); }); });
    Object.keys(M.images).forEach(function (k) {
      var spec = M.images[k];
      // icon sheets are 16x16 grids
      var frame = k.indexOf('icons_') === 0 ? { fw: 16, fh: 16 } : null;
      jobs.push(function () { return image(k, spec.url, frame); });
    });
    Object.keys(M.skies).forEach(function (n) {
      M.skies[n].forEach(function (u, i) { jobs.push(function () { return image('sky' + n + '_' + (i + 1), u); }); });
    });
    Object.keys(M.backdrops || {}).forEach(function (name) {
      M.backdrops[name].forEach(function (l, i) { jobs.push(function () { return image('bd_' + name + '_' + (i + 1), l.url); }); });
    });
    Object.keys(M.fonts).forEach(function (name) {
      jobs.push(function () {
        return Promise.all([image(name, M.fonts[name].png), text(M.fonts[name].xml)]).then(function (r) {
          var xml = new DOMParser().parseFromString(r[1], 'text/xml');
          var tex = self.textures.get(name);
          var data = Phaser.GameObjects.BitmapText.ParseXMLBitmapFont(xml, tex.get(), 0, 0, tex);
          self.cache.bitmapFont.add(name, { data: data, texture: name, frame: null });
        });
      });
    });
    Object.keys(M.sounds).forEach(function (k) { jobs.push(function () { return sound(k, M.sounds[k]); }); });

    var total = jobs.length, done = 0;
    // run 6 jobs at a time
    var queue = jobs.slice();
    function worker() {
      var j = queue.shift();
      if (!j) return Promise.resolve();
      return j().then(function () { done++; bar.width = 160 * done / total; return worker(); });
    }
    Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]).then(function () {
      self.finish();
    });
  }

  finish() {
    BK.ui.makeTextures(this);
    BK.ui.prepareNine(this);
    // one animation per sprite strip, named like the texture
    var S = BK_MANIFEST.sprites, anims = this.anims;
    Object.keys(S).forEach(function (k) {
      if (anims.exists(k)) return;
      anims.create({ key: k, frames: anims.generateFrameNumbers(k, { start: 0, end: S[k].frames - 1 }), frameRate: S[k].fps, repeat: -1 });
    });
    BK.audio.init(this.game);
    window.BK_READY = true;            // used by the automated test
    this.scene.start('Title');
  }
};
