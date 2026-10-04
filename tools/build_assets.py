#!/usr/bin/env python3
"""
Betűkaland asset builder.

Copies ONLY the assets the game uses from the Game Assets library into ./assets,
packs frame sequences into horizontal spritesheet strips, makes recoloured
variants (outfits, bosses), converts WAV audio to MP3, bakes the m5x7 pixel
font into a bitmap font (with redrawn ő ű Ő Ű, which are identical to ö ü Ö Ü
in the original font), and writes assets/manifest.js for the game loader.

The library is never modified.

Usage (from the project folder):
    python3 tools/build_assets.py --lib "/Users/marktremmel/Downloads/Game Assets"
    python3 tools/build_assets.py --lib ... --no-audio      # skip slow audio step

Requires: Python 3 with Pillow, and ffmpeg on PATH for audio.
To add an asset: add one line to the SPRITES / IMAGES / SOUNDS / MUSIC tables
below, run the script, then run tools/build_pack.py (offline bundle).
"""
import argparse, colorsys, json, os, shutil, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "assets")

# Library sub-paths (relative to --lib)
LEG = "01_Retro_2D_SideView_Platformer/Legacy Collection/Assets/"
SUN = LEG + "Misc/"
BER = "01_Retro_2D_SideView_Platformer/Berie's_Adventure_Seaside_Asset_Pack_v1.1.1/Spritesheet/"
CRB = "01_Retro_2D_SideView_Platformer/Crabby_Beach_Assets_Pack_v1.1/Spritesheet/"
TRPG = LEG + "TinyRPG/Characters/Battle Sprites/"
GOTH = LEG + "Gothicvania/Characters/"
FX = "06_2D_Pixel_FX/Effect and FX Pixel All Free/"
WOOD = "05_2D_UI_Icons_Fonts/Complete_UI_Essential_Pack_v2.4/03_Wood_Theme/Sprites/"
FLAT = "05_2D_UI_Icons_Fonts/Complete_UI_Essential_Pack_v2.4/01_Flat_Theme/Sprites/"
ADDIN = "05_2D_UI_Icons_Fonts/Addin_RPG_Icons/"
SKY = "03_2D_Parallax_Backgrounds/free-sky-with-clouds-background-pixel-art-set/Clouds/"
HY = "10_Audio_SFX/Helton Yan's Pixel Combat - Single Files/"
SD = "10_Audio_SFX/Super Dialogue Audio Pack v1/Step 2 - Audio Files/"
CP = "09_Audio_Music/Clement_Panchout/"
FONT = "05_2D_UI_Icons_Fonts/Pixel_Fonts/m5x7.ttf"

