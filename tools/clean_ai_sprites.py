"""
Cleans up the AI-drawn animal sheets (ChatGPT image generation, ideas from
class 4.B) into real pixel-art strips for the game.

Input: new_animals/*.png, one row of frames on a flat magenta background
(see new_animals/CHATGPT_PROMPTS.md). Output: art/animals/<name>_<idle|run>.png,
which tools/build_assets.py packs like the library sprites (outfit colours too).

Steps per animal: key out the magenta, split the row into frames, shrink each
frame to the target height by area sampling (after shaving off the magenta
fringe), share one 18-colour palette between the idle and the run sheet,
smooth the silhouette, clean up stray pixels, draw one even 1 px outline, and
line the frames up on the feet (bottom) and the head (horizontal centre), so
the figure doesn't jitter.

The Halloween characters (halloween/*.png) go the same way into art/halloween/.
Afterwards: python3 tools/build_assets.py --local (packs art/ into assets/), then tools/build_pack.py.

Needs numpy, scipy, scikit-learn, Pillow.  Run: python3 tools/clean_ai_sprites.py [names]
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "new_animals"); DST = os.path.join(ROOT, "art", "animals")

# name -> source files (as saved from ChatGPT)
FILES = {
    "cheetah": {"idle": "Pixel Cheetah Idle Animation.png", "run": "Pixel Cheetah Running Cycle.png"},
    "panda": {"idle": "Pixel Panda Idle Animation Sheet.png", "run": "Pixel Panda Running Cycle.png"},
    "firefox": {"idle": "Chibi Fox Idle Animation Sprite Sheet.png", "run": "Pixel Fox Running Cycle.png"},
    "roach": {"idle": "Pixel Bug Idle Animation Sheet.png", "run": "Joyful Cockroach Running Sprite Sheet.png"},
    "tiger": {"idle": "Pixel Tiger Idle Animation Set.png", "run": "Pixel Tiger Run Cycle on Magenta.png"},
    "seahorse": {"idle": "Pixel Seahorse Idle Animation.png", "run": "Pixel Seahorse Animation Strip.png"},
    "polar": {"idle": "Pixel Bear Idle Animation Strip.png", "run": "Polar Bear Scarf Run Cycle.png"},
}
# (sheet, frames, target height in game pixels). The run sheets come out drawn
# smaller, so they get their own height to keep the head the same size.
CFG = {
    "cheetah": [("idle", 4, 41), ("run", 6, 40)],
    "panda": [("idle", 4, 38), ("run", 6, 37)],
    "firefox": [("idle", 4, 41), ("run", 6, 40)],
    "roach": [("idle", 4, 46), ("run", 6, 45)],
    "tiger": [("idle", 4, 40), ("run", 6, 39)],
    "seahorse": [("idle", 4, 40), ("run", 6, 40)],
    "polar": [("idle", 4, 41), ("run", 6, 40)],
}

# Halloween Night characters: halloween/<file> -> art/halloween/<name>_<kind>.png
# (the game uses them as soon as tools/build_assets.py --local has packed them)
HW_SRC = os.path.join(ROOT, "halloween"); HW_DST = os.path.join(ROOT, "art", "halloween")
HW_FILES = {
    "hw_ghost": {"float": "Cute Floating Ghost Sprite Sheet.png"}, "hw_bat": {"fly": "Four-Frame Pixel Bat Flight Sprite Sheet.png"},
    "hw_cat": {"walk": "Pixel Cat Witch Walk Cycle.png"}, "hw_pumpkin": {"walk": "Six-Frame Pumpkin Creature Walk Cycle.png"},
    "hw_mummy": {"walk": "Six-Frame Pixel Mummy Walk Cycle.png"}, "hw_king": {"idle": "Pixel Pumpkin King Animation Sheet.png"},
}
HW_CFG = {
    "hw_ghost": [("float", 6, 34)], "hw_bat": [("fly", 4, 30)], "hw_cat": [("walk", 6, 38)],
    "hw_pumpkin": [("walk", 6, 34)], "hw_mummy": [("walk", 6, 46)], "hw_king": [("idle", 6, 78)],
}
import numpy as np
from PIL import Image
from scipy import ndimage
from sklearn.cluster import KMeans
def load(path):
    """picture -> (rgb, figure mask). Works with a transparent PNG, or any flat background
    colour (magenta, green...): the colour is read from the picture's border."""
    im = Image.open(path)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        rgba = np.asarray(im.convert("RGBA")).astype(int)
        if (rgba[..., 3] < 128).mean() > 0.2:          # really transparent
            return rgba[..., :3], rgba[..., 3] >= 128
    a = np.asarray(im.convert("RGB")).astype(int)
    border = np.concatenate([a[:4].reshape(-1, 3), a[-4:].reshape(-1, 3), a[:, :4].reshape(-1, 3), a[:, -4:].reshape(-1, 3)])
    bgc = np.median(border, 0)
    dist = np.sqrt(((a - bgc) ** 2).sum(2))
    return a, dist > 110


