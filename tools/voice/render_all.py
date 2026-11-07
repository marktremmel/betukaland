"""
Renders the game's voice lines with the final cast (variant "A" of every character in
tools/voice/cast.json) into voice/out/<lang>/<file>.mp3, plus voice/out/<lang>/index.json
(line id -> file, seconds) and voice/out/review.html to listen through everything and flag
bad ones.
    python3 tools/voice/render_all.py hu [groups...]     groups: nemoke halloween stories sentences words tales
    (default: everything except tales)
Unchanged lines are skipped (a hash of text + settings), so a fixed typo re-renders one line.
Hungarian (Piper) runs anywhere; English (Kokoro) needs voice/env/kokoro-arm64 on the Mac.
"""
import json, os, re, sys, hashlib, subprocess, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from normalize import normalize
import cast_test
OUTR = os.path.join(ROOT, "voice", "out")
LINES = json.load(open(os.path.join(ROOT, "voice", "lines.json"), encoding="utf-8"))
CAST = json.load(open(os.path.join(HERE, "cast.json"), encoding="utf-8"))


def fname(i):
    a = unicodedata.normalize("NFD", i).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z0-9.]+", "_", a)[:60] + "_" + hashlib.md5(i.encode()).hexdigest()[:5] + ".mp3"


def dur(f):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True)
    try: return round(float(r.stdout.strip()), 2)
    except ValueError: return 0


def main(lang, groups):
    out = os.path.join(OUTR, lang); os.makedirs(out, exist_ok=True)
    ip = os.path.join(out, "index.json")
    idx = json.load(open(ip, encoding="utf-8")) if os.path.exists(ip) else {}
    todo = [l for l in LINES if l["lang"] == lang and l["group"] in groups]
    n = 0
    for k, l in enumerate(todo):
        ch = CAST[lang].get(l["char"]) or CAST[lang]["narrator" if "narrator" in CAST[lang] else "karou"]
        spec = dict(cast_test.DEFAULTS, **ch["variants"]["A"])
        text = normalize(l["text"], lang)
        h = hashlib.md5((json.dumps(spec, sort_keys=True) + text + "v4").encode()).hexdigest()[:10]
        f = fname(l["id"]); fp = os.path.join(out, f)
        if idx.get(l["id"], {}).get("h") == h and os.path.exists(fp): continue
        if idx.get(l["id"], {}).get("e") == "azure" and os.path.exists(fp) and "--piper" not in sys.argv: continue   # made by azure_tts.py
        try:
            # the tales are long (two hours a language): a lower bitrate keeps the game small
            cast_test.render(ch["variants"]["A"], text, fp, 32 if l["group"] == "tales" else 64)
            idx[l["id"]] = {"f": f, "h": h, "s": dur(fp), "g": l["group"], "c": l["char"]}
            n += 1
            if n % 25 == 0:
                print("%d / %d" % (k + 1, len(todo)), flush=True)
                json.dump(idx, open(ip, "w", encoding="utf-8"), ensure_ascii=False)
        except Exception as e:
            print("FAILED", l["id"], repr(e)[:200], flush=True)
    json.dump(idx, open(ip, "w", encoding="utf-8"), ensure_ascii=False)
    print(lang, ":", n, "rendered,", len(idx), "in index,", round(sum(v["s"] for v in idx.values()) / 60, 1), "minutes")
    review()


def review():
    data = {}
    texts = {l["id"]: l["text"] for l in LINES}
    for lang in ("hu", "en"):
        ip = os.path.join(OUTR, lang, "index.json")
        if os.path.exists(ip):
            idx = json.load(open(ip, encoding="utf-8"))
            data[lang] = [[i, v["f"], v["g"], v["c"], texts.get(i, ""), v["s"]] for i, v in idx.items()]
    html = open(os.path.join(HERE, "review_page.html"), encoding="utf-8").read().replace("__DATA__", json.dumps(data, ensure_ascii=False))
    open(os.path.join(OUTR, "review.html"), "w", encoding="utf-8").write(html)
    print("voice/out/review.html")


if __name__ == "__main__":
    lang = sys.argv[1] if len(sys.argv) > 1 else "hu"
    groups = [g for g in sys.argv[2:] if not g.startswith("--")] or ["nemoke", "halloween", "stories", "sentences", "words"]
    main(lang, groups)