# ---------------------------------------------------------------------------
# SPRITES: key -> spec. Every sprite ends up as a horizontal strip.
#   strip: (path, frames)              source already a strip
#   grid:  (path, cols, rows, n)       source is a grid, repacked to a strip
#   files: [paths]                     single frames packed to a strip (bottom-centred)
#   fxrow: (path, cell, row, first, n, step) one colour row of an FX sheet
# "fps" is a default animation speed used by the game.
# ---------------------------------------------------------------------------
SPRITES = {
    # hero (Sunny Land bunny)
    "bunny_idle": dict(strip=(SUN + "Characters/sunny-bunny/Spritesheets/sunny-bunny-idle.png", 4), fps=6),
    "bunny_run":  dict(strip=(SUN + "Characters/sunny-bunny/Spritesheets/sunny-bunny-run.png", 6), fps=12),
    "bunny_jump": dict(strip=(SUN + "Characters/sunny-bunny/Spritesheets/sunny-bunny-jump.png", 5), fps=10),
    # alternative hero (Berie)
    "berie_idle": dict(strip=(BER + "character_berie_idle.png", 4), fps=6),
    "berie_run":  dict(strip=(BER + "character_berie_run.png", 6), fps=12),
    # region 1 creatures
    "frog_walk":  dict(strip=(SUN + "Characters/sunny-froggy/Spritesheets/sunny-froggy-walk.png", 10), fps=12),
    "frog_taunt": dict(strip=(SUN + "Characters/sunny-froggy/Spritesheets/sunny-froggy-taunting.png", 4), fps=6),
    "mush_walk":  dict(strip=(SUN + "Characters/sunny-mushroom/spritesheets/sunny-mushroom-walk.png", 10), fps=12),
    "gull_fly":   dict(strip=(BER + "character_enemy_seagull_fly_idle.png", 7), fps=10),
    "crabkid_walk": dict(strip=(CRB + "crab_child_walk.png", 4), fps=8),
    "crab_walk":  dict(strip=(CRB + "crab_parent_walk.png", 4), fps=8),
    "sandbug_walk": dict(strip=(BER + "character_enemy_sandbug_walk.png", 4), fps=8),
    "starfish_idle": dict(strip=(BER + "character_enemy_starfish_idle.png", 5), fps=8),
    "octopus_idle": dict(strip=(BER + "character_enemy_octopus_idle.png", 4), fps=6),
    "shell_idle": dict(strip=(BER + "character_enemy_shell_idle.png", 6), fps=8),
    # friends
    "karou_sit":  dict(strip=(BER + "character_karou_sit_idle.png", 4), fps=5),
    # mini-boss and bosses
    "toad_idle":  dict(strip=(GOTH + "mutant-toad/Spritesheets/mutant-toad-idle.png", 5), fps=7),
    "frogknight_idle": dict(files=[TRPG + "Living Pack 1/Frog/Sprites/Frog%d.png" % i for i in range(1, 7)], fps=7),
    "bigbird_fly": dict(grid=(BER + "character_boss_fly_idle.png", 3, 2, 6), fps=8),
    "dragon_fly": dict(strip=(SUN + "Characters/sunny-dragon/spritesheets/sunny-dragon-fly.png", 9), fps=10),
    # later-region bosses and mini-bosses
    "babydragon_idle": dict(strip=(GOTH + "Grotto-escape-2-boss-dragon/spritesheets/idle.png", 6), fps=8),
    "slime_idle": dict(files=[TRPG + "Living Pack 1/Slime/Sprites/slime%d.png" % i for i in range(1, 5)], fps=6),
    # beach decor
    "palm":       dict(strip=(BER + "vegetation_tree_palm.png", 6), fps=1),
    # objects
    "chest":      dict(strip=(BER + "object_treasure_chest_default.png", 5), fps=10),
    "coin":       dict(strip=(CRB + "collectible_coin_big_idle.png", 8), fps=10),
    "heart":      dict(strip=(CRB + "collectible_heart_idle.png", 4), fps=6),
    "boss_heart": dict(strip=(BER + "ui_boss_heart.png", 8), fps=10),
    "signpost":   dict(strip=(CRB + "object_signpost.png", 5), fps=6),
    # effects
    "fx_spark":   dict(fxrow=(FX + "Part 2/62.png", 64, 0, 0, 8, 1), fps=24),
    "fx_burst":   dict(fxrow=(FX + "Part 14/652.png", 64, 0, 2, 12, 1), fps=24),
    "fx_burst_b": dict(fxrow=(FX + "Part 14/652.png", 64, 2, 2, 12, 1), fps=24),
    "fx_coin":    dict(strip=(BER + "vfx_effect_coin.png", 4), fps=12),
    "fx_impact":  dict(strip=(CRB + "vfx_impact1.png", 8), fps=20),
    "fx_confetti": dict(strip=(CRB + "vfx_confetti.png", 4), fps=10),
    "fx_leaf":    dict(strip=(BER + "particle_leaf.png", 2), fps=4),
}

# Outfits: every playable hero gets these colours (hue shift, saturation, value).
# Each animation of a hero (e.g. frog_walk, frog_taunt) is recoloured.
OUTFIT_COLOURS = {
    "blue":  (200, 1.0, 1.0),
    "mint":  (110, 0.9, 1.05),
    "pink":  (320, 0.9, 1.1),
    "gold":  (25, 1.35, 1.15),
    "night": (230, 0.45, 0.8),
}
HERO_BASES = ["bunny", "berie", "frog", "mush", "crab", "gull"]

