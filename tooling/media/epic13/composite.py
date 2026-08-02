#!/usr/bin/env python3
"""Side-by-side composites (tinholt left, jarl right, same width per panel)
plus a filmstrip of tonal strips for all pairs."""
import json, os
from PIL import Image, ImageDraw, ImageFont

SP = "/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad"
OUT = f"{SP}/epic13/composites"
PANEL_W = 620
GAP = 24

PAIRS = [
    ("hjem", f"{SP}/tinholt/home-1440.png", f"{SP}/epic13/jarl/hjem-1440.png", "home ↔ hjem"),
    ("prosjekter", f"{SP}/tinholt/eiendommer-1440.png", f"{SP}/epic13/jarl/prosjekter-1440.png", "eiendommer ↔ prosjekter"),
    ("om", f"{SP}/tinholt/om-oss-1440.png", f"{SP}/epic13/jarl/om-1440.png", "om-oss ↔ om"),
    ("kontakt", f"{SP}/tinholt-full/kontakt-1440.png", f"{SP}/epic13/jarl/kontakt-1440.png", "kontakt ↔ kontakt"),
    ("prosjektside", f"{SP}/tinholt-full/detalj-leilighet-1440.png", f"{SP}/epic13/jarl/project-barkpark-1440.png", "detalj-leilighet ↔ prosjekt/barkpark"),
    ("notater", f"{SP}/tinholt-full/personvern-1440.png", f"{SP}/epic13/jarl/notater-1440.png", "personvern ↔ notater"),
]

def load_scaled(path):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    nh = int(h * PANEL_W / w)
    return im.resize((PANEL_W, nh), Image.LANCZOS)

def label_bar(draw, x, y, w, text):
    draw.rectangle([x, y, x + w, y + 34], fill=(20, 20, 24))
    draw.text((x + 10, y + 8), text, fill=(240, 236, 230))

for name, tp, jp, title in PAIRS:
    if not (os.path.exists(tp) and os.path.exists(jp)):
        print("MISSING", name); continue
    t = load_scaled(tp); j = load_scaled(jp)
    H = max(t.height, j.height) + 40
    canvas = Image.new("RGB", (PANEL_W * 2 + GAP, H), (200, 200, 200))
    d = ImageDraw.Draw(canvas)
    canvas.paste(t, (0, 40)); canvas.paste(j, (PANEL_W + GAP, 40))
    label_bar(d, 0, 0, PANEL_W, "TINHOLT — " + title.split(" ↔ ")[0])
    label_bar(d, PANEL_W + GAP, 0, PANEL_W, "JARL — " + title.split(" ↔ ")[1])
    out = f"{OUT}/pair-{name}.png"
    canvas.save(out, optimize=True)
    print("wrote", out, canvas.size)

# ---- filmstrip of tonal strips ----
COLORS = {"LIGHT": (235, 228, 222), "DARK": (24, 36, 58), "MEDIA": (196, 106, 74)}
tin = json.load(open(f"{SP}/epic13/tinholt-tristrips.json"))
jar = json.load(open(f"{SP}/epic13/jarl-tristrips.json"))
SMAP = [
    ("hjem", "home", "hjem"),
    ("prosjekter", "eiendommer", "prosjekter"),
    ("om", "om-oss", "om"),
    ("kontakt", "kontakt", "kontakt"),
    ("prosjektside", "detalj-leilighet", "project-barkpark"),
    ("notater", "personvern", "notater"),
]
STRIP_W, SH, PAD, TOP = 70, 700, 36, 60
W = len(SMAP) * (STRIP_W * 2 + 14 + PAD) + PAD
img = Image.new("RGB", (W, SH + TOP + 40), (245, 243, 240))
d = ImageDraw.Draw(img)
d.text((PAD, 10), "TONAL FILMSTRIP — each pair: tinholt (left) vs jarl (right), full scroll normalized. orange = MEDIA, navy = dark ground, greige = light ground", fill=(20, 20, 24))
x = PAD
for name, tk, jk in SMAP:
    for k, src, dx in ((tk, tin, 0), (jk, jar, STRIP_W + 14)):
        if k not in src: continue
        s = src[k]; h = s["h"]
        for b in s["bands"]:
            y0 = TOP + int(b["start"] / h * SH); y1 = TOP + max(y0 + 1, int(b["end"] / h * SH))
            d.rectangle([x + dx, y0, x + dx + STRIP_W, y1], fill=COLORS[b["label"]])
        d.rectangle([x + dx, TOP, x + dx + STRIP_W, TOP + SH], outline=(120, 120, 120))
    d.text((x, TOP + SH + 8), name, fill=(20, 20, 24))
    d.text((x, TOP - 18), "T      J", fill=(90, 90, 90))
    x += STRIP_W * 2 + 14 + PAD
img.save(f"{OUT}/filmstrip-tonal.png", optimize=True)
print("wrote filmstrip", img.size)
