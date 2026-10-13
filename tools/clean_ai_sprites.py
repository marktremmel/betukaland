"""
Cleans up the AI-drawn animal sheets (ChatGPT image generation, ideas from
class 4.B) into real pixel-art strips for the game.

Input: new_animals/*.png, one row of frames on a flat magenta background
(see new_animals/CHATGPT_PROMPTS.md). Output: art/animals/<name>_<idle|run>.png,
which tools/build_assets.py packs like the library sprites (outfit colours too).

Steps per animal: key out the magenta, split the row into frames, shrink each
frame to the target height by area sampling, share one 18-colour palette
between the idle and the run sheet, drop specks, add a 1 px dark outline, and
line the frames up on the feet (bottom) and the head (horizontal centre), so
the figure doesn't jitter.

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
import numpy as np
from PIL import Image
from scipy import ndimage
from sklearn.cluster import KMeans
def load(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int)
    r,g,b=a[...,0],a[...,1],a[...,2]
    bg=(np.minimum(r,b)-g)>110
    return a,~bg
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

def downs(a, m, H):
    """area-downsample one frame to height H; returns rgb float, alpha frac"""
    h, w = m.shape; s = h / H; W = int(round(w / s))
    rgb = np.zeros((H, W, 3)); al = np.zeros((H, W))
    for y in range(H):
        y0, y1 = int(y * s), max(int(y * s) + 1, int((y + 1) * s))
        for x in range(W):
            x0, x1 = int(x * s), max(int(x * s) + 1, int((x + 1) * s))
            mm = m[y0:y1, x0:x1]; f = mm.mean() if mm.size else 0
            al[y, x] = f
            if mm.any():
                px = a[y0:y1, x0:x1][mm]
                # inner part of the cell only, so blended edges count less
                cy0, cy1 = y0 + (y1 - y0) // 4, y1 - (y1 - y0) // 4
                cx0, cx1 = x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4
                im = m[cy0:cy1, cx0:cx1]
                if im.any(): px = a[cy0:cy1, cx0:cx1][im]
                rgb[y, x] = np.median(px, 0)
    return rgb, al

def process(name, specs, K=18):
    small = []
    for kind, n, H in specs:
        fr = frames(os.path.join(SRC, FILES[name][kind]), n)
        small.append([downs(a, m, H) for a, m in fr])
    # shared palette per animal
    pts = np.concatenate([r[al > .5] for st in small for r, al in st])
    km = KMeans(K, n_init=4, random_state=0).fit(pts)
    pal = km.cluster_centers_
    dark = pal[np.argmin(pal.sum(1))]
    out = {}
    for (kind, n, H), st in zip(specs, small):
        fs = []
        for rgb, al in st:
            op = al > .45
            op = ndimage.binary_opening(op, np.ones((1, 1)))
            # drop specks
            lab, k = ndimage.label(op)
            if k > 1:
                sizes = ndimage.sum(op, lab, range(1, k + 1))
                op = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 4])
            idx = km.predict(rgb.reshape(-1, 3)).reshape(op.shape)
            img = np.zeros(op.shape + (4,), np.uint8)
            img[..., :3] = pal[idx].round().clip(0, 255); img[..., 3] = op * 255
            # 1 px dark outline around the silhouette, where the edge is not dark already
            pad = np.pad(op, 1)
            ring = ndimage.binary_dilation(pad, [[0, 1, 0], [1, 1, 1], [0, 1, 0]]) & ~pad
            img2 = np.zeros((op.shape[0] + 2, op.shape[1] + 2, 4), np.uint8); img2[1:-1, 1:-1] = img
            img2[ring] = list(dark.round().astype(int)) + [255]
            fs.append(Image.fromarray(img2))
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

def pack(fs):
    an = [anchor(f) for f in fs]
    L = max(int(np.ceil(cx)) for (cx, b) in an); R = max(f.width - int(np.floor(cx)) for f, (cx, b) in zip(fs, an))
    half = max(L, R) + 1; fw = 2 * half
    fh = max(b + 1 for f, (cx, b) in zip(fs, an)) 
    tops = [b + 1 - 0 for f, (cx, b) in zip(fs, an)]
    fh = max(b + 1 for (cx, b) in an)
    strip = Image.new('RGBA', (fw * len(fs), fh))
    for i, (f, (cx, b)) in enumerate(zip(fs, an)):
        strip.alpha_composite(f, (i * fw + half - int(round(cx)), fh - (b + 1)))
    return strip, fw, fh


def main():
    os.makedirs(DST, exist_ok=True)
    for n in sys.argv[1:] or list(CFG):
        for kind, fs in process(n, CFG[n]).items():
            st, fw, fh = pack(fs)
            st.save(os.path.join(DST, "%s_%s.png" % (n, kind)))
            print("%-9s %-4s %d frames %dx%d" % (n, kind, len(fs), fw, fh))


if __name__ == "__main__":
    main()