def frames(path,n):
    a,m=load(path)
    cols=m.sum(0); on=cols>2; runs=[];s=None
    for x,v in enumerate(on):
        if v and s is None:s=x
        if not v and s is not None: runs.append((s,x));s=None
    if s is not None: runs.append((s,len(on)))
    runs=[r for r in runs if r[1]-r[0]>15]
    # merge small gaps until n
    while len(runs)>n:
        gaps=[runs[i+1][0]-runs[i][1] for i in range(len(runs)-1)]
        i=int(np.argmin(gaps)); runs[i]=(runs[i][0],runs[i+1][1]); del runs[i+1]
    out=[]
    for x0,x1 in runs:
        mm=m[:,x0:x1]; ys=np.where(mm.sum(1)>0)[0]
        # drop tiny specks: keep largest component rows
        y0,y1=ys[0],ys[-1]+1
        out.append((a[y0:y1,x0:x1],mm[y0:y1]))
    return out

def downs(a, m, H, mc=None):
    """area-downsample one frame to height H; returns rgb float, alpha frac.
    m gives the shape; colours come only from mc (the mask without the fringe) where it has pixels."""
    if mc is None: mc = m
    h, w = m.shape; s = h / H; W = int(round(w / s))
    rgb = np.zeros((H, W, 3)); al = np.zeros((H, W))
    for y in range(H):
        y0, y1 = int(y * s), max(int(y * s) + 1, int((y + 1) * s))
        for x in range(W):
            x0, x1 = int(x * s), max(int(x * s) + 1, int((x + 1) * s))
            mm = m[y0:y1, x0:x1]; f = mm.mean() if mm.size else 0
            al[y, x] = f
            if mm.any():
                cm = mc[y0:y1, x0:x1]
                if not cm.any(): cm = mm
                px = a[y0:y1, x0:x1][cm]
                # inner part of the cell only, so blended edges count less
                cy0, cy1 = y0 + (y1 - y0) // 4, y1 - (y1 - y0) // 4
                cx0, cx1 = x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4
                im = mc[cy0:cy1, cx0:cx1]
                if im.any(): px = a[cy0:cy1, cx0:cx1][im]
                rgb[y, x] = np.median(px, 0)
    return rgb, al

CROSS = [[0, 1, 0], [1, 1, 1], [0, 1, 0]]


def process(name, specs, K=18):
    small = []
    for kind, n, H in specs:
        src, files = (HW_SRC, HW_FILES) if name in HW_FILES else (SRC, FILES)
        fr = frames(os.path.join(src, files[name][kind]), n)
        # colours never come from the magenta-blended fringe (the outline is drawn again below)
        # one scale for the whole sheet (the tallest frame gets H), so a wings-up frame is not shrunk
        hmax = max(m.shape[0] for a, m in fr)
        small.append([downs(a, m, max(4, round((H + 2) * m.shape[0] / hmax)), ndimage.binary_erosion(m, iterations=3)) for a, m in fr])
    # shared palette per animal
    pts = np.concatenate([r[al > .5] for st in small for r, al in st])
    km = KMeans(K, n_init=4, random_state=0).fit(pts)
    pal = km.cluster_centers_
    luma = pal @ [0.3, 0.59, 0.11]
    dark_i = int(np.argmin(luma))
    dark = pal[dark_i]
    keep = set(np.argsort(luma)[:2]) | set(np.argsort(luma)[-1:])   # eyes and highlights may be single pixels
    out = {}
    for (kind, n, H), st in zip(specs, small):
        fs = []
        for rgb, al in st:
            op = al > .45
            # smooth the silhouette: fill one-pixel notches, drop loose pixels
            op = ndimage.binary_closing(np.pad(op, 1), CROSS)[1:-1, 1:-1]
            # lone pixels sticking out sideways (one neighbour, and not part of a thin line like an antenna)
            nbc = ndimage.convolve(op.astype(int), [[1, 1, 1], [1, 0, 1], [1, 1, 1]], mode='constant')
            op = op & ~(nbc == 0)
            lab, k = ndimage.label(op)
            if k > 1:      # drop specks
                sizes = ndimage.sum(op, lab, range(1, k + 1))
                op = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 4])
            idx = km.predict(rgb.reshape(-1, 3)).reshape(op.shape)
            # single stray pixels inside the figure take the colour of their neighbours
            h, w = op.shape
            for y in range(1, h - 1):
                for x in range(1, w - 1):
                    if not op[y, x] or idx[y, x] in keep: continue
                    nb = [idx[y + dy, x + dx] for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)) if op[y + dy, x + dx]]
                    if len(nb) == 4 and idx[y, x] not in nb:
                        vals, cnt = np.unique(nb, return_counts=True)
                        idx[y, x] = vals[np.argmax(cnt)]
            img = np.zeros(op.shape + (4,), np.uint8)
            img[..., :3] = pal[idx].round().clip(0, 255); img[..., 3] = op * 255
            # one clean, even outline: the outermost pixels of the figure in the darkest colour
            edge = op & ~ndimage.binary_erosion(np.pad(op, 1), CROSS)[1:-1, 1:-1]
            img[edge] = list(dark.round().astype(int)) + [255]
            fs.append(Image.fromarray(img))
        out[kind] = fs
    return out

