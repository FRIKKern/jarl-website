#!/usr/bin/env python3
"""Render a cast frame at high res, crop a (col,row) window, emit final + card preview."""
import sys, json, subprocess, tempfile, os
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from castframe import truncate

FS = 32  # agg font size -> char adv 19.66px, row 46.27px


def render(cast, T, theme="asciinema"):
    tmp = tempfile.mktemp(suffix=".cast")
    gif = tempfile.mktemp(suffix=".gif")
    truncate(cast, T, tmp)
    r = subprocess.run(["agg", "--theme", theme, "--font-size", str(FS),
                        "--idle-time-limit", "0.05", "--speed", "50", "--fps-cap", "5",
                        "--last-frame-duration", "2", tmp, gif],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:], file=sys.stderr); sys.exit(1)
    im = Image.open(gif)
    im.seek(getattr(im, "n_frames", 1) - 1)
    return im.convert("RGB")


def grid(im, cols, rows):
    """agg pads 2*? — derive char box from image size and terminal dims."""
    return im.width / cols, im.height / rows


def main():
    cast, T, cols, rows, c0, r0, nc, nr, out = sys.argv[1:10]
    T = float(T); cols = int(cols); rows = int(rows)
    c0, r0, nc, nr = int(c0), int(r0), int(nc), int(nr)
    theme = sys.argv[10] if len(sys.argv) > 10 else "asciinema"
    im = render(cast, T, theme)
    cw, ch = grid(im, cols, rows)
    box = (round(c0 * cw), round(r0 * ch), round((c0 + nc) * cw), round((r0 + nr) * ch))
    crop = im.crop(box)
    # pad a small margin of terminal background so text does not touch the edge
    bg = crop.getpixel((crop.width - 3, crop.height - 3))
    pad = round(cw * 0.6)
    canvas = Image.new("RGB", (crop.width + 2 * pad, crop.height + 2 * pad), bg)
    canvas.paste(crop, (pad, pad))
    # scale to ~1440 wide, then letterbox/trim to 2.46:1 exactly
    target_w = 1440
    scale = target_w / canvas.width
    canvas = canvas.resize((target_w, round(canvas.height * scale)), Image.LANCZOS)
    final_h = round(target_w / 2.4565)
    if canvas.height > final_h:
        top = (canvas.height - final_h) // 2
        canvas = canvas.crop((0, top, target_w, top + final_h))
    elif canvas.height < final_h:
        c2 = Image.new("RGB", (target_w, final_h), bg)
        c2.paste(canvas, (0, (final_h - canvas.height) // 2))
        canvas = c2
    canvas.save(out)
    canvas.resize((339, 138), Image.LANCZOS).save(out.replace(".png", "-card339.png"))
    print(f"{out} {canvas.size}  chars_across={nc + 1.2:.0f}  card_px_per_char={339/(nc+1.2):.2f}")


if __name__ == "__main__":
    main()
