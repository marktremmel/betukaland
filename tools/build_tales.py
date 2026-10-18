#!/usr/bin/env python3
"""
Builds data/tales_hu.js: the tales of the practice corner's Mesék tab.

Source: Benedek Elek's own texts (public domain, he died in 1929), from the MEK RTF
files in mesek/ (not in git): "Grimm testvérek összegyűjtött meséi" and "Magyar mese-
és mondavilág I. A csodaszarvas". Only the tales in PICK are used: short ones, read
through for anything unsuitable for 8-12 year olds. The words are left exactly as
Benedek wrote them (old spellings too). Only the typography is made typeable
(curly quotes, long dashes, ellipsis, soft hyphens, footnote stars) and long sentences
are split into lines at a comma or similar, so they fit the word bubble.

Run: python3 tools/build_tales.py   (needs: pip install striprtf)
"""
import json, os, re, sys
from striprtf.striprtf import rtf_to_text

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "mesek")
BOOKS = {
    "grimm": ("BenedekElek-Grimm.rtf", "Grimm testvérek meséi, Benedek Elek fordításában"),
    "csoda": ("BenedekElekCsodaszarvas.rtf", "Benedek Elek: Magyar mese- és mondavilág"),
}
# (book, title as in the book, title shown, id)
PICK = [
    ("grimm", "A csillagtallérok", "A csillagtallérok", "csillagtallerok"),
    ("csoda", "VÁR ÉS FORRÁS", "Vár és forrás", "var_es_forras"),
    ("csoda", "JAKAB ÉS A ZAB", "Jakab és a zab", "jakab"),
    ("csoda", "AZ ÖREGEK", "Az öregek", "oregek"),
    ("csoda", "PÉTERKE", "Péterke", "peterke"),
    ("grimm", "Mindentudó doktor", "Mindentudó doktor", "mindentudo"),
    ("csoda", "MELYIK ÉR TÖBBET?", "Melyik ér többet?", "melyik"),
    ("csoda", "A SÓ", "A só", "so"),
    ("grimm", "A hét holló", "A hét holló", "het_hollo"),
    ("grimm", "A madarak királya", "A madarak királya", "madarak"),
    ("grimm", "A molnárinas és a macska", "A molnárinas és a macska", "molnarinas"),
    ("csoda", "HAMMAS JUTKA", "Hammas Jutka", "hammas_jutka"),
    ("grimm", "Az aranyfonál", "Az aranyfonál", "aranyfonal"),
    ("grimm", "A muzsikusok", "A muzsikusok", "muzsikusok"),
    ("csoda", "A KIRÁLY NYULAI", "A király nyulai", "kiraly_nyulai"),
    ("csoda", "AZ ACÉLGYŰRŰ", "Az acélgyűrű", "acelgyuru"),
    ("grimm", "A halász és a felesége", "A halász és a felesége", "halasz"),
    ("grimm", "A szerencsés János", "A szerencsés János", "szerencses_janos"),
]
MAXLEN = 88


def book_tales(fn):
    raw = open(os.path.join(SRC, fn), "rb").read().decode("latin-1")
    t = rtf_to_text(raw, encoding="cp1250", errors="replace").replace("*", "")
    lines = [l.strip() for l in t.split("\n")]
    i = lines.index("TARTALOM")
    titles = []
    for l in lines[i + 1:]:
        if not l:
            if titles: break
            continue
        titles.append(l)
    stop = next((k for k, l in enumerate(lines) if l.startswith("SZÓMAGYARÁZ") and k > i + len(titles) + 5), len(lines))
    pos, k = [], i + 1 + len(titles)
    for ti in titles:
        kk = k
        while kk < stop and lines[kk] != ti: kk += 1
        if kk < stop: pos.append((ti, kk)); k = kk + 1
    out = {}
    for n, (ti, p) in enumerate(pos):
        end = pos[n + 1][1] if n + 1 < len(pos) else stop
        out[ti.rstrip(".")] = [l for l in lines[p + 1:end] if l]
    return out


def typeable(s):
    s = s.replace("­", "").replace(" ", " ").replace(" ", " ")
    for a, b in [("„", '"'), ("”", '"'), ("“", '"'), ("»", '"'), ("«", '"'), ("’", "'"), ("‘", "'"), ("–", "-"), ("—", "-"),
                 ("…", "..."), ("õ", "ő"), ("û", "ű"), ("Õ", "Ő"), ("Û", "Ű")]:
        s = s.replace(a, b)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"-&-$", "", s).strip()
    return s


def split_long(s):
    """a sentence longer than the bubble is cut at the punctuation nearest the middle"""
    if len(s) <= MAXLEN: return [s]
    cuts = [m.end() for m in re.finditer(r"[,;:] | - ", s)]
    if not cuts: return [s]
    mid = len(s) / 2
    c = min(cuts, key=lambda x: abs(x - mid))
    a, b = s[:c].strip(), s[c:].strip()
    if len(a) < 12 or len(b) < 12: return [s]
    return split_long(a) + split_long(b)


def sentences(par):
    parts = re.split(r'(?<=[.!?])\s+(?=[-"A-ZÁÉÍÓÖŐÚÜŰ])', par)
    out = []
    for p in parts:
        out += split_long(p)
    return [o for o in out if o]


def main():
    books = {k: book_tales(fn) for k, (fn, _) in BOOKS.items()}
    tales = []
    for book, src_title, title, tid in PICK:
        pars = books[book][src_title]
        lines = []
        for par in pars:
            lines += sentences(typeable(par))
        # the closing formulas ("Itt a vége...") stay: they belong to the tale
        tales.append({"id": tid, "title": title, "src": BOOKS[book][1], "lines": lines})
        print("%-28s %3d lines %5d chars, longest %d" % (title, len(lines), sum(map(len, lines)), max(map(len, lines))))
    chars = sorted(set("".join(l for t in tales for l in t["lines"])))
    print("characters:", "".join(chars))
    with open(os.path.join(ROOT, "data", "tales_hu.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by tools/build_tales.py from Benedek Elek's texts (public domain). Do not edit by hand.\n")
        f.write("window.BK_TALES_HU = " + json.dumps(tales, ensure_ascii=False, indent=0) + ";\n")


if __name__ == "__main__":
    main()