# HD: since v0.10.1 the figures are kept at three times the game size (HD = 3) and the game shows
# them at a third (manifest "hd": 3), so the detail of the drawings stays. No palette, no redrawn
# outline: the drawings already have theirs. The magenta fringe is replaced by the nearest colour
# from inside the figure before shrinking, and the edge is made hard again afterwards.
HD = 3

def process_hd(name, specs):
    out = {}
    for kind, n, H in specs:
        src, files = (HW_SRC, HW_FILES) if name in HW_FILES else (SRC, FILES)
        fr = frames(os.path.join(src, files[name][kind]), n)
        hmax = max(m.shape[0] for a, m in fr)
        fs = []
        for a, m in fr:
            Ht = max(8, round((H + 2) * HD * m.shape[0] / hmax))
            inner = ndimage.binary_erosion(m, iterations=3)
            if not inner.any(): inner = m
            _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
            filled = a[iy, ix].astype(np.uint8)
            Wt = max(1, round(m.shape[1] * Ht / m.shape[0]))
            rgb = Image.fromarray(filled).resize((Wt, Ht), Image.BOX)
            al = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize((Wt, Ht), Image.BOX)) > 127
            al = ndimage.binary_closing(np.pad(al, 1), CROSS)[1:-1, 1:-1]
            lab, k = ndimage.label(al)
            if k > 1:      # drop specks
                sizes = ndimage.sum(al, lab, range(1, k + 1))
                al = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= 12])
            img = np.zeros((Ht, Wt, 4), np.uint8)
            img[..., :3] = np.asarray(rgb); img[..., 3] = al * 255
            fs.append(Image.fromarray(img))
        out[kind] = fs
    return out

def anchor(im):
    a = np.asarray(im)[..., 3] > 0
    ys = np.where(a.any(1))[0]; top, bot = ys[0], ys[-1]
    head = a[top: top + max(3, int((bot - top) * .45))]
    xs = np.where(head.any(0))[0]
    # centre of mass of the head band
    cx = (head.sum(0) * np.arange(a.shape[1])).sum() / head.sum()
    return cx, bot

