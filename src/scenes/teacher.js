/*
 * HTML screens: save code / save file, and the teacher screen.
 * Teacher-facing text is in English; the save-code screen (children use it)
 * follows the interface language.
 */

BK.SaveCodeUI = {
  open: function (profile, onDone) {
    var esc = BK.html.esc, html = '';
    if (profile) {
      var code = BK.save.encode(profile);
      html += '<h2>' + BK.L('Mentőkód', 'Save code') + '</h2>' +
        '<p>' + BK.L('Írd le vagy másold ki ezt a kódot. Egy másik gépen a „Mentőkód” gombbal folytathatod a játékot.', 'Write down or copy this code. On another computer, press “Save code” to carry on playing.') + '</p>' +
        '<div class="code" id="bk-code">' + esc(code) + '</div>' +
        '<div class="row"><button id="bk-copy">' + BK.L('Másolás', 'Copy') + '</button><button id="bk-dl">' + BK.L('Mentés fájlba', 'Save to file') + '</button></div>' +
        '<p class="small">' + BK.L('A fájl mindent megőriz. A kód a haladást, az érméket, a ruhákat és a gyengébb billentyűket.', 'The file keeps everything. The code keeps your progress, coins, outfits and the keys you find harder.') + '</p><hr>';
    }
    html += '<h2>' + BK.L('Betöltés', 'Load') + '</h2>' +
      '<p>' + BK.L('Másold be a kódot, vagy válaszd ki a mentett fájlt.', 'Paste your code, or choose your save file.') + '</p>' +
      '<textarea id="bk-in" rows="2" placeholder="' + BK.L('pl.', 'e.g.') + ' 4ABC-D12E-..."></textarea>' +
      '<div class="row"><button id="bk-load">' + BK.L('Kód betöltése', 'Load code') + '</button><button id="bk-file">' + BK.L('Fájl megnyitása', 'Open file') + '</button>' +
      '<input type="file" id="bk-fileinput" accept=".json,application/json" style="display:none"></div>' +
      '<p id="bk-msg" class="msg"></p>' +
      '<div class="row"><button id="bk-close" class="secondary">' + BK.L('Bezárás', 'Close') + '</button></div>';
    var el = BK.html.show(html);
    var msg = function (t, ok) { var m = el.querySelector('#bk-msg'); m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); };
    var finish = function () { BK.html.hide(); if (onDone) onDone(); };
    if (profile) {
      el.querySelector('#bk-copy').onclick = function () {
        var c = el.querySelector('#bk-code').textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(c).then(function () { msg(BK.L('Kimásolva!', 'Copied!'), true); }, function () { msg(BK.L('Jelöld ki és másold ki kézzel.', 'Select it and copy it by hand.'), false); });
        } else msg(BK.L('Jelöld ki és másold ki kézzel.', 'Select it and copy it by hand.'), false);
      };
      el.querySelector('#bk-dl').onclick = function () {
        BK.util.download('betukaland-' + profile.nick.replace(/[^\p{L}0-9]+/gu, '_') + '-' + BK.util.today() + '.json', BK.save.toFile(profile), 'application/json');
        msg(BK.L('Fájl letöltve.', 'File downloaded.'), true);
      };
    }
    var importProfile = function (p) {
      var names = BK.save.profiles().map(function (q) { return q.nick; });
      if (profile && p.nick === profile.nick) {
        // loading your own code on this computer replaces this profile
        p.id = profile.id;
        BK.save.replace(p);
      } else {
        var base = p.nick, n = 2;
        while (names.indexOf(p.nick) >= 0) p.nick = base + ' ' + (n++);
        p.id = 'p' + Date.now().toString(36);
        BK.save.add(p);
      }
      BK.setProfile(p);
      msg(BK.L('Betöltve: ', 'Loaded: ') + p.nick, true);
      setTimeout(finish, 700);
    };
    el.querySelector('#bk-load').onclick = function () {
      try { importProfile(BK.save.decode(el.querySelector('#bk-in').value)); }
      catch (e) { msg(BK.L('Ez a kód nem jó. Nézd át még egyszer!', 'This code is not right. Check it once more!'), false); }
    };
    var fi = el.querySelector('#bk-fileinput');
    el.querySelector('#bk-file').onclick = function () { fi.click(); };
    fi.onchange = function () {
      var f = fi.files[0]; if (!f) return;
      f.text().then(function (t) {
        try { importProfile(BK.save.fromFile(t)); } catch (e) { msg(BK.L('Ez nem Betűkaland mentés.', 'This is not a Typing Adventure save file.'), false); }
      });
    };
    el.querySelector('#bk-close').onclick = finish;
    el.querySelector('#bk-in').focus && profile === null && el.querySelector('#bk-in').focus();
  },
};

