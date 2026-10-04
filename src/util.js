/*
 * Small helpers: seeded random numbers, text helpers, date helpers.
 */
BK.util = {};

// Mulberry32: tiny seeded PRNG. Same seed -> same level (daily challenge).
BK.util.rng = function (seed) {
  var a = seed >>> 0;
  var r = function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = function (n) { return Math.floor(r() * n); };
  r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
  r.chance = function (p) { return r() < p; };
  r.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  // pick with weights (array of numbers, same length)
  r.weighted = function (arr, weights) {
    var sum = 0, i;
    for (i = 0; i < weights.length; i++) sum += weights[i];
    var x = r() * sum;
    for (i = 0; i < arr.length; i++) { x -= weights[i]; if (x <= 0) return arr[i]; }
    return arr[arr.length - 1];
  };
  return r;
};

// Hash a string to a 32-bit seed
BK.util.hash = function (s) {
  var h = 2166136261;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

BK.util.today = function () {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

BK.util.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

// Normalise a typed character (Mac can deliver decomposed accents)
BK.util.norm = function (s) { return s && s.normalize ? s.normalize('NFC') : s; };

// Lowercase base key for a character (used for the keyboard view + stats)
BK.util.baseKey = function (ch) {
  if (BK.SHIFT_MAP[ch]) return BK.SHIFT_MAP[ch];
  var lo = ch.toLowerCase();
  return lo;
};
BK.util.needsShift = function (ch) {
  return !!BK.SHIFT_MAP[ch] || (ch !== ch.toLowerCase());
};

// WPM: 5 characters = 1 word
BK.util.wpm = function (chars, ms) {
  if (ms < 1000) return 0;
  return (chars / 5) / (ms / 60000);
};

BK.util.download = function (filename, text, mime) {
  var blob = new Blob([text], { type: mime || 'application/octet-stream' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
};