# Plain images (optionally cropped): key -> (path, crop box or None)
SUNTILES = SUN + "colorful-tileset/PNG/layers/tile-set.png"
IMAGES = {
    "ground":   (SUNTILES, (80, 112, 96, 134)),
    "tree":     (SUNTILES, (38, 20, 106, 96)),
    "bush":     (SUNTILES, (112, 38, 160, 64)),
    "plank":    (SUNTILES, (144, 112, 160, 128)),
    "icons_food": (ADDIN + "Addin's RPG Icon Pack - 200+ Food and Drinks/Full Spritesheet/16x16.png", None),
    "icons_gear": (ADDIN + "Addin's 250+ Survival Items - RPG Icon Pack/Full Spritesheet/16x16.png", None),
    # ground strips for later regions (16 px wide, tiled)
    "ground_sand":  (BER + "tilemap_new_softy_sand.png", (32, 0, 48, 22)),
    "ground_rock":  (BER + "tilemap_new_rocky_sand.png", (32, 0, 48, 22)),
    "ground_moss":  (BER + "tilemap_new_rocky_emerald_sand.png", (32, 0, 48, 22)),
    "ground_stone": (BER + "tilemap_new_bricky_sand.png", (32, 0, 48, 22)),
    "rocks":        (BER + "vegetation_rocks.png", None),
    # wood UI
    "ui_panel":  (WOOD + "UI_Wood_Frame_Standard_01.png", None),
    "ui_panel2": (WOOD + "UI_Wood_Frame_Standard_02.png", None),
    "ui_inward": (WOOD + "UI_Wood_Frame_Inward_01.png", None),
    "ui_lite":   (WOOD + "UI_Wood_Frame_Lite_01.png", None),
    "ui_btn":    (WOOD + "UI_Wood_Button_Large_Release_01a1.png", None),
    "ui_btn_down": (WOOD + "UI_Wood_Button_Large_Press_01a1.png", None),
    "ui_btn_s":  (WOOD + "UI_Wood_Button_Small_Release_01a1.png", None),
    "ui_btn_s_down": (WOOD + "UI_Wood_Button_Small_Press_01a1.png", None),
    "ui_banner": (WOOD + "UI_Wood_Banner_Upward_01.png", None),
    "ui_slot":   (WOOD + "UI_Wood_Slot_Available_01.png", None),
    "ui_slot_sel": (WOOD + "UI_Wood_Slot_Selected_01.png", None),
    "ui_slot_off": (WOOD + "UI_Wood_Slot_Unavailable_01.png", None),
    "ui_field":  (WOOD + "UI_Wood_Textfield_01.png", None),
    "ui_bar":    (WOOD + "UI_Wood_Fillbar_Flat_01.png", None),
    "ui_bar_fill": (WOOD + "UI_Wood_Fillbar_Filler_Green.png", None),
    "ui_check":  (WOOD + "UI_Wood_Checkmark_Small.png", None),
    "ui_cross":  (WOOD + "UI_Wood_Cross_Small.png", None),
    "ui_arrow":  (WOOD + "UI_Wood_Arrow_Small.png", None),
    "ui_post":   (WOOD + "UI_Wood_Frame_Vertical_01.png", None),
    # flat UI for the HTML overlays (save code, teacher screen)
    "flat_btn":  (FLAT + "UI_Flat_Button01a_1.png", None),
    "flat_btn_down": (FLAT + "UI_Flat_Button01a_3.png", None),
    "flat_frame": (FLAT + "UI_Flat_Frame01a.png", None),
}

# Parallax backdrops for later regions: name -> list of layers, back to front.
# A layer is a file path, or (path, crop box) when one image holds many layers.
MDUSK = "03_2D_Parallax_Backgrounds/Super Mountain Dusk Files/Assets/"
BACKDROPS = {
    # Crabby Beach background: 15 layers of 480x270 side by side in one image
    "beach": [(CRB + "background_crabbybeach.png", (i * 480, 0, (i + 1) * 480, 270)) for i in range(15)],
    "mountain": [MDUSK + "version B/Layers/" + n + ".png" for n in ("sky", "far-mountains", "middle-mountains", "myst", "far-trees", "near-trees")],
    "canyon": [MDUSK + "Version C/layers/" + n + ".png" for n in ("sky", "clouds", "far-mountains", "canyon", "front")],
    "moon": [MDUSK + "version A/Layers/" + n + ".png" for n in ("sky", "far-clouds", "far-mountains", "mountains", "near-clouds", "trees")],
}

# Skies: all 8 cloud sets, every layer
SKIES = {n: SKY + "Clouds %d/" % n for n in range(1, 9)}