BK.TeacherScene = class extends Phaser.Scene {
  constructor() { super('Teacher'); }
  create() {
    BK.menuBackground(this, 4, { groundY: 196 });
    this.gate();
  }
  back() { BK.html.hide(); this.scene.start('Title'); }

  gate() {
    var s = this, t = BK.save.teacher();
    if (!t.pinHash) {
      var el = BK.html.show('<h2>Teacher screen</h2><p>Choose a PIN (4 to 8 digits). It keeps students out of this screen; it is not real security.</p>' +
        '<input id="p1" type="password" inputmode="numeric" placeholder="PIN"><input id="p2" type="password" inputmode="numeric" placeholder="PIN again">' +
        '<p id="msg" class="msg"></p><div class="row"><button id="ok">Save PIN</button><button id="cancel" class="secondary">Back</button></div>');
      el.querySelector('#ok').onclick = function () {
        var a = el.querySelector('#p1').value, b = el.querySelector('#p2').value;
        if (!/^\d{4,8}$/.test(a)) { el.querySelector('#msg').textContent = 'Use 4 to 8 digits.'; return; }
        if (a !== b) { el.querySelector('#msg').textContent = 'The two PINs differ.'; return; }
        t.pinHash = BK.save.pinHash(a); BK.save.persist(); s.dashboard();
      };
      el.querySelector('#cancel').onclick = function () { s.back(); };
      el.querySelector('#p1').focus();
      return;
    }
    var el2 = BK.html.show('<h2>Teacher screen</h2><input id="pin" type="password" inputmode="numeric" placeholder="PIN">' +
      '<p id="msg" class="msg"></p><div class="row"><button id="ok">Open</button><button id="cancel" class="secondary">Back</button></div>' +
      '<p class="small">Forgot the PIN? Open the game with <code>?resetpin</code> at the end of the address; this clears the PIN but keeps all profiles.</p>');
    var tryPin = function () {
      if (BK.save.pinHash(el2.querySelector('#pin').value) === t.pinHash) s.dashboard();
      else el2.querySelector('#msg').textContent = 'Wrong PIN.';
    };
    el2.querySelector('#ok').onclick = tryPin;
    el2.querySelector('#pin').onkeydown = function (e) { if (e.key === 'Enter') tryPin(); };
    el2.querySelector('#cancel').onclick = function () { s.back(); };
    el2.querySelector('#pin').focus();
  }

  summary(p) {
    var h = p.history.slice(-10);
    var avg = function (f) { return h.length ? h.reduce(function (a, x) { return a + f(x); }, 0) / h.length : 0; };
    var cur = BK.save.currentRegion(p);
    return {
      nick: p.nick, grade: p.grade, lang: p.lang,
      region: cur + ' ' + BK.REGIONS[cur - 1].name,
      placed: p.placed || '',
      stars: BK.save.totalStars(p),
      levels: p.history.length,
      acc: Math.round(avg(function (x) { return x.acc; }) * 100),
      wpm: Math.round(avg(function (x) { return x.wpm; }) * 10) / 10,
      best: p.best.wpm,
      weak: BK.adaptive.weakest(p, 5).join(' '),
      coins: p.coins,
      last: p.lastPlayed || '',
    };
  }

  dashboard() {
    var s = this, esc = BK.html.esc;
    var rows = BK.save.profiles().map(function (p) {
      var m = s.summary(p);
      return '<tr><td>' + esc(m.nick) + '</td><td>' + m.grade + '</td><td>' + esc(m.region) + '</td><td>' + m.stars + '</td><td>' + m.levels +
        '</td><td>' + (m.levels ? m.acc + '%' : '') + '</td><td>' + (m.levels ? m.wpm : '') + '</td><td>' + m.best + '</td><td class="keys">' + esc(m.weak) +
        '</td><td>' + m.last + '</td><td><button data-code="' + p.id + '" class="mini">Code</button> <button data-del="' + p.id + '" class="mini danger">Delete</button></td></tr>';
    }).join('');
    var el = BK.html.show('<h2>Teacher screen</h2>' +
      '<p class="small">Profiles saved in this browser on this computer. Accuracy and WPM are averages of each student\'s last 10 levels. Weakest keys are the five with the lowest rolling accuracy and speed (at least 5 presses).</p>' +
      '<div class="tablewrap"><table><thead><tr><th>Nickname</th><th>Grade</th><th>Region</th><th>Stars</th><th>Levels</th><th>Accuracy</th><th>WPM</th><th>Best WPM</th><th>Weakest keys</th><th>Last played</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="11">No profiles yet.</td></tr>') + '</tbody></table></div>' +
      '<p id="msg" class="msg"></p>' +
      '<div class="row"><button id="csv">Export CSV</button><button id="imp">Import save files</button><input type="file" id="fi" multiple accept=".json" style="display:none">' +
      '<button id="pin" class="secondary">Change PIN</button><button id="close" class="secondary">Close</button></div>');
    el.querySelector('#close').onclick = function () { s.back(); };
    el.querySelector('#pin').onclick = function () { BK.save.teacher().pinHash = null; BK.save.persist(); s.gate(); };
    el.querySelector('#csv').onclick = function () { s.exportCsv(); };
    var fi = el.querySelector('#fi');
    el.querySelector('#imp').onclick = function () { fi.click(); };
    fi.onchange = function () {
      var files = Array.from(fi.files), n = 0;
      Promise.all(files.map(function (f) { return f.text().then(function (t) {
        try { var p = BK.save.fromFile(t); p.id = 'p' + Date.now().toString(36) + (n++); BK.save.add(p); } catch (e) { /* skip bad file */ }
      }); })).then(function () { s.dashboard(); });
    };
    el.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var p = BK.save.get(b.getAttribute('data-del'));
        if (p && window.confirm('Delete the profile "' + p.nick + '"? This cannot be undone.')) { BK.save.remove(p.id); s.dashboard(); }
      };
    });
    el.querySelectorAll('[data-code]').forEach(function (b) {
      b.onclick = function () {
        var p = BK.save.get(b.getAttribute('data-code'));
        el.querySelector('#msg').textContent = p.nick + ': ' + BK.save.encode(p);
      };
    });
  }

  exportCsv() {
    var s = this;
    var head = ['nickname', 'grade', 'word_language', 'current_region', 'placement_region', 'total_stars', 'levels_played',
      'avg_accuracy_pct', 'avg_wpm', 'best_wpm', 'weakest_keys', 'coins', 'last_played'];
    var lines = [head.join(';')];
    BK.save.profiles().forEach(function (p) {
      var m = s.summary(p);
      var cells = [m.nick, m.grade, m.lang, m.region, m.placed, m.stars, m.levels, m.levels ? m.acc : '', m.levels ? m.wpm : '', m.best, m.weak, m.coins, m.last];
      lines.push(cells.map(function (c) {
        c = String(c);
        if (/^\d+\.\d+$/.test(c)) c = c.replace('.', ',');  // Hungarian Excel expects a decimal comma
        return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c;
      }).join(';'));
    });
    BK.util.download('betukaland-class-' + BK.util.today() + '.csv', '﻿' + lines.join('\r\n'), 'text/csv;charset=utf-8');
  }
};
