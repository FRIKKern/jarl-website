# tooling/media — the Epic-13 media pipeline, rescued from a scratchpad

Every capture on jarl.no was made by these scripts, and until 2026-08-02 all of
them lived in one session scratchpad under `/private/tmp`. A `/private/tmp`
directory is not storage: it survives at the pleasure of the OS, and the
recording that proves a claim is worth nothing if the program that made it is
gone. So the code came here. The rendered frames did not — a PNG is
reproducible output, and ~90 MB of binaries in a source tree buys nothing that
re-running the pipeline does not buy again.

`RECOVERY.json` carries a sha256 for every file and the scratchpad path it came
from; 45 of 45 were byte-identical at recovery time. One rename: the cast
pipeline's `manifest.json` became `cast-manifest.json`, because a
case-insensitive filesystem cannot hold it next to a `MANIFEST.json`.

## What each part does

| Path | Makes |
|---|---|
| `driver.sh` + `demo-*.cmds` | The typed-terminal recordings. A `.cmds` file is narration lines (`# …`, printed) and command lines (typed at 22 ms/char, then run for real with `bash -c`). **Nothing in a cast is faked** — every byte of output is the live output of the command. |
| `shot-*.mjs` | Playwright stills of Studio, the cloud login, Galleryspace, Full Blast. |
| `epic9frames/` | Cast → PNG. `castframe.py` replays an asciicast to a frame, `crop.py`/`pngcrop.py` trim it, `wire.py`/`patch_paper.py` push the result into the CMS. |
| `frames43/` | The 4:3 recompose. `compose43.py` is the one that measures — its ADV/LH/PX/PY metrics were taken at **100×30 cast dimensions**, not the doctrine's 80×24. The doctrine is wrong on this point; the numbers are right. `wire43*.py` wires the composed frames back. |
| `recrop/` | Client-site captures re-cropped to the card ratio: `shot*.mjs` shoots, `crop.py`/`gen.py`/`final.py` cut, `upload.py`/`apply_docs.py`/`apply_meta.py` publish. |
| `epic13/` | The jarl.no capture rig itself — `capture-jarl.mjs` (the ancestor of `scripts/capture-jarl.mjs`), plus `composite.py`/`tristrips.py` and the `*-spec.json` layout descriptions. |

## Running any of it

The Python parts want Pillow. The upload/patch parts want an admin token at
`/tmp/jarl_admin_token` and hit `https://jarl.barkpark.cloud` — a patch mutation
requires `type` alongside `id`, or the API answers 400 `malformed`.

The living rig is `scripts/capture-jarl.mjs`, not `epic13/capture-jarl.mjs`. The
copy here is the record of what was proven on 2026-08-02; the one in `scripts/`
is the one the gate runs.
