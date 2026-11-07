"""
Azure neural voices (hu-HU Noémi and Tamás) for the words the child types, where the Piper voices
struggle with gy, ty, ny. Runs on the Mac, with the voice setup's Python (it has truststore, which
uses the Mac's own certificate trust):
    voice/env/piper-arm64/bin/python tools/voice/azure_tts.py lab      the hard words, Azure next to the best Piper take
                                              -> voice/wordlab3/index.html
    python3 tools/voice/azure_tts.py words    every word and typing sentence with the chosen
                                              Azure voice -> voice/out/hu (the review page)
The key stays on your Mac: put it in voice/azure.env (not in git):
    AZURE_SPEECH_KEY=...
    AZURE_SPEECH_REGION=westeurope
The free tier (F0) covers 0.5 million characters a month; all the words are about 4,000.
"""
import json, os, sys, shutil, time, hashlib, urllib.request, urllib.error, subprocess, ssl
from xml.sax.saxutils import escape
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ENV = os.path.join(ROOT, "voice", "azure.env")
LINES = json.load(open(os.path.join(ROOT, "voice", "lines.json"), encoding="utf-8"))


def creds():
    if not os.path.exists(ENV):
        open(ENV, "w").write("AZURE_SPEECH_KEY=\nAZURE_SPEECH_REGION=westeurope\n")
        sys.exit("Fill in voice/azure.env (key and region from the Azure portal: your Speech resource > Keys and Endpoint), then run again.")
    kv = dict(l.strip().split("=", 1) for l in open(ENV) if "=" in l)
    if not kv.get("AZURE_SPEECH_KEY"): sys.exit("voice/azure.env: AZURE_SPEECH_KEY is empty")
    return kv["AZURE_SPEECH_KEY"].strip(), kv.get("AZURE_SPEECH_REGION", "westeurope").strip()


def tls():
    """trust what the Mac trusts (the Keychain), so a network or security tool that inspects
    HTTPS with its own certificate still works; then certifi; then Python's own list"""
    try:
        import truststore
        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except ImportError:
        pass
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


CTX = tls()


