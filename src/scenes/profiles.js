/*
 * Profile select ("Ki játszik?") and new profile creation.
 * Profiles: nickname + avatar only, never real names.
 */
BK.ProfilesScene = class extends Phaser.Scene {
  constructor() { super('Profiles'); }

  init(data) { this.saved = data && data.saved; this.savedNick = data && data.nick; }
  create() {
    var s = this;
    BK.menuBackground(this, 5, { groundY: 196 });
    BK.ui.text(this, BK.W / 2, 14, BK.T.whoPlays, { size: 2, origin: [0.5, 0.5], color: 0xfff2dc });
    this.page = 0;
    this.cards = [];
    this.drawCards();
    BK.ui.button(this, 52, 204, BK.T.back, function () { s.scene.start('Title'); }, { w: 70, h: 18, key: 'ESC' });
    BK.ui.button(this, BK.W / 2, 204, BK.L('Mentőkód / fájl', 'Code / file'), function () { BK.SaveCodeUI.open(null, function () { s.scene.restart({}); }); }, { w: 96, h: 18 });
    // shared computers: the save lives in this browser profile only
    var hint = this.saved
      ? BK.L('Elmentve a Letöltések mappába: ', 'Saved to Downloads: ') + this.saved
      : BK.L('Nem találod magad? Nézd meg, kinek a Chrome-profiljában vagy (jobbra fent), vagy töltsd be a mentésed fájlból!',
        'Can\'t find yourself? Check whose Chrome profile is open (top right), or load your save file!');
    var ht = BK.ui.text(this, BK.W / 2, 188, hint, { origin: [0.5, 0.5], px: 8, color: this.saved ? 0xb8f0a0 : 0xffe9a0, width: 360, align: 1 });
    if (this.saved) this.time.delayedCall(6000, function () { if (ht.active) ht.setText(BK.L('Nem találod magad? Nézd meg, kinek a Chrome-profiljában vagy (jobbra fent), vagy töltsd be a mentésed fájlból!',
      'Can\'t find yourself? Check whose Chrome profile is open (top right), or load your save file!')).setTint(0xffe9a0); });
    BK.audio.music(BK.MUSIC.title);
  }

  drawCards() {
    var s = this;
    this.cards.forEach(function (o) { o.destroy(); });
    this.cards = [];
    var list = BK.save.profiles().slice().sort(function (a, b) { return (b.lastPlayed || '').localeCompare(a.lastPlayed || ''); });
    var perPage = 7, pages = Math.max(1, Math.ceil((list.length + 1) / (perPage + 1)));
    var items = list.slice(this.page * perPage, this.page * perPage + perPage);
    var all = items.map(function (p) { return { p: p }; });
    all.push({ add: true });
    all.forEach(function (it, i) {
      var col = i % 4, row = Math.floor(i / 4);
      var x = 24 + col * 86, y = 30 + row * 78;
      var card = BK.ui.nine(s, x, y, 78, 72, it.add ? 'ui_slot' : 'ui_slot_sel');
      s.cards.push(card);
      if (it.add) {
        s.cards.push(BK.ui.text(s, x + 39, y + 36, BK.T.newPlayer, { outline: false, origin: [0.5, 0.5] }));
      } else {
        var av = BK.avatarSprite(s, x + 39, y + 44, it.p.avatar, it.p);
        if (av.height > 42) av.setScale(42 / av.height);    // tall figures stay inside the card
        s.cards.push(av);
        s.cards.push(BK.ui.text(s, x + 39, y + 45, it.p.nick, { outline: false, origin: [0.5, 0] }));
        s.cards.push(s.add.image(x + 30, y + 63, 'star_on'));
        s.cards.push(BK.ui.text(s, x + 38, y + 63, String(BK.save.totalStars(it.p)), { outline: false, origin: [0, 0.5] }));
      }
      var z = s.add.zone(x + 39, y + 36, 78, 72).setInteractive({ useHandCursor: true });
      s.cards.push(z);
      z.on('pointerup', function () {
        BK.audio.sfx('ui');
        if (it.add) s.scene.start('NewProfile');
        else s.choose(it.p);
      });
    });
    if (pages > 1) {
      var nb = BK.ui.button(s, BK.W - 46, 204, '>>', function () { s.page = (s.page + 1) % pages; s.drawCards(); }, { w: 50, h: 18 });
      s.cards.push(nb, nb.zone);
    }
  }

  choose(p) {
    BK.setProfile(p);
    if (!p.placed) this.scene.start('Placement');
    else this.scene.start('Map');
  }
};

