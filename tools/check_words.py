#!/usr/bin/env python3
"""
Word bank report: how many words and sentences each region gets after the
"only unlocked keys" filter, with examples. Mirrors src/wordbank.js.

    python3 tools/check_words.py          # Hungarian
    python3 tools/check_words.py en       # English
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGION_KEYS = ["asdfjklé", "ghqwertzuiop", "yxcvbnm,.-", "", "áíóöőúüű", '0123456789?!:()"', ""]
CAPITALS_FROM = 4


def load(lang):
    t = open(os.path.join(ROOT, "data", "words_%s.js" % lang), encoding="utf-8").read()
    words = re.search(r"`(.*?)`", t, re.S).group(1).split()
    sents = re.findall(r'"((?:[^"\\]|\\.)*)"', t.split("SENTENCES")[1])
    sents = [s.replace('\\"', '"') for s in sents]
    seen, uniq = set(), []
    for w in words:
        if w not in seen:
            seen.add(w); uniq.append(w)
    return uniq, sents


def allowed(r):
    s = set(" ")
    for i in range(r):
        s |= set(REGION_KEYS[i])
    if r >= CAPITALS_FROM:
        s |= {c.upper() for c in s}
    return s


def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else "hu"
    words, sents = load(lang)
    print("%d words, %d sentences (%s)\n" % (len(words), len(sents), lang))
    for r in range(1, 8):
        a = allowed(r)
        prev = allowed(r - 1) if r > 1 else set()
        ok = [w for w in words if set(w) <= a]
        new = [w for w in ok if not set(w) <= prev]
        ss = [s for s in sents if set(s) <= a]
        print("Region %d: %4d words (%3d need its new keys), %2d sentences  e.g. %s"
              % (r, len(ok), len(new), len(ss), ", ".join(new[:8])))
        if r <= 3 and len(new) < 10:
            print("   WARNING: few words for region %d" % r)
    missing = [s for s in sents if not set(s) <= allowed(7)]
    if missing:
        print("\nSentences with characters no region teaches:", missing)


if __name__ == "__main__":
    main()
