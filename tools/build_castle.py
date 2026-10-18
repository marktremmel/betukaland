#!/usr/bin/env python3
"""
Cuts the castle room props out of the GandalfHardcore FREE Platformer Assets sheets
(copied to art/castle/ from the Game Assets library; licence: use in games, no
redistributing the assets on their own) and adds them to assets/manifest.js:
images castle_<id>, the animated cooking area and the wall torch as sprites.
Each box is a rough area; the prop is cut tight to its pixels inside it.
Run after changing art/castle/:  python3 tools/build_castle.py  then tools/build_pack.py
"""
import json, os, re
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.path.join(ROOT, "art", "castle")
OUT = os.path.join(ROOT, "assets")
# id: (sheet, (x0, y0, x1, y1))
PROPS = {
    "crate": ("Decor.png", (0, 13, 32, 35)), "crates": ("Decor.png", (32, 0, 64, 35)),
    "barrel": ("Decor.png", (70, 11, 90, 35)), "barrels": ("Decor.png", (95, 11, 130, 35)),
    "stool": ("Decor.png", (134, 16, 154, 35)), "pot": ("Decor.png", (165, 13, 189, 35)),
    "table": ("Decor.png", (260, 19, 281, 35)), "chair": ("Decor.png", (293, 4, 314, 35)),
    "feast": ("Decor.png", (266, 35, 308, 66)), "apples": ("Decor.png", (351, 11, 385, 35)),
    "bottles": ("Decor.png", (384, 18, 415, 35)), "basket": ("Decor.png", (357, 46, 381, 66)),
    "longtable": ("Decor.png", (264, 74, 309, 99)), "logs": ("Decor.png", (198, 72, 251, 99)),
    "tub": ("Decor.png", (66, 106, 95, 130)), "pumpkin": ("Decor.png", (387, 110, 413, 130)),
    "lantern": ("Decor.png", (387, 206, 413, 227)), "scarecrow": ("Decor.png", (297, 194, 343, 259)),
    "statue": ("Decor.png", (384, 262, 416, 323)),
    "flowers": ("Garden Decorations.png", (0, 4, 33, 33)), "plant": ("Garden Decorations.png", (34, 4, 62, 33)),
    "fern": ("Garden Decorations.png", (0, 31, 33, 67)), "bushpot": ("Garden Decorations.png", (34, 31, 62, 67)),
    "vase": ("Garden Decorations.png", (68, 45, 92, 67)), "cypress": ("Garden Decorations.png", (127, 23, 161, 129)),
    "tree": ("Garden Decorations.png", (160, 35, 224, 129)), "bust": ("Garden Decorations.png", (2, 80, 29, 129)),
    "urn": ("Garden Decorations.png", (32, 83, 64, 129)), "urnrose": ("Garden Decorations.png", (63, 72, 97, 129)),
    "garland": ("Alchemy Decor.png", (0, 0, 65, 29)), "potion": ("Alchemy Decor.png", (32, 39, 65, 65)),
    "alchemy": ("Alchemy Decor.png", (76, 23, 119, 65)), "sunflowers": ("Alchemy Decor.png", (160, 19, 192, 65)),
}
WALL = ("Decor.png", (362, 150, 394, 182))           # red brick, 32 x 32, tiles
WINDOW = ("House Tiles.png", (66, 131, 94, 158))
DOOR = ("House Tiles.png", (43, 145, 63, 193))
SPRITES = {"castle_cook": ("Cooking area.png", 64, 64, 12, 8), "castle_torch": ("Torch.png", 32, 32, 6, 10)}


def tight(im):
    a = np.asarray(im)[..., 3] > 0
    ys, xs = np.where(a)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def main():
    src = open(os.path.join(OUT, "manifest.js"), encoding="utf-8").read()
    m = re.search(r"window.BK_MANIFEST = (.*?);\nwindow.BK_CREDITS", src, re.S)
    manifest = json.loads(m.group(1))
    os.makedirs(os.path.join(OUT, "img", "castle"), exist_ok=True)
    sheets = {}
    def sheet(n):
        if n not in sheets: sheets[n] = Image.open(os.path.join(ART, n)).convert("RGBA")
        return sheets[n]
    sizes = {}
    for pid, (n, box) in list(PROPS.items()) + [("wall", WALL), ("window", WINDOW), ("door", DOOR)]:
        im = sheet(n).crop(box)
        if pid != "wall": im = tight(im)
        path = "assets/img/castle/%s.png" % pid
        im.save(os.path.join(ROOT, path))
        manifest["images"]["castle_" + pid] = dict(url=path, w=im.width, h=im.height)
        sizes[pid] = (im.width, im.height)
    for key, (n, fw, fh, frames, fps) in SPRITES.items():
        im = sheet(n)
        if key == "castle_torch": im = im.crop((0, 32, 192, 64))         # the lit wall torch row
        path = "assets/sprites/%s.png" % key
        im.save(os.path.join(ROOT, path))
        manifest["sprites"][key] = dict(url=path, fw=fw, fh=fh, frames=frames, fps=fps)
    rest = src[m.end(1):]
    # credits shown in the game (kept once)
    cm = re.search(r"window.BK_CREDITS = (.*?);", rest)
    if cm:
        cr = json.loads(cm.group(1))
        for line in [["Vár", "GandalfHardcore: FREE Platformer Assets"], ["Mesék", "Benedek Elek (Grimm-mesék, Magyar mese- és mondavilág)"]]:
            if line not in cr: cr.append(line)
        rest = rest[:cm.start(1)] + json.dumps(cr, ensure_ascii=False) + rest[cm.end(1):]
    with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
        f.write(src[:m.start(1)] + json.dumps(manifest, indent=1, ensure_ascii=False) + rest)
    for k, v in sizes.items(): print("%-11s %dx%d" % (k, v[0], v[1]))


if __name__ == "__main__":
    main()
