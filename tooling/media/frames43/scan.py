#!/usr/bin/env python3
"""Scan a cast on the RAW event clock (same clock castframe.truncate uses)
and report when a key string first appears / screen around a chosen T."""
import json, sys, os
sys.path.insert(0, os.path.expanduser(
    "/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/epic9frames"))
from castframe import load, dims
import pyte

def screens(path):
    head, evs = load(path)  # absolute raw times
    c, r = dims(head)
    screen = pyte.Screen(c, r)
    stream = pyte.Stream(screen)
    for t, kind, data in evs:
        if kind == "o":
            stream.feed(data)
            yield t, screen, c, r

def find(path, needle):
    hits = []
    for t, screen, c, r in screens(path):
        txt = "\n".join(screen.display)
        if needle in txt:
            hits.append(t)
    if hits:
        print(f"{os.path.basename(path)}: '{needle}' on screen raw t={hits[0]:.2f} .. {hits[-1]:.2f}")
    else:
        print(f"{os.path.basename(path)}: '{needle}' NOT FOUND")

def show(path, T):
    last = None
    for t, screen, c, r in screens(path):
        if t > T:
            break
        last = screen
    lines = [l.rstrip() for l in last.display]
    print(f"# {os.path.basename(path)} raw T={T}  ({sum(1 for l in lines if l.strip())}/{len(lines)} rows filled)")
    for i, l in enumerate(lines):
        print(f"{i:3} |{l}")

if __name__ == "__main__":
    if sys.argv[1] == "find":
        find(sys.argv[2], sys.argv[3])
    else:
        show(sys.argv[2], float(sys.argv[3]))