# Sound effects: key -> source wav (Helton Yan, Super Dialogue)
def hy(name, n=1):
    return HY + "%s_HY_PC-%03d.wav" % (name, n)

SOUNDS = {
    "key_ok":   hy("UIClick_INTERFACE-Positive Click", 1),
    "key_ok2":  hy("UIClick_INTERFACE-Positive Click", 2),
    "key_bad":  hy("DSGNTonl_INTERFACE-Tonal Click", 4),
    "word_done": hy("DSGNTonl_SKILL IMPACT-Star Sparkle", 1),
    "poof":     hy("DSGNMisc_SKILL IMPACT-Whimsimpact", 2),
    "coin":     hy("DSGNTonl_USABLE-Whimsy Coin", 1),
    "chest":    hy("DSGNTonl_USABLE-Magic Item", 1),
    "star":     hy("DSGNTonl_SKILL IMPACT-Magic Sparkles", 1),
    "level_up": hy("DSGNSynth_BUFF-Stats Up", 1),
    "step":     hy("DSGNMisc_STEP-Critter Step", 1),
    "ui":       hy("DSGNTonl_INTERFACE-Tonal Click", 1),
    "whoosh":   hy("SWSH_MOVEMENT-Sparkle Passby", 4),
    "boss_hit": hy("DSGNMisc_HIT-Swish Clap", 1),
    "wobble":   hy("WHSH_MOVEMENT-Wind Shaker", 5),
    "buy":      hy("DSGNTonl_USABLE-Coin Spend", 1),
    "chirp":    hy("DSGNTonl_USABLE-Chirps", 1),
    "chime":    hy("SWSH_MOVEMENT-Tiny Chime", 4),
    "gate":     hy("SWSH_MOVEMENT-Bubbly Passby", 5),
    # voices (Super Dialogue, Dillon Becker, CC BY 4.0)
    "v_great":  SD + "2 - Confirmation/Female/Karen Cenon/confirmation_6_karen.wav",
    "v_letsgo": SD + "2 - Confirmation/Female/Karen Cenon/confirmation_7_karen.wav",
    "v_woo":    SD + "6 - Miscellaneous/Female/Karen Cenon/miscellaneous_4_karen.wav",
    "v_wow":    SD + "6 - Miscellaneous/Female/Karen Cenon/miscellaneous_10_karen.wav",
    "v_alldone": SD + "1 - Completion/Female/Karen Cenon/completion_1_karen.wav",
    "v_highscore": SD + "6 - Miscellaneous/Female/Karen Cenon/miscellaneous_11_karen.wav",
    "v_go":     SD + "6 - Miscellaneous/Female/Karen Cenon/miscellaneous_9_karen.wav",
    "v_hiya":   SD + "3 - Greeting/Female/Karen Cenon/greeting_8_karen.wav",
    "v_goodluck": SD + "4 - Farewell/Female/Karen Cenon/farewell_9_karen.wav",
    "v_great_m": SD + "2 - Confirmation/Male/Alex Brodie/confirmation_6_alex.wav",
    "v_woo_m":  SD + "6 - Miscellaneous/Male/Alex Brodie/miscellaneous_4_alex.wav",
}

# Music: key -> source wav (Clement Panchout)
MUSIC = {
    "m_title":  CP + "2014 07_ Clement Panchout_ Partycles OST_ Cheerful Title Screen.wav",
    "m_map":    CP + "2016_ Clement Panchout_ Life is full of Joy.wav",
    "m_level1": CP + "Clement Panchout _ Jelly Blob _ 2017.wav",
    "m_level2": CP + "Clement Panchout _ Round Glasses _ 2016.wav",
    "m_level3": CP + "Clement Panchout _ Fluttering in the Sun _ (The GodMOTHer).wav",
    "m_boss":   CP + "16-Bit Beat Em All _Clement Panchout.wav",
    "m_chill":  CP + "2014 07_ Clement Panchout_ Partycles OST_ The Chillout Factory.wav",
    "m_test":   CP + "2017 12_ Clement Panchout_ Omno (Demo)_ Contemplative.wav",
    "m_party":  CP + "Clement Panchout_ Best Party Ever _ 2019.wav",
    "m_70s":    CP + "Clement Panchout - Sweet 70s.wav",
    "m_journey": CP + "Clement Panchout _ Journey _ 2017.wav",
    "m_desert": CP + "Modern _ Eastern _ Arabian Princess _ Clement Panchout 2019.wav",
    "m_moon":   CP + "Clement Panchout_ Forest Of A Thousand Masks.wav",
    "m_sky":    CP + "Time Flies _Clement Panchout _2016.wav",
    "m_final":  CP + "Clement Panchout _ MW FUP _ Chaotic Boss.wav",
}

