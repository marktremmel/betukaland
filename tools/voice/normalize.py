"""Text clean-up before a line is spoken (all engines, both languages).
- "..." / "…" is a pause, not "pont pont pont": a comma inside a line, a full stop at the end
- numbers in groups ("116 111", a phone number) are read group by group, with a pause between
- a dialogue dash at the start of a line ("- Te jó kis lány") is not read; " - " inside is a pause
- quotation marks are not read
"""
import re


# words the voice says wrong, spelled the way they should sound (only for the voice, never shown);
# whole words, any case. Add to this list when the review page flags a word.
RESPELL = {
    "hu": {"szia": "szija", "sziasztok": "szijasztok"},
    "en": {},
}


def respell(t, lang):
    for w, say in RESPELL.get(lang, {}).items():
        t = re.sub(r"(?<![\wáéíóöőúüű])" + w + r"(?![\wáéíóöőúüű])", lambda m: say if m.group(0).islower() else say.capitalize(), t, flags=re.I)
    return t


def normalize(text, lang="hu"):
    t = respell(text.strip(), lang)
    t = re.sub(r"^[-–—]\s+", "", t)                         # dialogue dash at the start
    t = re.sub(r"\s[-–—]\s", ", ", t)                         # a dash between words: a pause
    t = re.sub(r"”\s+(?=\w)", ", ", t)                      # „...” írtad: a pause after the quote
    t = re.sub(r"[\"„”“«»]", "", t)                          # quotation marks
    t = t.replace("(", "").replace(")", "")                 # (Többet is választhatsz.) is read as a sentence
    t = re.sub(r"(\.\.\.|…)+\s*$", ".", t)                    # trailing ellipsis: end of sentence
    t = re.sub(r"(\.\.\.|…)+\s*", ", ", t)                    # ellipsis inside: a pause
    # digit groups separated by spaces (phone numbers): say each group, pause between
    t = re.sub(r"(\d+)(?: (?=\d))", r"\1, ", t)
    t = re.sub(r",\s*([.!?])", r"\1", t)                      # no comma right before . ! ?
    t = re.sub(r"\s{2,}", " ", t).strip()
    return t


if __name__ == "__main__":
    for s in ["Senki sem akar mellém ülni...", "Pedig nem is én voltam... de mindegy.", "Ingyen, éjjel-nappal hívhatod a Kék Vonalat is: 116 111.",
              "- Te jó kis lány, adj ennem - kérte.", '"Tüskés, ide ne ülj!"', "„Szerintem nagyon szuper a rajzod” írtad."]:
        print(normalize(s))
