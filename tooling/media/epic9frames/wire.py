#!/usr/bin/env python3
"""Wire the four cast/screenshot frames onto their project docs: asset metadata, patch, publish."""
import json, subprocess, sys

TOKEN = open("/tmp/jarl_admin_token").read().strip()
BASE = ["bp", "-s", "jarl", "--token", TOKEN, "--yes"]

ITEMS = [
    dict(
        project="project-scaffy",
        asset="151c3962-3b22-4a13-a220-6241bb8deb78",
        src="/media/files/2026/07/scaffy-kvittering-2026-07-31-26aa7d09.png",
        alt="Terminalbilde fra et Scaffy-opptak: kvitteringen for angrekommandoen, med «kind: create», "
            "«path: docs/cards/wavecheck.md» og «status: deleted» i fargelagt JSON, etterfulgt av et "
            "tomt «git status --short».",
        caption="Kilde: opptaket scaffy-run-remove.cast, 31. juli 2026, ca. 0:57 — Scaffy kjørt mot et "
                "eget arbeidstre av barkpark @ c885672. Samme kommando og samme variabler som la inn "
                "jobben, tar den ut igjen, og treet er byterent etterpå.",
    ),
    dict(
        project="project-nextgen",
        asset="6a141bb0-de79-403d-836e-1deee97efc73",
        src="/media/files/2026/07/nextgen-filstruktur-2026-07-31-dc8cf1b2.png",
        alt="Terminalbilde fra et Nextgen-opptak: filtreet «Files Created» som kommandoen nettopp skrev "
            "— app/(products-route) med product/page.tsx, products/page.tsx, products/[slug]/page.tsx, "
            "not-found.tsx og products-data.json.",
        caption="Kilde: opptaket nextgen-cli-scaffold.cast, 31. juli 2026, ca. 0:28 — NextGen Go CLI "
                "v1.0.147. Én kommando skriver hele slug-ruten for Next.js App Router, både entall og "
                "flertall.",
    ),
    dict(
        project="project-bulldocs",
        asset="eb355607-cf1b-4a52-b507-4e447cb882cb",
        src="/media/files/2026/07/bulldocs-paper-i-terminal-2026-07-31-a92b7231.png",
        alt="Terminalbilde fra et bp-opptak: et Bulldocs-dokument satt opp i terminalen — overskriften "
            "«WELCOME TO BARKPARK» med linjal under, brødtekst som forklarer at papers bor i "
            "Bulldocs-pluginen, og en kommandoblokk med farget venstremarg.",
        caption="Kilde: opptaket bp-paper-view.cast, 31. juli 2026, ca. 0:12 — bp mot "
                "guerrilla.barkpark.cloud. Det er det samme dokumentet som ligger på /papers/welcome, "
                "satt opp i ANSI av «bp paper view» uten noe eksportsteg.",
    ),
    dict(
        project="project-barkpark",
        asset="de89cc75-a0ec-4c11-8ede-3d777376ea54",
        src="/media/files/2026/07/barkpark-oppgavetavle-2026-07-31-bcd359d6.png",
        alt="Terminalbilde fra et bp-opptak: bunnen av den levende oppgavetavla — oppgaver med "
            "avkryssede akseptansekriterier, en framdriftslinje, og telleverket «13 in flight · "
            "65+ ready · 2621 done · 63%».",
        caption="Kilde: opptaket bp-tasks-board.cast, 31. juli 2026, ca. 0:08 — «bp tasks» mot en levende "
                "hovedbok med 4382 oppgaver på guerrilla.barkpark.cloud. Tallene i statuslinja er "
                "tavlas egne, ikke satt for bildet.",
    ),
]


def run(args, label):
    r = subprocess.run(BASE + args, capture_output=True, text=True)
    ok = r.returncode == 0 and '"error"' not in r.stdout
    print(f"  {'ok ' if ok else 'FAIL'} {label}: {(r.stdout or r.stderr).strip()[:220]}")
    return ok


for it in ITEMS:
    print(f"### {it['project']}")
    run(["media", "update", it["asset"],
         "--set", f"altText={it['alt']}", "--set", f"caption={it['caption']}"],
        "asset metadata")
    image = {"src": it["src"], "alt": it["alt"], "width": 1440, "height": 586,
             "caption": it["caption"]}
    run(["doc", "patch", "project", it["project"], "--set", "image:=" + json.dumps(image, ensure_ascii=False)],
        "patch image")
    run(["doc", "publish", "project", it["project"]], "publish")
