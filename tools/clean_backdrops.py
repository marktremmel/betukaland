"""
NEM OKÉ parallax pieces (ChatGPT pictures, 3:1, magenta background where see-through) ->
art/nemoke_bd/<kind>_<n>.png at 3x the game size (126 game pixels high: the bottom sits on the
ground line), magenta keyed out, and made to repeat sideways without a visible seam.
    python3 tools/clean_backdrops.py <folder with the pictures>
Which picture is which kind: BD below (by file name).
"""
import os, sys, glob
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "art", "nemoke_bd")
H = 126 * 3
BD = {
    "sky": ["16-Bit Cloudscape in Soft Layers", "16-Bit Sunset Cloudscape", "Pastel Pixel Rainbow Sky", "Pixel Art Sky with Fluffy Clouds", "Retro Pixel Sunset Sky"],
    "far": ["Magenta Sky Hazy Pixel Town", "Misty Teal Pixel Forest on Magenta Sky", "Pixel Art Snowy Mountain Range", "Pixel Art Village Among Rolling Hills"],
    "mid": ["Autumn Birch Grove Bench Scene", "Pixel Art Playground Park", "Pixel Art Treehouse School on Magenta", "Pixel Art Village Street Tile", "Pixel Art Willow Pond with Dock", "Pixel Forest with Magenta Sky"],
    "near": ["Pixel Art Autumn Foliage Border", "Pixel Art Hedge with Rocks and Grass", "Pixel Art Meadow Bushes and Wildflowers", "Pixel-Art Meadow Fence on Magenta"],
}


PAD = {("mid", "Pixel Art Treehouse School on Magenta"): 1.2, ("mid", "Pixel Art Playground Park"): 0.8,
       ("mid", "Pixel Art Willow Pond with Dock"): 0.6, ("mid", "Autumn Birch Grove Bench Scene"): 0.5}


def key_magenta(a):
    """alpha from the distance to magenta; the magenta tint taken out of edge pixels"""
    rgb = a[..., :3].astype(np.float32)
    mag = np.array([250, 4, 250], np.float32)
    d = np.sqrt(((rgb - mag) ** 2).sum(-1))
    # magenta-ish: red and blue high, green low
    pinkness = np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1]
    alpha = np.clip((d - 60) / 90, 0, 1)
    alpha = np.where(pinkness > 150, np.minimum(alpha, np.clip((200 - pinkness) / 50, 0, 1)), alpha)
    # despill: take the magenta out of half-transparent pixels
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1] - 40, 0, None) * (1 - alpha)
    rgb[..., 0] -= spill; rgb[..., 2] -= spill
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    return out


def seamless(img, frac=0.12):
    """cross-fade the right edge into the left one, so the picture repeats without a seam"""
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]; ov = int(w * frac)
    left, right = a[:, :ov], a[:, w - ov:]
    t = np.linspace(0, 1, ov)[None, :, None]           # 0 at the start of the overlap
    # premultiplied blend
    la, ra = left[..., 3:4] / 255, right[..., 3:4] / 255
    pc = right[..., :3] * ra * (1 - t) + left[..., :3] * la * t
    pa = ra * (1 - t) + la * t
    rgb = np.where(pa > 0, pc / np.maximum(pa, 1e-6), 0)
    blend = np.concatenate([rgb, pa * 255], -1)
    res = np.concatenate([blend, a[:, ov:w - ov]], 1)
    return Image.fromarray(np.clip(res, 0, 255).astype(np.uint8), "RGBA")


def main(src):
    os.makedirs(DST, exist_ok=True)
    for kind, names in BD.items():
        for i, n in enumerate(names):
            f = os.path.join(src, n + ".png")
            if not os.path.exists(f): print("missing", n); continue
            im = Image.open(f).convert("RGBA")
            a = np.asarray(im)
            if kind != "sky": im = Image.fromarray(key_magenta(a), "RGBA")
            # trim empty columns/rows? no: keep the 3:1 frame, bottom on the ground line
            # the near pieces a little lower, so they do not hide the scene behind them
            h = H if kind != "near" else int(H * 0.8)
            w = round(im.width * h / im.height)
            im = im.convert("RGBa").resize((w, h), Image.LANCZOS).convert("RGBA")
            if h != H:
                c = Image.new("RGBA", (w, H), (0, 0, 0, 0)); c.paste(im, (0, H - h)); im = c
            # a single scene (a school, a playground): empty space around it, so it does not
            # come round again on the same screen
            if (kind, n) in PAD:
                c = Image.new("RGBA", (int(im.width * (1 + PAD[(kind, n)])), H), (0, 0, 0, 0))
                c.paste(im, ((c.width - im.width) // 2, 0)); im = c
            im = seamless(im, 0.12 if (kind, n) not in PAD else 0.04)
            out = os.path.join(DST, "%s_%d.png" % (kind, i + 1))
            im.save(out, optimize=True)
            print(kind, i + 1, n, im.size)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "new_gb"))
