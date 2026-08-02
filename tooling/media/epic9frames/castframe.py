#!/usr/bin/env python3
"""Cast tools: outline (what's on screen when) and frame (PNG still at time T)."""
import json, sys, os, re, subprocess, tempfile

def load(path):
    with open(path) as f:
        head = json.loads(f.readline())
        evs = []
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                evs.append(json.loads(line))
            except Exception:
                pass
    ver = head.get("version", 2)
    out = []
    t = 0.0
    for e in evs:
        if ver >= 3:
            t += e[0]
            out.append([t, e[1], e[2]])
        else:
            out.append([e[0], e[1], e[2]])
    return head, out

ANSI = re.compile(r"\x1b\[[0-9;?]*[a-zA-Z]|\x1b\][^\x07\x1b]*(\x07|\x1b\\)|\x1b[()][AB012]|\x1b[=>M78]")

def dims(head):
    t = head.get("term")
    if t:
        return t["cols"], t["rows"]
    return head.get("width", 80), head.get("height", 24)

def outline(path, step=1.0):
    head, evs = load(path)
    c, r = dims(head)
    print(f"# {os.path.basename(path)} cols={c} rows={r} dur={evs[-1][0]:.1f}s")
    buf = []
    nextmark = 0.0
    for t, kind, data in evs:
        if kind != "o":
            continue
        buf.append(data)
        if t >= nextmark:
            txt = ANSI.sub("", "".join(buf))
            txt = txt.replace("\r", "\n")
            lines = [l.rstrip() for l in txt.split("\n") if l.strip()]
            print(f"\n--- t={t:6.2f} ---")
            for l in lines[-8:]:
                print("   ", l[:115])
            buf = []
            nextmark = t + step

def truncate(path, T, outpath):
    head, evs = load(path)
    c, r = dims(head)
    kept = [e for e in evs if e[0] <= T and e[1] == "o"]
    with open(outpath, "w") as f:
        h = {"version": 2, "width": c, "height": r, "idle_time_limit": 0.05}
        f.write(json.dumps(h) + "\n")
        for t, kind, data in kept:
            f.write(json.dumps([t, kind, data]) + "\n")
    return kept[-1][0] if kept else 0.0

def frame(path, T, png, theme="asciinema", font_size=16):
    tmp = tempfile.mktemp(suffix=".cast")
    gif = tempfile.mktemp(suffix=".gif")
    last = truncate(path, T, tmp)
    cmd = ["agg", "--theme", theme, "--font-size", str(font_size),
           "--idle-time-limit", "0.05", "--speed", "50", "--fps-cap", "5",
           "--last-frame-duration", "2", tmp, gif]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("agg failed:", r.stderr[-3000:], file=sys.stderr)
        sys.exit(1)
    from PIL import Image
    im = Image.open(gif)
    n = getattr(im, "n_frames", 1)
    im.seek(n - 1)
    im.convert("RGB").save(png)
    print(f"{png}  last_event_t={last:.2f}  frames={n}  size={Image.open(png).size}")

if __name__ == "__main__":
    if sys.argv[1] == "outline":
        outline(sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 1.0)
    else:
        frame(sys.argv[2], float(sys.argv[3]), sys.argv[4],
              theme=sys.argv[5] if len(sys.argv) > 5 else "asciinema",
              font_size=int(sys.argv[6]) if len(sys.argv) > 6 else 16)
