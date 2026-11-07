"""
Voice test: every candidate voice reads tools/voice/test_lines.json into voice/test/<voice>/<id>.wav.
Run by tools/voice/test_voices.sh, one engine at a time, each in its own virtualenv:
    python render_test.py <engine>        engine: apple | piper | f5 | xtts | kokoro
Already rendered files are skipped, so it can be stopped and started again.
"""
import json, os, sys, subprocess, shutil, time, wave, urllib.request, random

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(ROOT, "voice", "test")
MODELS = os.path.join(ROOT, "voice", "models")
LINES = json.load(open(os.path.join(HERE, "test_lines.json"), encoding="utf-8"))
os.makedirs(OUT, exist_ok=True); os.makedirs(MODELS, exist_ok=True)

# F5 / XTTS clone these reference speakers from the Hungarian F5 repo's samples (Common Voice /
# CSS10 / YodaLingua speakers); the test page lists all 20 so other ones can be chosen later
REFS = os.environ.get("BK_REFS", "01,04,07,10,13,16,19").split(",")
XTTS_REFS = os.environ.get("BK_XTTS_REFS", "01,07,13").split(",")


def log(*a):
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def register(name, engine, langs, note):
    p = os.path.join(OUT, "voices.json")
    v = json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}
    v[name] = {"engine": engine, "langs": langs, "note": note}
    json.dump(v, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def todo(name, langs):
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True)
    for l in LINES:
        if l["lang"] in langs:
            f = os.path.join(d, l["id"] + ".wav")
            if not os.path.exists(f):
                yield l, f


def to_wav(src, dst):
    # macOS afconvert is always there; 16-bit wav plays in every browser
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", src, dst], check=True)


def timed(name, fn, l, f):
    t = time.time()
    try:
        fn(l, f)
        log(name, l["id"], "%.1fs" % (time.time() - t))
    except Exception as e:
        log(name, l["id"], "FAILED", repr(e)[:300])


# ------------------------------------------------------------------ Apple (say)
def apple():
    out = subprocess.run(["say", "-v", "?"], capture_output=True, text=True).stdout.splitlines()
    voices = []
    for line in out:
        parts = line.split("#")[0].split()
        loc = [p for p in parts if "_" in p and len(p) == 5]
        if not loc: continue
        name = line[:line.index(loc[0])].strip()
        if loc[0] == "hu_HU": voices.append((name, "hu"))
        elif name.split(" (")[0] in ("Daniel", "Samantha", "Karen", "Moira") and loc[0].startswith("en_"): voices.append((name, "en"))
    if not any(l == "hu" for _, l in voices):
        log("apple: no Hungarian voice installed. System Settings > Accessibility > Spoken Content > System voice > Manage Voices > Hungarian (Tünde), then run again")
    for name, lang in voices:
        key = "apple-" + name.replace(" ", "").replace("(", "-").replace(")", "")
        register(key, "Apple say", [lang], "macOS built-in voice. Licence for publishing recordings must be checked (Apple's licence covers personal use).")
        for l, f in todo(key, [lang]):
            def run(l, f, name=name):
                tmp = f[:-4] + ".aiff"
                subprocess.run(["say", "-v", name, "-o", tmp, l["text"]], check=True)
                to_wav(tmp, f); os.remove(tmp)
            timed(key, run, l, f)


# ------------------------------------------------------------------ Piper
PIPER = {"anna": "medium", "berta": "medium", "imre": "medium"}
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/hu/hu_HU/%s/%s/%s"


def piper():
    from piper import PiperVoice
    for v, q in PIPER.items():
        base = "hu_HU-%s-%s" % (v, q)
        mp = os.path.join(MODELS, "piper", base + ".onnx"); os.makedirs(os.path.dirname(mp), exist_ok=True)
        for fn in (base + ".onnx", base + ".onnx.json", "MODEL_CARD"):
            dst = os.path.join(MODELS, "piper", fn if fn != "MODEL_CARD" else base + ".MODEL_CARD.txt")
            if not os.path.exists(dst):
                log("download", fn); urllib.request.urlretrieve(HF % (v, q, fn), dst)
        card = open(os.path.join(MODELS, "piper", base + ".MODEL_CARD.txt"), encoding="utf-8", errors="replace").read()
        key = "piper-" + v
        register(key, "Piper", ["hu"], "Piper voice. Model card: " + " ".join(card.split())[:400])
        voice = PiperVoice.load(mp)
        for l, f in todo(key, ["hu"]):
            def run(l, f):
                with wave.open(f, "wb") as wf:
                    if hasattr(voice, "synthesize_wav"): voice.synthesize_wav(l["text"], wf)   # piper-tts 1.3+
                    else: voice.synthesize(l["text"], wf)                                      # older piper-tts
            timed(key, run, l, f)