# Credits: written to assets/credits.js and shown on the CREDITS screen
CREDITS = [
    ["Grafika", "Ansimuz: Sunny Land, Tiny RPG, Gothicvania"],
    ["Grafika", "Crabby Beach, Berie's Adventure: Seaside"],
    ["Felület", "Complete UI Essential: Crusenho, CC BY 4.0"],
    ["Ikonok", "Addin's RPG Icon Packs: Addin"],
    ["Effektek", "Effect and FX Pixel"],
    ["Égbolt", "Free Sky with Clouds: CraftPix.net"],
    ["Betűtípus", "m5x7: Daniel Linssen"],
    ["Zene", "Music by Clement Panchout"],
    ["Hangok", "Pixel Combat SFX: Helton Yan"],
    ["Hangok", "Super Dialogue: Dillon Becker, CC BY 4.0"],
    ["Motor", "Phaser 3 (phaser.io), MIT licence"],
]

FONT_CHARS = (
    "".join(chr(c) for c in range(32, 127))
    + "áéíóöőúüűÁÉÍÓÖŐÚÜŰ·×€°"
)

# ---------------------------------------------------------------------------

def log(*a):
    print(*a, flush=True)


def load(lib, rel):
    return Image.open(os.path.join(lib, rel)).convert("RGBA")


