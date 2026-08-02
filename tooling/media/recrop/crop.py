#!/usr/bin/env python3
"""Epic 11c — source-side 4:3 recrops. Crop windows chosen by eye from the
2880x1800 retina originals; every window is exactly 4:3."""
import sys
from PIL import Image

BASE = "/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad"
SRC = f"{BASE}/media/sites"
OUT = f"{BASE}/recrop"

# name -> (source path, (left, top, right, bottom), output size)
WINDOWS = {
    "akerbrygge": (f"{SRC}/akerbrygge.png", (420, 150, 2620, 1800), (1440, 1080)),
    "gyldendal": (f"{SRC}/gyldendal.png", (500, 180, 2660, 1800), (1440, 1080)),
    "hundesteder": (f"{SRC}/hundesteder.png", (190, 0, 2590, 1800), (1440, 1080)),
    "lunnheim": (f"{SRC}/lunnheim.png", (500, 0, 2880, 1785), (1440, 1080)),
    "oslobukta": (f"{SRC}/oslobukta.png", (0, 370, 1440, 1450), (1440, 1080)),
    "kronprinsparetsfond": (f"{SRC}/kronprinsparetsfond.png", (0, 200, 1933, 1650), (1440, 1080)),
    "aquatiq": (f"{SRC}/aquatiq.png", (0, 0, 2400, 1800), (1440, 1080)),
    "aquatiq-alt": (f"{SRC}/aquatiq.png", (0, 140, 2185, 1779), (1440, 1080)),
    "galleryspace": (f"{BASE}/media/galleryspace-home.png", (364, 0, 1440, 807), (1076, 807)),
}

names = sys.argv[1:] or list(WINDOWS)
for name in names:
    src, box, size = WINDOWS[name]
    im = Image.open(src).convert("RGB")
    w, h = box[2] - box[0], box[3] - box[1]
    assert abs(w / h - 4 / 3) < 0.005, f"{name}: {w}x{h} not 4:3"
    crop = im.crop(box)
    full = crop.resize(size, Image.LANCZOS)
    full.save(f"{OUT}/{name}-full.jpg", quality=85, optimize=True)
    card = crop.resize((340, 255), Image.LANCZOS)
    card.save(f"{OUT}/{name}-card.png")
    print(name, "window", box, "->", size)