def pack(fs, grid=1):
    an = [anchor(f) for f in fs]
    L = max(int(np.ceil(cx)) for (cx, b) in an); R = max(f.width - int(np.floor(cx)) for f, (cx, b) in zip(fs, an))
    half = max(L, R) + 1
    half = -(-half // grid) * grid       # HD sheets: sizes in whole game pixels
    fw = 2 * half
    fh = max(b + 1 for f, (cx, b) in zip(fs, an)) 
    tops = [b + 1 - 0 for f, (cx, b) in zip(fs, an)]
    fh = max(b + 1 for (cx, b) in an)
    fh = -(-fh // grid) * grid
    strip = Image.new('RGBA', (fw * len(fs), fh))
    for i, (f, (cx, b)) in enumerate(zip(fs, an)):
        strip.alpha_composite(f, (i * fw + half - int(round(cx)), fh - (b + 1)))
    return strip, fw, fh


# Halloween decorations: props cut from one sheet, each scaled to its own height
# (box index after sorting by row and x -> height in game pixels). Characters
# (cat, ghost, bat, spider, crow) and the skull and coffin are left out on purpose.
HW_DECOR_FILE = "Pixel Halloween Sprite Sheet.png"
HW_DECOR = {0: 14, 1: 22, 2: 24, 3: 20, 5: 20, 6: 44, 7: 26, 8: 32, 11: 16, 13: 20, 14: 16, 16: 22, 17: 18, 18: 24,
            19: 52, 21: 22, 22: 18, 23: 40, 24: 34, 26: 34, 28: 22, 29: 46, 31: 26, 32: 54, 33: 18}


def decor():
    path = os.path.join(HW_SRC, HW_DECOR_FILE)
    if not os.path.exists(path):
        return
    a, m = load(path)
    lab, n = ndimage.label(ndimage.binary_dilation(m, iterations=6))
    boxes = [(sl[0].start, sl[1].start, sl[0].stop, sl[1].stop) for sl in ndimage.find_objects(lab)
             if (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) > 1500]
    boxes.sort(key=lambda b: (round(b[2] / 120), b[1]))
    # small loose bits (a cauldron bubble) join the prop they overlap; indices stay those of the sorted list
    big = list(boxes)
    for j, b in enumerate(boxes):
        if (b[2] - b[0]) > 60: continue
        for i, c in enumerate(boxes):
            if i != j and (c[2] - c[0]) > 60 and b[1] < c[3] and b[3] > c[1] and abs(b[2] - c[0]) < 60:
                big[i] = (min(b[0], c[0]), min(b[1], c[1]), max(b[2], c[2]), max(b[3], c[3]))
    items = []
    for i, b in enumerate(big):
        if i not in HW_DECOR: continue
        aa = a[b[0]:b[2], b[1]:b[3]]; mm = m[b[0]:b[2], b[1]:b[3]]
        ys, xs = np.where(mm)
        aa, mm = aa[ys.min():ys.max() + 1, xs.min():xs.max() + 1], mm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        items.append(downs(aa, mm, HW_DECOR[i] + 2, ndimage.binary_erosion(mm, iterations=3)))
    pts = np.concatenate([r[al > .5] for r, al in items])
    km = KMeans(28, n_init=4, random_state=0).fit(pts)
    pal = km.cluster_centers_
    dark = pal[int(np.argmin(pal @ [0.3, 0.59, 0.11]))]
    frames_ = []
    for rgb, al in items:
        op = al > .45
        idx = km.predict(rgb.reshape(-1, 3)).reshape(op.shape)
        img = np.zeros(op.shape + (4,), np.uint8)
        img[..., :3] = pal[idx].round().clip(0, 255); img[..., 3] = op * 255
        edge = op & ~ndimage.binary_erosion(np.pad(op, 1), CROSS)[1:-1, 1:-1]
        img[edge] = list(dark.round().astype(int)) + [255]
        frames_.append(Image.fromarray(img))
    fw = max(f.width for f in frames_); fh = max(f.height for f in frames_)
    strip = Image.new("RGBA", (fw * len(frames_), fh))
    for i, f in enumerate(frames_):
        strip.alpha_composite(f, (i * fw + (fw - f.width) // 2, fh - f.height))
    os.makedirs(HW_DST, exist_ok=True)
    strip.save(os.path.join(HW_DST, "hw_decor.png"))
    print("hw_decor   %d props %dx%d" % (len(frames_), fw, fh))


def main():
    args = [n for n in sys.argv[1:] if not n.startswith('--')]
    names = [n for n in args if n != 'hw_decor'] if args else list(CFG) + [n for n in HW_CFG if all(os.path.exists(os.path.join(HW_SRC, f)) for f in HW_FILES[n].values())]
    for n in names:
        cfg, dst = (HW_CFG[n], HW_DST) if n in HW_CFG else (CFG[n], DST)
        os.makedirs(dst, exist_ok=True)
        for kind, fs in (process(n, cfg) if '--lowres' in sys.argv else process_hd(n, cfg)).items():
            st, fw, fh = pack(fs, 1 if '--lowres' in sys.argv else HD)
            st.save(os.path.join(dst, "%s_%s.png" % (n, kind)))
            print("%-10s %-5s %d frames %dx%d" % (n, kind, len(fs), fw, fh))
    if not args or "hw_decor" in args:
        decor()


if __name__ == "__main__":
    main()
