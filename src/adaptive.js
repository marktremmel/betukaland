/*
 * Adaptive practice: per-key accuracy and reaction time.
 *
 * Every key (lowercase base key, so 'A' counts for 'a') keeps:
 *   n    - number of times it was the expected key
 *   acc  - rolling accuracy (exponential moving average, 0..1)
 *   ms   - rolling time from the previous correct key to this one
 * weakness() turns that into 0..1, used to weight upcoming words.
 */
BK.adaptive = {
  record: function (profile, expected, ok, ms) {
    if (!profile) return;
    var k = BK.util.baseKey(expected);
    if (k === ' ') return;               // space is not tracked
    var s = profile.keys[k] || (profile.keys[k] = { n: 0, acc: 0.85, ms: 700 });
    if (ok) {
      s.n++;
      s.acc = s.acc * 0.9 + 0.1;
      if (ms > 0 && ms < 4000) s.ms = Math.round(s.ms * 0.85 + ms * 0.15);
    } else {
      s.acc = s.acc * 0.9;
    }
  },

  weakness: function (profile, ch) {
    if (!profile) return 0.3;
    var s = profile.keys[BK.util.baseKey(ch)];
    if (!s || s.n < 5) return 0.5;        // barely practised keys count as half-weak
    var accPart = BK.util.clamp((1 - s.acc) * 3, 0, 1);
    var speedPart = BK.util.clamp((s.ms - 350) / 1200, 0, 1);
    return BK.util.clamp(accPart * 0.7 + speedPart * 0.3, 0, 1);
  },

  wordWeakness: function (profile, word) {
    var sum = 0, n = 0;
    for (var i = 0; i < word.length; i++) {
      if (word[i] === ' ') continue;
      sum += this.weakness(profile, word[i]); n++;
    }
    return n ? sum / n : 0;
  },

  // The n weakest keys with enough data, e.g. for the teacher screen
  weakest: function (profile, n) {
    var self = this;
    return Object.keys(profile.keys || {})
      .filter(function (k) { return profile.keys[k].n >= 5; })
      .sort(function (a, b) { return self.weakness(profile, b) - self.weakness(profile, a); })
      .slice(0, n || 5);
  },
};
