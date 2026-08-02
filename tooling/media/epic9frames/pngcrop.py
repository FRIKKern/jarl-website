#!/usr/bin/env python3
"""Crop a PNG to a deliberate 2.4565:1 window and emit final + 339px card preview."""
import sys
from PIL import Image

src, x0, y0, w, h, out = sys.argv[1], *[int(v) for v in sys.argv[2:6]], sys.argv[6]
im = Image.open(src).convert("RGB")
crop = im.crop((x0, y0, x0 + w, y0 + h))
target_w = 1440
final_h = round(target_w / 2.4565)
crop = crop.resize((target_w, round(crop.height * target_w / crop.width)), Image.LANCZOS)
if crop.height > final_h:
    t = (crop.height - final_h) // 2
    crop = crop.crop((0, t, target_w, t + final_h))
elif crop.height < final_h:
    bg = crop.getpixel((2, 2))
    c2 = Image.new("RGB", (target_w, final_h), bg)
    c2.paste(crop, (0, (final_h - crop.height) // 2))
    crop = c2
crop.save(out)
crop.resize((339, 138), Image.LANCZOS).save(out.replace(".png", "-card339.png"))
print(out, crop.size, "src_ratio", round(w / h, 2))
