#!/usr/bin/env python3
"""Recompose a cast moment at 4:3 (1440x1080).

Usage: compose43.py <cast> <T> <cols> <rows> <c0> <r0> <nc> <nr> <out.png> [tight|plate]
Renders with agg (same renderer/theme as the accepted 1440x586 stills),
crops the (c0,r0,nc,nr) char window, then:
  tight: window scaled to 1440 wide, letterboxed with the terminal's own bg to 1080.
  plate: window scaled into a box on the site navy #18243a with even margins.
Also writes *-card340.png (340x255) for card-size judgement.
"""
import sys, os
sys.path.insert(0, "/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/epic9frames")
from crop import render, grid
from PIL import Image

NAVY = (0x18, 0x24, 0x3A)
W, H = 1440, 1080

def main():
    cast, T, cols, rows, c0, r0, nc, nr, out = sys.argv[1:10]
    mode = sys.argv[10] if len(sys.argv) > 10 else "tight"
    T = float(T)
    cols, rows, c0, r0, nc, nr = map(int, (cols, rows, c0, r0, nc, nr))
    im = render(cast, T)
    # true agg metrics at fs32, measured from 100x30 vs 110x42 renders:
    # char advance 19.3, line height 44.75, outer padding 17.5 x / 23.25 y
    ADV, LH, PX, PY = 19.3, 44.75, 17.5, 23.25
    cw, ch = ADV, LH
    box = (round(PX + c0 * ADV), round(PY + r0 * LH) + 2,
           round(PX + (c0 + nc) * ADV), round(PY + (r0 + nr) * LH) - 2)
    crop = im.crop(box)
    bg = crop.getpixel((crop.width - 3, crop.height - 3))
    # small terminal-bg breathing margin so glyphs never touch the edge
    pad = round(cw * 0.7)
    inner = Image.new("RGB", (crop.width + 2 * pad, crop.height + 2 * pad), bg)
    inner.paste(crop, (pad, pad))

    if mode == "tight":
        s = W / inner.width
        scaled = inner.resize((W, round(inner.height * s)), Image.LANCZOS)
        canvas = Image.new("RGB", (W, H), bg)
        if scaled.height >= H:
            top = (scaled.height - H) // 2
            canvas = scaled.crop((0, top, W, top + H))
        else:
            canvas.paste(scaled, (0, (H - scaled.height) // 2))
    else:  # plate
        margin = 72
        bw, bh = W - 2 * margin, H - 2 * margin
        s = min(bw / inner.width, bh / inner.height)
        scaled = inner.resize((round(inner.width * s), round(inner.height * s)), Image.LANCZOS)
        canvas = Image.new("RGB", (W, H), NAVY)
        canvas.paste(scaled, ((W - scaled.width) // 2, (H - scaled.height) // 2))

    canvas.save(out)
    canvas.resize((340, 255), Image.LANCZOS).save(out.replace(".png", "-card340.png"))
    canvas.resize((240, 180), Image.LANCZOS).save(out.replace(".png", "-card240.png"))
    win_aspect = (nc * cw + 2 * pad) / (nr * ch + 2 * pad)
    print(f"{out} mode={mode} window={nc}x{nr}ch aspect={win_aspect:.3f} "
          f"card_px_per_char={340 * (W / (nc * cw + 2 * pad)) * cw / W:.2f}")

if __name__ == "__main__":
    main()
