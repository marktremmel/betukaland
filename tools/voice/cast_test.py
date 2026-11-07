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


def raw_piper(voice, text, speed, wav):
    from piper import PiperVoice, SynthesisConfig
    if voice not in _piper: _piper[voice] = PiperVoice.load(os.path.join(MODELS, "piper", "hu_HU-%s-medium.onnx" % voice))
    v = _piper[voice]
    with wave.open(wav, "wb") as wf:
        v.synthesize_wav(text, wf, syn_config=SynthesisConfig(length_scale=1.0 / speed))
    return v.config.sample_rate


def raw_kokoro(voice, text, speed, wav):
    import soundfile as sf, numpy as np
    from kokoro import KPipeline
    lc = voice[0]
    if lc not in _kokoro: _kokoro[lc] = KPipeline(lang_code=lc, repo_id="hexgrad/Kokoro-82M")
    sf.write(wav, np.concatenate([a for _, _, a in _kokoro[lc](text, voice=voice, speed=speed)]), 24000)
    return 24000


def render(spec, text, mp3):
    eng, voice = spec["voice"].split("-", 1)
    fd, wav = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    sr = (raw_piper if eng == "piper" else raw_kokoro)(voice, text, spec.get("speed", 1.0), wav)
    f = 2 ** (spec.get("pitch", 0) / 12.0)
    chain = ["asetrate=%d" % round(sr * f), "aresample=%d" % sr, "atempo=%.4f" % (1 / f)] if f != 1 else []
    if spec.get("fx"): chain.append(spec["fx"])
    chain += ["apad=pad_dur=0.15", "loudnorm=I=-18:TP=-2:LRA=11"]
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
                    h = hashlib.md5((json.dumps(spec, sort_keys=True) + text).encode()).hexdigest()[:10]
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