def pack_frames(frames):
    """Pack frames into a strip, each cell = max w x max h, bottom-centred."""
    fw = max(f.width for f in frames)
    fh = max(f.height for f in frames)
    out = Image.new("RGBA", (fw * len(frames), fh))
    for i, f in enumerate(frames):
        out.alpha_composite(f, (i * fw + (fw - f.width) // 2, fh - f.height))
    return out, fw, fh


def trim_strip(img, n):
    """Trim empty rows above/below a strip (keeps all frames aligned)."""
    bb = img.getbbox()
    if not bb:
        return img
    return img.crop((0, bb[1], img.width, bb[3]))


def build_sprite(lib, key, spec):
    if "strip" in spec:
        path, n = spec["strip"]
        img = load(lib, path)
        fw, fh = img.width // n, img.height
        img = img.crop((0, 0, fw * n, fh))
    elif "grid" in spec:
        path, cols, rows, n = spec["grid"]
        src = load(lib, path)
        cw, ch = src.width // cols, src.height // rows
        frames = [src.crop(((i % cols) * cw, (i // cols) * ch, (i % cols + 1) * cw, (i // cols + 1) * ch)) for i in range(n)]
        img, fw, fh = pack_frames(frames)
    elif "files" in spec:
        frames = [load(lib, p) for p in spec["files"]]
        img, fw, fh = pack_frames(frames)
    elif "fxrow" in spec:
        path, cell, row, first, n, step = spec["fxrow"]
        src = load(lib, path)
        frames = [src.crop(((first + i * step) * cell, row * cell, (first + i * step + 1) * cell, (row + 1) * cell)) for i in range(n)]
        img, fw, fh = pack_frames(frames)
        n = len(frames)
    else:
        raise ValueError(key)
    n = img.width // fw
    return img, fw, fh, n


def recolour(img, hue_deg, sat, val):
    """Hue-rotate coloured pixels; dark outlines and greys stay as they are."""
    px = img.load()
    out = img.copy()
    po = out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if s < 0.15 or v < 0.18:      # keep outline and neutral pixels
                continue
            h = (h + hue_deg / 360.0) % 1.0
            s = max(0, min(1, s * sat))
            v = max(0, min(1, v * val))
            rr, gg, bb = colorsys.hsv_to_rgb(h, s, v)
            po[x, y] = (int(rr * 255), int(gg * 255), int(bb * 255), a)
    return out


# ---------------------------------------------------------------------------
# Font: m5x7 baked to a bitmap font. ő ű Ő Ű get redrawn double acutes.
# ---------------------------------------------------------------------------
PATCH = {"ő": "ö", "ű": "ü", "Ő": "Ö", "Ű": "Ü"}


def glyph_bitmap(font, c):
    def raw(ch):
        im = Image.new("L", (12, 16), 0)
        d = ImageDraw.Draw(im)
        d.fontmode = "1"
        d.text((1, 0), ch, font=font, fill=255)
        return [[im.getpixel((x, y)) > 0 for x in range(12)] for y in range(16)]
    if c in PATCH:
        b = raw(PATCH[c])
        rows = [y for y in range(16) if any(b[y])]
        top = rows[0]
        b[top] = [False] * 12           # remove the two dots
        b[top][2] = b[top][4] = True    # lower half of the double acute
        b[top - 1][3] = b[top - 1][5] = True  # upper half, shifted right
        return b
    return raw(c)


def build_font(lib):
    font = ImageFont.truetype(os.path.join(lib, FONT), 16)
    chars = FONT_CHARS
    cols = 16
    rows = (len(chars) + cols - 1) // cols
    CW, CH = 14, 18          # cell with 1 px padding for the outline variant
    plain = Image.new("RGBA", (cols * CW, rows * CH))
    outl = Image.new("RGBA", (cols * CW, rows * CH))
    meta = []
    for i, c in enumerate(chars):
        b = glyph_bitmap(font, c)
        cx, cy = (i % cols) * CW, (i // cols) * CH
        on = [(x, y) for y in range(16) for x in range(12) if b[y][x]]
        for x, y in on:
            plain.putpixel((cx + 1 + x, cy + 1 + y), (255, 255, 255, 255))
        # outline: dark pixels around every lit pixel
        lit = set(on)
        for x, y in on:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    q = (x + dx, y + dy)
                    if q not in lit:
                        outl.putpixel((cx + 1 + q[0], cy + 1 + q[1]), (43, 26, 20, 255))
        for x, y in on:
            outl.putpixel((cx + 1 + x, cy + 1 + y), (255, 255, 255, 255))
        if c == " ":
            adv = 4
        else:
            xs = [x for x, _ in on]
            adv = (max(xs) + 1) if xs else 4   # glyph starts at x=1 inside its 12 px box
        meta.append((c, cx, cy, adv))
    os.makedirs(os.path.join(OUT, "fonts"), exist_ok=True)
    for name, img in (("m5x7", plain), ("m5x7o", outl)):
        img.save(os.path.join(OUT, "fonts", name + ".png"))
        lines = ['<?xml version="1.0"?>', "<font>",
                 '<info face="%s" size="16"/>' % name,
                 '<common lineHeight="13" base="12" scaleW="%d" scaleH="%d" pages="1"/>' % (img.width, img.height),
                 '<pages><page id="0" file="%s.png"/></pages>' % name,
                 '<chars count="%d">' % len(meta)]
        for c, cx, cy, adv in meta:
            lines.append('<char id="%d" x="%d" y="%d" width="%d" height="%d" xoffset="-1" yoffset="-3" xadvance="%d" page="0" chnl="15"/>'
                         % (ord(c), cx, cy, CW, CH, adv))
        lines += ["</chars>", "</font>"]
        with open(os.path.join(OUT, "fonts", name + ".xml"), "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
    shutil.copy(os.path.join(lib, FONT), os.path.join(OUT, "fonts", "m5x7.ttf"))
    log("font: %d glyphs" % len(meta))


# ---------------------------------------------------------------------------

def to_mp3(src, dst, bitrate, mono=False, trim=False):
    # -map 0:a drops embedded cover images (some WAVs carry one, which bloats the MP3)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-map", "0:a", "-map_metadata", "-1"]
    if trim:   # cut trailing silence from short effects
        cmd += ["-af", "areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse,apad=pad_dur=0.05"]
    if mono:
        cmd += ["-ac", "1"]
    cmd += ["-ar", "44100", "-b:a", bitrate, "-codec:a", "libmp3lame", dst]
    subprocess.run(cmd, check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lib", default=os.path.expanduser("~/Downloads/Game Assets"))
    ap.add_argument("--no-audio", action="store_true")
    a = ap.parse_args()
    lib = a.lib
    if not os.path.isdir(lib):
        sys.exit("Library not found: " + lib)

    manifest = {"sprites": {}, "images": {}, "skies": {}, "sounds": {}, "music": {}, "fonts": {}}
    os.makedirs(os.path.join(OUT, "sprites"), exist_ok=True)
    os.makedirs(os.path.join(OUT, "img"), exist_ok=True)

    built = {}
    for key, spec in SPRITES.items():
        img, fw, fh, n = build_sprite(lib, key, spec)
        built[key] = (img, fw, fh, n, spec.get("fps", 10))
        img.save(os.path.join(OUT, "sprites", key + ".png"))
        manifest["sprites"][key] = dict(url="assets/sprites/%s.png" % key, fw=fw, fh=fh, frames=n, fps=spec.get("fps", 10))
        log("sprite %-16s %2d x %dx%d" % (key, n, fw, fh))

    for suffix, (hue, sat, val) in OUTFIT_COLOURS.items():
        for k in [k for k in built if k.split("_")[0] in HERO_BASES]:
            img, fw, fh, n, fps = built[k]
            nk = "%s_%s" % (k, suffix)          # e.g. bunny_run_blue
            recolour(img, hue, sat, val).save(os.path.join(OUT, "sprites", nk + ".png"))
            manifest["sprites"][nk] = dict(url="assets/sprites/%s.png" % nk, fw=fw, fh=fh, frames=n, fps=fps)
        log("recolour", suffix)

    for key, (path, crop) in IMAGES.items():
        img = load(lib, path)
        if crop:
            img = img.crop(crop)
        img.save(os.path.join(OUT, "img", key + ".png"))
        manifest["images"][key] = dict(url="assets/img/%s.png" % key, w=img.width, h=img.height)
    log("images:", len(IMAGES))

    os.makedirs(os.path.join(OUT, "sky"), exist_ok=True)
    for n, folder in SKIES.items():
        files = sorted([f for f in os.listdir(os.path.join(lib, folder)) if f.endswith(".png")], key=lambda f: int(f[:-4]))
        layers = []
        for f in files:
            dst = "sky%d_%s" % (n, f)
            shutil.copy(os.path.join(lib, folder, f), os.path.join(OUT, "sky", dst))
            layers.append("assets/sky/" + dst)
        manifest["skies"][str(n)] = layers
    log("skies: 8")

    os.makedirs(os.path.join(OUT, "bd"), exist_ok=True)
    manifest["backdrops"] = {}
    for name, layers in BACKDROPS.items():
        urls = []
        for i, spec in enumerate(layers):
            path, crop = spec if isinstance(spec, tuple) else (spec, None)
            img = load(lib, path)
            if crop:
                img = img.crop(crop)
            dst = "%s_%d.png" % (name, i + 1)
            img.save(os.path.join(OUT, "bd", dst))
            urls.append(dict(url="assets/bd/" + dst, w=img.width, h=img.height))
        manifest["backdrops"][name] = urls
    log("backdrops:", ", ".join(BACKDROPS))

    build_font(lib)
    for name in ("m5x7", "m5x7o"):
        manifest["fonts"][name] = dict(png="assets/fonts/%s.png" % name, xml="assets/fonts/%s.xml" % name)

    os.makedirs(os.path.join(OUT, "audio"), exist_ok=True)
    for key, src in SOUNDS.items():
        dst = os.path.join(OUT, "audio", key + ".mp3")
        if not a.no_audio or not os.path.exists(dst):
            to_mp3(os.path.join(lib, src), dst, "96k", mono=True, trim=True)
        manifest["sounds"][key] = "assets/audio/%s.mp3" % key
    log("sounds:", len(SOUNDS))
    for key, src in MUSIC.items():
        dst = os.path.join(OUT, "audio", key + ".mp3")
        if not a.no_audio or not os.path.exists(dst):
            to_mp3(os.path.join(lib, src), dst, "112k")
        manifest["music"][key] = "assets/audio/%s.mp3" % key
        log("music", key)

    with open(os.path.join(OUT, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("// Generated by tools/build_assets.py. Do not edit by hand.\n")
        f.write("window.BK_MANIFEST = " + json.dumps(manifest, indent=1, ensure_ascii=False) + ";\n")
        f.write("window.BK_CREDITS = " + json.dumps(CREDITS, ensure_ascii=False) + ";\n")
    log("manifest written")


if __name__ == "__main__":
    main()
