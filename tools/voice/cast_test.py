"""
Casting test: every character's variants (voice + pitch + speed + effect, from tools/voice/cast.json)
read a few of that character's real lines into voice/cast/<lang>-<char>-<variant>/<line>.mp3,
then voice/cast/index.html lets you listen and pick one variant per character.
    python3 tools/voice/cast_test.py [hu|en]
Piper voices need piper-tts (pip); Kokoro voices need the kokoro setup from test_voices.sh.
Rendered files are kept and only re-rendered when the text or the settings change.
"""
import json, os, sys, subprocess, wave, hashlib, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from normalize import normalize
OUT = os.path.join(ROOT, "voice", "cast"); MODELS = os.path.join(ROOT, "voice", "models")
CAST = json.load(open(os.path.join(HERE, "cast.json"), encoding="utf-8"))
LINES = {l["id"]: l for l in json.load(open(os.path.join(ROOT, "voice", "lines.json"), encoding="utf-8"))}
os.makedirs(OUT, exist_ok=True)
_piper, _kokoro = {}, {}


# How a line is "acted": it is spoken sentence by sentence, every sentence brought to the same
# loudness (so the end of a line does not fade), with a real pause between sentences ("gap", s),
# then pitch and effects go over the whole line. Piper's noise settings: lower = steadier, clearer
# voice (less "döcögés"); the defaults of Piper are 0.667 / 0.8.
DEFAULTS = {"speed": 1.0, "pitch": 0, "gap": 0.4, "noise": 0.5, "noise_w": 0.6}
TARGET_RMS = 0.08            # every sentence gets this loudness before the line is put together


def sentences(text):
    import re
    parts = re.split(r"(?<=[.!?])\s+(?=\S)", text.strip())
    return [p for p in parts if p.strip()]


def raw_piper(voice, text, spec):
    import numpy as np
    from piper import PiperVoice, SynthesisConfig
    if voice not in _piper: _piper[voice] = PiperVoice.load(os.path.join(MODELS, "piper", "hu_HU-%s-medium.onnx" % voice))
    v = _piper[voice]
    cfg = SynthesisConfig(length_scale=1.0 / spec["speed"], noise_scale=spec["noise"], noise_w_scale=spec["noise_w"])
    a = np.concatenate([c.audio_float_array for c in v.synthesize(text, syn_config=cfg)])
    return a, v.config.sample_rate


def raw_kokoro(voice, text, spec):
    import numpy as np
    from kokoro import KPipeline
    lc = voice[0]
    if lc not in _kokoro: _kokoro[lc] = KPipeline(lang_code=lc, repo_id="hexgrad/Kokoro-82M")
    return np.concatenate([a for _, _, a in _kokoro[lc](text, voice=voice, speed=spec["speed"])]), 24000


def trim(a, sr):
    """cut the model's silence, but keep soft sounds at the edges (an "sz" at the start, an "s" at the end)"""
    import numpy as np
    peak = float(np.max(np.abs(a))) if len(a) else 0
    idx = np.where(np.abs(a) > max(0.002, 0.02 * peak))[0]
    return a[max(0, idx[0] - int(sr * 0.03)): idx[-1] + int(sr * 0.15)] if len(idx) else a


def render(spec0, text, mp3):
    import numpy as np
    spec = dict(DEFAULTS, **spec0)
    eng, voice = spec["voice"].split("-", 1)
    raw = raw_piper if eng == "piper" else raw_kokoro
    parts, sr = [], 24000
    ss = sentences(text)
    # a bare word or two (what the child types): "word" mode decides how it is said
    if spec.get("word") and len(ss) == 1 and not ss[0].rstrip()[-1:] in ".!?":
        if spec["word"] in ("period", "slow"): ss = [ss[0][0].upper() + ss[0][1:] + "."]
    for s in ss:
        sp = spec
        # a very short sentence inside a longer line ("Elhallgatott.") is said more slowly
        if len(ss) > 1 and len(s.split()) <= 2: sp = dict(spec, speed=spec["speed"] * 0.85)
        if spec.get("word") == "slow" and len(ss) == 1 and len(s.split()) <= 2:
            # the shorter the word, the more it is drawn out ("ujj", "szia" were too quick)
            n = len(s.strip(".!? "))
            sp = dict(spec, speed=spec["speed"] * (0.6 if n <= 2 else 0.65 if n <= 4 else 0.72 if n <= 6 else 0.8))
        a, sr = raw(voice, s, sp)
        a = trim(np.asarray(a, dtype=np.float32), sr)
        rms = float(np.sqrt(np.mean(a ** 2))) or 1.0
        parts.append(a * (TARGET_RMS / rms))
        parts.append(np.zeros(int(sr * spec["gap"]), dtype=np.float32))
    a = np.concatenate([np.zeros(int(sr * 0.05), dtype=np.float32)] + parts[:-1] + [np.zeros(int(sr * 0.15), dtype=np.float32)])
    a = np.clip(a / max(1.0, float(np.max(np.abs(a))) / 0.95), -1, 1)
    fd, wav = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    with wave.open(wav, "wb") as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr); wf.writeframes((a * 32767).astype("<i2").tobytes())
    f = 2 ** (spec["pitch"] / 12.0)
    chain = ["asetrate=%d" % round(sr * f), "aresample=%d" % sr, "atempo=%.4f" % (1 / f)] if f != 1 else []
    if spec.get("fx"): chain.append(spec["fx"])
    if spec.get("gain"): chain.append("volume=%sdB" % spec["gain"])
    chain.append("alimiter=limit=0.95")          # a fixed gain, no loudnorm "riding" the volume
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-af", ",".join(chain), "-ar", "24000", "-ac", "1", "-b:a", "64k", mp3], check=True)
    os.remove(wav)


def main(langs):
    done = {}
    for lang in langs:
        for ch, c in CAST[lang].items():
            for vk, spec in c["variants"].items():
                d = os.path.join(OUT, "%s-%s-%s" % (lang, ch, vk)); os.makedirs(d, exist_ok=True)
                for lid in c["lines"]:
                    text = normalize(LINES[lid]["text"], lang)
                    h = hashlib.md5((json.dumps(dict(DEFAULTS, **spec), sort_keys=True) + text + "v4").encode()).hexdigest()[:10]
                    mp3 = os.path.join(d, lid + ".mp3"); side = mp3 + ".hash"
                    if os.path.exists(mp3) and os.path.exists(side) and open(side).read() == h: continue
                    try:
                        render(spec, text, mp3); open(side, "w").write(h); print("ok ", lang, ch, vk, lid, flush=True)
                    except Exception as e:
                        print("FAILED", lang, ch, vk, lid, repr(e)[:200], flush=True)
    page()


def page():
    data = {"cast": CAST, "lines": {}, "have": {}}
    for lang in ("hu", "en"):
        for ch, c in CAST[lang].items():
            for lid in c["lines"]: data["lines"][lid] = LINES[lid]["text"]
            for vk in c["variants"]:
                d = os.path.join(OUT, "%s-%s-%s" % (lang, ch, vk))
                data["have"]["%s-%s-%s" % (lang, ch, vk)] = [l for l in c["lines"] if os.path.exists(os.path.join(d, l + ".mp3"))]
    html = open(os.path.join(HERE, "cast_page.html"), encoding="utf-8").read().replace("__DATA__", json.dumps(data, ensure_ascii=False))
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(html)
    print("voice/cast/index.html")


if __name__ == "__main__":
    main(sys.argv[1:] or ["hu", "en"])