BK.NewProfileScene = class extends Phaser.Scene {
  constructor() { super('NewProfile'); }

  create() {
    var s = this;
    BK.menuBackground(this, 5, { groundY: 196 });
    this.step = 0;
    this.nick = '';
    this.avatar = 0;
    this.grade = '3-4';
    this.lang = 'hu';
    this.ui = [];
    this.keyHandler = function (e) { s.onKey(e); };
    window.addEventListener('keydown', this.keyHandler);
    this.events.once('shutdown', function () { window.removeEventListener('keydown', s.keyHandler); });
    this.draw();
  }

  clear() { this.ui.forEach(function (o) { o.destroy(); }); this.ui = []; }
  keep(o) { this.ui.push(o); if (o.zone) this.ui.push(o.zone); return o; }

  draw() {
    var s = this;
    this.clear();
    this.keep(BK.ui.nine(this, 42, 20, 300, 156, 'ui_panel2'));
    if (this.step === 0) {
      this.keep(BK.ui.text(this, 192, 54, BK.T.nickPrompt, { outline: false, size: 2, origin: [0.5, 0.5] }));
      this.keep(BK.ui.nine(this, 102, 72, 180, 30, 'ui_field'));
      this.nickText = this.keep(BK.ui.text(this, 192, 87, this.nick + '_', { outline: false, size: 2, origin: [0.5, 0.5], color: 0x2b1a14 }));
      this.keep(BK.ui.text(this, 192, 118, BK.T.nickHint, { outline: false, origin: [0.5, 0.5], color: 0x6b3a20 }));
      this.keep(BK.ui.button(this, 192, 150, BK.T.next, function () { s.nextStep(); }, { w: 80 }));
    } else if (this.step === 1) {
      this.keep(BK.ui.text(this, 192, 41, BK.T.chooseAvatar, { outline: false, size: 2, origin: [0.5, 0.5] }));
      // 8 figures a page (4 x 2); the page follows the chosen figure
      var PER = 8, page = Math.floor(this.avatar / PER), pages = Math.ceil(BK.N_FREE_HEROES / PER);
      BK.HEROES.forEach(function (h, i) {
        if (h.lock || Math.floor(i / PER) !== page) return;
        // figure above, name below, the chosen one framed in white
        var j = i % PER, x = 93 + (j % 4) * 66, y = 83 + Math.floor(j / 4) * 50;
        var sel = i === s.avatar;
        s.keep(BK.ui.nine(s, x - 31, y - 25, 62, 50, sel ? 'ui_slot_sel' : 'ui_slot'));
        var spr = s.keep(BK.avatarSprite(s, x, y + 6, i));
        if (h.id === 'crab') spr.setScale(2);           // the crab is tiny
        else if (spr.height > 40) spr.setScale(40 / spr.height);   // tall ones fit the slot
        s.keep(BK.ui.text(s, x, y + 7, h.name, { outline: false, origin: [0.5, 0], color: 0x4a2c1c, bold: sel, fit: 56 }));
        if (sel) s.keep(s.add.rectangle(x, y, 66, 54).setStrokeStyle(2, 0xffffff));
        var z = s.keep(s.add.zone(x, y, 62, 50).setInteractive({ useHandCursor: true }));
        // first click selects, a second click on the same figure confirms
        z.on('pointerup', function () {
          BK.audio.sfx('ui');
          if (s.avatar === i) s.nextStep(); else { s.avatar = i; s.draw(); }
        });
      });
      if (pages > 1) {
        var turn = function (d) {
          var np = (page + d + pages) % pages;
          s.avatar = Math.min(BK.N_FREE_HEROES - 1, np * PER + (s.avatar % PER)); s.draw();
        };
        this.keep(BK.ui.button(this, 50, 108, '<', function () { turn(-1); }, { w: 14, h: 22 }));
        this.keep(BK.ui.button(this, 334, 108, '>', function () { turn(1); }, { w: 14, h: 22 }));
        this.keep(BK.ui.text(this, 192, 165, (page + 1) + ' / ' + pages, { outline: false, origin: [0.5, 0.5], color: 0x6b3a20 }));
      }
      this.keep(BK.ui.text(this, 172, 186, BK.L('<- -> és Enter', '<- -> and Enter'), { origin: [0.5, 0.5], color: 0xfff2dc }));
      this.keep(BK.ui.button(this, 300, 186, BK.T.next, function () { s.nextStep(); }, { w: 64, h: 16 }));
    } else if (this.step === 2) {
      this.keep(BK.ui.text(this, 192, 54, BK.T.chooseGrade, { outline: false, size: 2, origin: [0.5, 0.5] }));
      this.keep(BK.ui.button(this, 192, 88, BK.T.grade34, function () { s.grade = '3-4'; s.nextStep(); }, { w: 140 }));
      this.keep(BK.ui.button(this, 192, 116, BK.T.grade56, function () { s.grade = '5-6'; s.nextStep(); }, { w: 140 }));
    } else if (this.step === 3) {
      this.keep(BK.ui.text(this, 192, 54, BK.T.chooseLang, { outline: false, size: 2, origin: [0.5, 0.5] }));
      this.keep(BK.ui.button(this, 192, 88, BK.T.langHu, function () { s.lang = 'hu'; s.nextStep(); }, { w: 140 }));
      this.keep(BK.ui.button(this, 192, 116, BK.T.langEn, function () { s.lang = 'en'; s.nextStep(); }, { w: 140 }));
    }
    this.keep(BK.ui.button(this, 52, 204, BK.T.back, function () {
      if (s.step === 0) s.scene.start('Profiles', {}); else { s.step--; s.draw(); }
    }, { w: 70, h: 18, key: 'ESC' }));
  }

  onKey(e) {
    if (e.metaKey || (e.ctrlKey && !e.altKey)) return;
    var k = e.key;
    if (k === 'Enter' && e.repeat) return;     // a held Enter must not skip the next steps
    if (this.step === 0) {
      if (k === 'Enter') { this.nextStep(); return; }
      if (k === 'Backspace') { this.nick = Array.from(this.nick).slice(0, -1).join(''); }
      else if (k.length === 1 && Array.from(this.nick).length < 12 && /[\p{L}0-9 \-_.!]/u.test(k)) {
        if (!(k === ' ' && this.nick.length === 0)) this.nick += BK.util.norm(k);
        e.preventDefault();
      } else return;
      BK.audio.sfx('key_ok', { volume: 0.3 });
      this.nickText.setText(this.nick + '_');
    } else if (this.step === 1) {
      if (k === 'ArrowRight') { this.avatar = (this.avatar + 1) % BK.N_FREE_HEROES; this.draw(); }
      if (k === 'ArrowLeft') { this.avatar = (this.avatar + BK.N_FREE_HEROES - 1) % BK.N_FREE_HEROES; this.draw(); }
      if (k === 'ArrowDown') { this.avatar = (this.avatar + 4) % BK.N_FREE_HEROES; this.draw(); }
      if (k === 'ArrowUp') { this.avatar = (this.avatar + BK.N_FREE_HEROES - 4) % BK.N_FREE_HEROES; this.draw(); }
      if (k === 'Enter') this.nextStep();
    } else if (this.step === 2) {
      if (k === '1') { this.grade = '3-4'; this.nextStep(); }
      if (k === '2') { this.grade = '5-6'; this.nextStep(); }
    } else if (this.step === 3) {
      if (k === '1') { this.lang = 'hu'; this.nextStep(); }
      if (k === '2') { this.lang = 'en'; this.nextStep(); }
    }
  }

  nextStep() {
    if (this.step === 0) {
      this.nick = this.nick.trim();
      if (!this.nick) { BK.audio.sfx('key_bad', { volume: 0.3 }); return; }
    }
    BK.audio.sfx('chime');
    this.step++;
    if (this.step > 3) {
      var p = BK.save.newProfile(this.nick, this.avatar, this.grade, this.lang);
      p.settings.ui = BK.uiLang;
      BK.save.add(p);
      BK.setProfile(p);
      this.scene.start('Placement');
      return;
    }
    this.draw();
  }
};