# ------------------------------------------------------------------ F5-TTS Hungarian
def f5_files():
    from huggingface_hub import snapshot_download
    return snapshot_download("Maxdorger29/f5-tts-hungarian", local_dir=os.path.join(MODELS, "f5-hu"))


def f5():
    import torch
    from f5_tts.api import F5TTS
    d = f5_files()
    # every reference speaker goes on the test page, so others can be picked later
    gal = os.path.join(OUT, "_refs"); os.makedirs(gal, exist_ok=True)
    for fn in sorted(os.listdir(os.path.join(d, "samples"))):
        if fn.startswith("ref_") and not os.path.exists(os.path.join(gal, fn)):
            shutil.copy(os.path.join(d, "samples", fn), os.path.join(gal, fn))
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    log("f5 on", dev)
    try:
        tts = F5TTS(model="F5TTS_v1_Base", ckpt_file=os.path.join(d, "model_last_final.safetensors"), vocab_file=os.path.join(d, "vocab.txt"), device=dev)
    except Exception as e:
        log("f5 on", dev, "failed (", repr(e)[:200], "), trying cpu"); dev = "cpu"
        tts = F5TTS(model="F5TTS_v1_Base", ckpt_file=os.path.join(d, "model_last_final.safetensors"), vocab_file=os.path.join(d, "vocab.txt"), device=dev)
    texts = {}
    tp = os.path.join(MODELS, "f5-hu", "ref_texts.json")
    if os.path.exists(tp): texts = json.load(open(tp, encoding="utf-8"))
    for r in REFS:
        ref = os.path.join(d, "samples", "ref_%s.wav" % r)
        key = "f5-ref" + r
        register(key, "F5-TTS Hungarian (Maxdorger29)", ["hu"], "Clones reference speaker ref_%s. CC BY-NC 4.0: fine for a free school game, with credit; not for selling." % r)
        for l, f in todo(key, ["hu"]):
            def run(l, f, ref=ref, r=r):
                from f5_tts.infer.utils_infer import preprocess_ref_audio_text, transcribe
                # F5 cuts a long reference to about 12 s; the text must match exactly that clip,
                # so the clip itself is transcribed (in Hungarian) once and kept
                clip, _ = preprocess_ref_audio_text(ref, "-", show_info=lambda *a: None)
                if r not in texts:
                    texts[r] = transcribe(clip, language="hu").strip()
                    json.dump(texts, open(tp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
                    log("ref", r, "=", texts[r])
                tts.infer(ref_file=clip, ref_text=texts[r], gen_text=l["text"], file_wave=f, remove_silence=True, seed=7)
            timed(key, run, l, f)


# ------------------------------------------------------------------ XTTS-v2
def xtts():
    os.environ["COQUI_TOS_AGREED"] = "1"
    import torch
    from TTS.api import TTS
    d = f5_files()           # the same reference speakers
    tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
    for r in XTTS_REFS:
        ref = os.path.join(d, "samples", "ref_%s.wav" % r)
        key = "xtts-ref" + r
        register(key, "XTTS-v2 (Coqui)", ["hu", "en"], "Clones reference speaker ref_%s. Coqui Public Model Licence: non-commercial only." % r)
        for l, f in todo(key, ["hu", "en"]):
            timed(key, lambda l, f: tts.tts_to_file(text=l["text"], speaker_wav=ref, language=l["lang"], file_path=f), l, f)


# ------------------------------------------------------------------ Kokoro (English only)
def kokoro():
    import soundfile as sf, numpy as np
    from kokoro import KPipeline
    pipes = {"a": KPipeline(lang_code="a"), "b": KPipeline(lang_code="b")}
    for v in ("af_heart", "af_bella", "bf_emma", "bm_george", "am_michael"):
        key = "kokoro-" + v
        register(key, "Kokoro-82M", ["en"], "Apache-2.0. English only.")
        for l, f in todo(key, ["en"]):
            def run(l, f, v=v):
                audio = [a for _, _, a in pipes[v[0]](l["text"], voice=v)]
                sf.write(f, np.concatenate(audio), 24000)
            timed(key, run, l, f)


if __name__ == "__main__":
    {"apple": apple, "piper": piper, "f5": f5, "xtts": xtts, "kokoro": kokoro}[sys.argv[1]]()
