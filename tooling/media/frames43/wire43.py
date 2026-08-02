#!/usr/bin/env python3
"""Upload the 4:3 terminal recompositions, stamp altText+kilde caption, patch project docs, publish."""
import json, subprocess, sys

BASE = "https://jarl.barkpark.cloud"
TOKEN = open("/tmp/jarl_admin_token").read().strip()
DIR = "/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/frames43"

ITEMS = [
    dict(
        doc="project-scaffy",
        file="scaffy-kvittering-4x3-2026-07-31.png",
        alt="Terminalbilde fra et Scaffy-opptak: kvitteringen for angrekommandoen, med «kind: create», "
            "«path: docs/cards/wavecheck.md» og «status: deleted» i fargelagt JSON, etterfulgt av et "
            "tomt «git status --short».",
        cap="Kilde: opptaket scaffy-run-remove.cast, tatt opp 31. juli 2026, ca. 0:57, rekomponert til "
            "4:3 — Scaffy kjørt mot et eget arbeidstre av barkpark @ c885672. Samme kommando og samme "
            "variabler som la inn jobben, tar den ut igjen, og treet er byterent etterpå.",
    ),
    dict(
        doc="project-nextgen",
        file="nextgen-filstruktur-4x3-2026-07-31.png",
        alt="Terminalbilde fra et Nextgen-opptak: kommandolisten fra «ng list-all» øverst, og filtreet "
            "«Files Created» som kommandoen nettopp skrev — app/(products-route) med product/page.tsx, "
            "products/page.tsx, products/[slug]/page.tsx, not-found.tsx og products-data.json.",
        cap="Kilde: opptaket nextgen-cli-scaffold.cast, tatt opp 31. juli 2026, ca. 0:28, rekomponert "
            "til 4:3 — NextGen Go CLI v1.0.147. Én kommando skriver hele slug-ruten for Next.js App "
            "Router, både entall og flertall.",
    ),
    dict(
        doc="project-bulldocs",
        file="bulldocs-paper-i-terminal-4x3-2026-07-31.png",
        alt="Terminalbilde fra et bp-opptak: Bulldocs-dokumenter satt opp i terminalen — overskriften "
            "«WELCOME TO BARKPARK» med linjal under, brødtekst om at papers bor i Bulldocs-pluginen, "
            "kommandoblokken med farget venstremarg, og starten på produktplanen «DEPLOY WITH "
            "BARKPARK» under.",
        cap="Kilde: opptaket bp-paper-view.cast, tatt opp 31. juli 2026, ca. 0:12, rekomponert til 4:3 "
            "— bp mot guerrilla.barkpark.cloud. Det er det samme dokumentet som ligger på "
            "/papers/welcome, satt opp i ANSI av «bp paper view» uten noe eksportsteg.",
    ),
    dict(
        doc="project-barkpark",
        file="barkpark-oppgavetavle-4x3-2026-07-31.png",
        alt="Terminalbilde fra et bp-opptak: den levende oppgavetavla — oppgaver med avkryssede "
            "akseptansekriterier, kriteriene W1–W5 for oppgaven i fokus, en framdriftslinje, og "
            "telleverket «13 in flight · 65+ ready · 2621 done · 63%».",
        cap="Kilde: opptaket bp-tasks-board.cast, tatt opp 31. juli 2026, ca. 0:08, rekomponert til "
            "4:3 — «bp tasks» mot en levende hovedbok med 4382 oppgaver på guerrilla.barkpark.cloud. "
            "Tallene i statuslinja er tavlas egne, ikke satt for bildet.",
    ),
]

results = []
for it in ITEMS:
    up = subprocess.run(
        ["curl", "-sS", "-X", "POST", f"{BASE}/media/upload",
         "-H", f"Authorization: Bearer {TOKEN}",
         "-F", f"file=@{DIR}/{it['file']}", "-F", "dataset=production"],
        capture_output=True, text=True)
    resp = json.loads(up.stdout)
    fid = resp.get("id") or resp.get("_id")
    url = resp.get("url") or resp.get("path")
    if not fid or not url:
        print("UPLOAD FAILED", it["doc"], up.stdout[:400]); sys.exit(1)

    meta = subprocess.run(
        ["curl", "-sS", "-X", "PATCH", f"{BASE}/v1/media/production/{fid}",
         "-H", f"Authorization: Bearer {TOKEN}", "-H", "Content-Type: application/json",
         "-d", json.dumps({"altText": it["alt"], "caption": it["cap"]}, ensure_ascii=False)],
        capture_output=True, text=True)
    meta_ok = '"error"' not in meta.stdout

    img = {"src": url, "width": 1440, "height": 1080, "alt": it["alt"], "caption": it["cap"]}
    p = subprocess.run(["bp", "-s", BASE, "--token", TOKEN, "--yes", "doc", "patch", "project",
                        it["doc"], "--set", "image:=" + json.dumps(img, ensure_ascii=False)],
                       capture_output=True, text=True, stdin=subprocess.DEVNULL)
    pub = subprocess.run(["bp", "-s", BASE, "--token", TOKEN, "--yes", "doc", "publish", "project",
                          it["doc"]],
                         capture_output=True, text=True, stdin=subprocess.DEVNULL)
    ok = meta_ok and p.returncode == 0 and pub.returncode == 0
    print(f"{it['doc']:22s} upload={fid} meta={'ok' if meta_ok else 'FAIL'} "
          f"patch={p.returncode} publish={pub.returncode}  {url}")
    if not ok:
        print("   ", (meta.stdout + p.stdout + p.stderr + pub.stdout + pub.stderr)[:400])
    results.append({"doc": it["doc"], "id": fid, "url": url})

json.dump(results, open(f"{DIR}/wired.json", "w"), indent=1)
