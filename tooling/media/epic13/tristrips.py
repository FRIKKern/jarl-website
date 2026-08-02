#!/usr/bin/env python3
"""Tri-class tonal strips: per row of a full-page screenshot classify
LIGHT ground / DARK ground / MEDIA (photographic or rich visual matter).

Method: quantize the whole image to find dominant flat 'ground' colors
(covering >2.5% of pixels). Per row, sample 33 columns across the central 92%.
Row = ground if >=60% of samples sit within tolerance of a ground color;
label light/dark by that ground's luminance. Otherwise MEDIA.
"""
import sys, json
from collections import Counter
from PIL import Image

def luminance(c):
    r, g, b = [x / 255 for x in c[:3]]
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def analyze(path, step=6, ncols=33, tol=28):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    small = im.resize((max(1, w // 8), max(1, h // 8)))
    cnt = Counter(small.getdata())
    total = small.size[0] * small.size[1]
    # cluster top colors greedily
    grounds = []
    for c, n in cnt.most_common(400):
        if n / total < 0.004: break
        merged = False
        for g in grounds:
            if sum((a - b) ** 2 for a, b in zip(c, g["c"])) < 1200:
                g["n"] += n; merged = True; break
        if not merged:
            grounds.append({"c": c, "n": n})
    grounds = [g for g in grounds if g["n"] / total > 0.025]
    xs = [int(w * 0.04 + i * (w * 0.92) / (ncols - 1)) for i in range(ncols)]
    rows = []
    for y in range(0, h, step):
        gcount = Counter()
        other = 0
        for x in xs:
            px = im.getpixel((x, y))
            best, bd = None, 1e9
            for gi, g in enumerate(grounds):
                d = sum((a - b) ** 2 for a, b in zip(px, g["c"]))
                if d < bd: bd, best = d, gi
            if bd <= tol * tol * 3:
                gcount[best] += 1
            else:
                other += 1
        if other / ncols > 0.40:
            rows.append("MEDIA")
        else:
            gi = gcount.most_common(1)[0][0]
            rows.append("LIGHT" if luminance(grounds[gi]["c"]) > 0.45 else "DARK")
    # run-length encode; merge runs < 30px into neighbor
    bands = []
    for i, lab in enumerate(rows):
        y = i * step
        if bands and bands[-1]["label"] == lab:
            bands[-1]["end"] = y + step
        else:
            bands.append({"label": lab, "start": y, "end": y + step})
    merged = []
    for b in bands:
        if merged and (b["end"] - b["start"]) < 30:
            merged[-1]["end"] = b["end"]
        elif merged and merged[-1]["label"] == b["label"]:
            merged[-1]["end"] = b["end"]
        else:
            merged.append(dict(b))
    out = []
    for b in merged:
        if out and out[-1]["label"] == b["label"]:
            out[-1]["end"] = b["end"]
        else:
            out.append(b)
    shares = Counter()
    for b in out:
        shares[b["label"]] += b["end"] - b["start"]
    tot = sum(shares.values())
    return {
        "w": w, "h": h,
        "grounds": [{"c": "#%02x%02x%02x" % g["c"], "share": round(g["n"] / total, 3)} for g in grounds],
        "shares": {k: round(v / tot, 3) for k, v in shares.items()},
        "bands": out,
        "sequence": " → ".join(f'{b["label"]}({b["end"]-b["start"]})' for b in out),
    }

if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    res = {}
    for name, path in spec.items():
        try:
            res[name] = analyze(path)
            s = res[name]
            print(f'{name}: h={s["h"]} shares={s["shares"]} bands={len(s["bands"])}')
        except Exception as e:
            print("FAIL", name, e)
    json.dump(res, open(sys.argv[2], "w"), indent=1)