def speak(text, voice, rate, mp3, key, region):
    # a short silence first: without it Noémi sometimes clips the first sound (the k of "kék")
    ssml = ("<speak version='1.0' xml:lang='hu-HU'><voice name='%s'><break time='150ms'/><prosody rate='%s'>%s</prosody></voice></speak>"
            % (voice, rate, escape(text)))
    req = urllib.request.Request("https://%s.tts.speech.microsoft.com/cognitiveservices/v1" % region, data=ssml.encode("utf-8"), headers={
        "Ocp-Apim-Subscription-Key": key, "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "betukaland-voice"})
    for attempt in range(5):
        try:
            data = urllib.request.urlopen(req, timeout=30, context=CTX).read(); break
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(2 + attempt * 2); continue      # free tier: a few requests a second
            raise SystemExit("Azure said %s: %s (check the key and the region in voice/azure.env)" % (e.code, e.read()[:200]))
    open(mp3, "wb").write(data)


VOICES = {"N": "hu-HU-NoemiNeural", "T": "hu-HU-TamasNeural"}
# words where Tamás was clearly better than Noémi in the word lab (gy, ly, the k at the start)
TAMAS_WORDS = {"kék", "hely", "jegy", "adj", "ujj", "cukor"}

# the best Piper take of each hard word so far (word labs 1 and 2), to compare with
PIPER_BEST = {"fék": "wordlab/D", "kék": "wordlab/D", "séf": "wordlab/E", "laska": "wordlab/E", "adj": "wordlab2/E",
              "add": "wordlab2/G", "lakj": "wordlab2/H", "kaja": "wordlab/D", "sakkal": "wordlab2/E", "pipa": "wordlab2/E",
              "hegyi": "wordlab2/E", "tart": "wordlab2/H", "jegy": "wordlab2/G", "hely": "wordlab2/E", "író": "wordlab/D",
              "öröm": "wordlab/A", "vár": "wordlab/E", "rizs": "wordlab2/D", "öcs": "wordlab2/H", "báty": "wordlab2/G",
              "anya": "wordlab2/G", "tej": "wordlab2/G", "ló": "wordlab2/G", "kés": "wordlab2/D", "cukor": "wordlab2/D",
              "szia": "wordlab/A", "ujj": "wordlab/D", "szőnyeg": "wordlab/D"}


def lab():
    key, region = creds()
    out = os.path.join(ROOT, "voice", "wordlab3")
    V = {"P": {"voice": "Piper (eddigi legjobb)"},
         "N1": {"voice": "azure-Noémi", "rate": "-10%"}, "N2": {"voice": "azure-Noémi", "rate": "-25%"},
         "T1": {"voice": "azure-Tamás", "rate": "-10%"}, "T2": {"voice": "azure-Tamás", "rate": "-25%"}}
    cfg = {"hu": {}, "en": {}}
    for w, src in PIPER_BEST.items():
        lid = "w.hu." + w
        cfg["hu"][w] = {"name": w, "lines": [lid], "variants": V}
        for vk, sp in V.items():
            d = os.path.join(out, "hu-%s-%s" % (w, vk)); os.makedirs(d, exist_ok=True)
            f = os.path.join(d, lid + ".mp3")
            if os.path.exists(f): continue
            if vk == "P":
                lab_, v = src.split("/")
                s = os.path.join(ROOT, "voice", lab_, "hu-%s-%s" % (w, v), lid + ".mp3")
                if os.path.exists(s): shutil.copy(s, f)
            else:
                speak(w, VOICES[vk[0]], sp["rate"], f, key, region); print("ok", w, vk, flush=True)
    json.dump(cfg, open(os.path.join(out, "lab.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # the same listening page as the casting
    os.environ["BK_CAST"] = os.path.join(out, "lab.json"); os.environ["BK_CAST_OUT"] = "wordlab3"
    sys.path.insert(0, HERE)
    import cast_test
    cast_test.page()
    print("voice/wordlab3/index.html")


def trim(mp3):
    """Azure leaves about half a second of silence at the end: cut it (keeps 60/120 ms)"""
    tmp = mp3 + ".tmp.mp3"
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse")
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-af", af, "-ar", "24000", "-ac", "1", "-b:a", "48k", tmp])
    if r.returncode == 0 and os.path.getsize(tmp) > 500: os.replace(tmp, mp3)


def words(voice="N", rate="-10%"):
    """every word and typing sentence with one Azure voice, into the same place as render_all.py"""
    key, region = creds()
    sys.path.insert(0, HERE)
    import render_all
    out = os.path.join(ROOT, "voice", "out", "hu"); os.makedirs(out, exist_ok=True)
    ip = os.path.join(out, "index.json")
    idx = json.load(open(ip, encoding="utf-8")) if os.path.exists(ip) else {}
    todo = [l for l in LINES if l["lang"] == "hu" and l["group"] in ("words", "sentences")]
    for k, l in enumerate(todo):
        v = "T" if l["group"] == "words" and l["text"] in TAMAS_WORDS else voice
        h = hashlib.md5(("azure2" + VOICES[v] + rate + l["text"]).encode()).hexdigest()[:10]
        f = render_all.fname(l["id"]); fp = os.path.join(out, f)
        if idx.get(l["id"], {}).get("h") == h and os.path.exists(fp): continue
        speak(l["text"], VOICES[v], rate if l["group"] == "words" else "0%", fp, key, region)
        trim(fp)
        idx[l["id"]] = {"f": f, "h": h, "s": render_all.dur(fp), "g": l["group"], "c": "reader", "e": "azure", "trim": 1}
        if k % 25 == 0:
            print("%d / %d" % (k + 1, len(todo)), flush=True)
            json.dump(idx, open(ip, "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(idx, open(ip, "w", encoding="utf-8"), ensure_ascii=False)
    render_all.review()


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "lab"
    if mode == "lab": lab()
    else: words(*(sys.argv[2:4] or ["N", "-10%"]))
