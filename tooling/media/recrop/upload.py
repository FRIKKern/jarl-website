#!/usr/bin/env python3
"""Upload the 4:3 recrops to the jarl media library and stamp altText + kilde caption."""
import json, subprocess, sys

BASE = "https://jarl.barkpark.cloud"
TOKEN = open("/tmp/jarl_admin_token").read().strip()
DIR = "/private/tmp/claude-501/-Users-frikkjarl-Documents-GitHub/2938d290-edae-40dd-bce3-1286cec080a8/scratchpad/recrop/upload"

META = {
    "akerbrygge": {
        "altText": "Utsnitt av forsiden til akerbrygge.no: en hånd som holder en kaffekopp fra Mendel's Paris, ved siden av overskriften «Et lite stykke Paris har åpnet på brygga» og knappen «Les mer her».",
        "caption": "Skjermbilde av https://www.akerbrygge.no, fanget 31. juli 2026 — hovedsaken på forsiden, beskåret til 4:3.",
    },
    "gyldendal": {
        "altText": "Utsnitt av forsiden til gyldendal.no: to redaksjonelle kort — «Fotballfeber» med bøker for fotballentusiaster og «Pocketbøker til feriekofferten» med sommerens lesetips.",
        "caption": "Skjermbilde av https://www.gyldendal.no, fanget 31. juli 2026 — kortraden på forsiden, beskåret til 4:3.",
    },
    "hundesteder": {
        "altText": "Utsnitt av forsiden til hundesteder.no: overskriften «Hundevennlige steder», søkefelt og filtre til venstre, og treffkortene for Mocca Oslo og Crow Bar & Brewery med åpningstider og adresse.",
        "caption": "Skjermbilde av https://hundesteder.no, fanget 31. juli 2026 — søket og de første treffene, beskåret til 4:3.",
    },
    "lunnheim": {
        "altText": "Utsnitt av forsiden til lunnheim.com: menylinjen med LUNNHEIM-navnet øverst, en mann som sitter tilbakelent i en lenestol med oransje sete og leser et blad, og kategorilinjen under.",
        "caption": "Skjermbilde av https://lunnheim.com, fanget 31. juli 2026 — toppen av forsiden, beskåret til 4:3.",
    },
    "oslobukta": {
        "altText": "Utsnitt av forsiden til oslobukta.no: matbildet fra toppsaken — blåskjell, tartar i glasskål og et hvitvinsglass på et solbelyst restaurantbord.",
        "caption": "Skjermbilde av https://www.oslobukta.no, fanget 31. juli 2026 — matbildet i toppsaken på forsiden, beskåret til 4:3.",
    },
    "kronprinsparetsfond": {
        "altText": "Utsnitt av forsiden til kronprinsparetsfond.no: sitatet «Kronprinsparets Fond skal styrke fellesskapet for unge mennesker, slik at alle føler tilhørighet og kan delta» over tre personer på en scene foran en skjerm med fondets hjertelogo.",
        "caption": "Skjermbilde av https://kronprinsparetsfond.no, fanget 31. juli 2026 — helsidesbildet på forsiden, beskåret til 4:3.",
    },
    "aquatiq": {
        "altText": "Utsnitt av forsiden til aquatiq.com: overskriften «Food Safety Experts», spørsmålet «Hvordan kan vi hjelpe deg?» og en rad bildekort for kjemi, kurs, analyse og rengjøringssystemer.",
        "caption": "Skjermbilde av https://www.aquatiq.com, fanget 31. juli 2026 — toppen av forsiden med kategoriraden, beskåret til 4:3.",
    },
    "galleryspace": {
        "altText": "Utsnitt av Galleryspace-forsiden: to malerier av Oda Nerdrøm i lyse passepartouter — «Morgen ved klippen» og «Selvportrett med stav» — med tittel, mål og galleri under.",
        "caption": "Skjermbilde av Galleryspace kjørt lokalt mot den levende basen, fanget 31. juli 2026 — verksrutenettet på forsiden, beskåret til 4:3.",
    },
}

results = {}
for key, meta in META.items():
    path = f"{DIR}/{key}-forside-2026-07-31-43.jpg"
    up = subprocess.run(
        ["curl", "-sS", "-X", "POST", f"{BASE}/media/upload",
         "-H", f"Authorization: Bearer {TOKEN}",
         "-F", f"file=@{path}", "-F", "dataset=production"],
        capture_output=True, text=True)
    resp = json.loads(up.stdout)
    fid = resp.get("id") or resp.get("_id")
    url = resp.get("url") or resp.get("path")
    if not fid:
        print("UPLOAD FAILED", key, up.stdout[:400]); sys.exit(1)
    patch = subprocess.run(
        ["curl", "-sS", "-X", "PATCH", f"{BASE}/v1/media/production/{fid}",
         "-H", f"Authorization: Bearer {TOKEN}",
         "-H", "Content-Type: application/json",
         "-d", json.dumps(meta)],
        capture_output=True, text=True)
    ok = '"result"' in patch.stdout
    results[key] = {"id": fid, "url": url, "meta_ok": ok}
    print(key, fid, url, "meta:", "ok" if ok else patch.stdout[:200])

json.dump(results, open(f"{DIR}/../uploaded.json", "w"), indent=2)
