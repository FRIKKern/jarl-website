#!/usr/bin/env node
/**
 * Fabrication fence — 23 sentences that may not be rewritten.
 *
 * Every claim in this register is a fact about who did what: who led, who was
 * second, whose commits those were, what the counts actually are. They were
 * verified once against git history and the people involved, and an agent
 * rewriting a post for rhythm is exactly the kind of edit that would round
 * "omtrent hver tredje endring" up to "halvparten" without noticing it had
 * lied about a colleague. So the sentences are pinned as EXACT substrings,
 * diacritics and all, and this gate refuses the day one of them moves.
 *
 * SOURCE OF TRUTH IS THE CMS API, NOT THE LIVE PAGE. jarl.no answers
 * `s-maxage=60, stale-while-revalidate=31535940` and serves `x-nextjs-cache:
 * STALE` even against a cache-busted query string — a post-write gate that
 * curls the page can grade the render from before the edit. The API is
 * ISR-immune, so it decides; the live page is polled as a second, laggy
 * witness that can only WARN (lag) — never fail.
 *
 * BOTH STORES, ALWAYS. Six of the 23 live in a `paper` (story) document and
 * four of those are duplicated into the `project` document as well. A
 * project-only gate reads 2/23 as drift that is not drift, and a paper-only
 * gate misses the other seventeen. Each slug is checked against its project
 * doc, its linked story paper, and — as a last resort that is reported by
 * name — the rest of the paper store, because a sentence that migrated to
 * another document is still present but is no longer where it was pinned.
 *
 * The register is canonical in
 * barkpark/tooling/grip/ledger/jarl-immovables-register-2026-08-02.md. It is
 * transcribed here rather than read from disk: this gate must run in CI, in a
 * container, and on a machine that has never cloned barkpark.
 *
 * Local run:  node scripts/check-immovables.mjs
 *             node scripts/check-immovables.mjs --no-live   (skip the witness)
 *
 * Exit 1: drift in the CMS. Exit 2: the scan proved nothing (empty store,
 * unreachable API) — a gate that read nothing must not report green.
 */

const CMS = (process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud").replace(
  /\/$/,
  "",
);
const SITE = (process.env.SITE_URL ?? "https://jarl.no").replace(/\/$/, "");
const liveWitness = !process.argv.includes("--no-live");

/* ---- the register ------------------------------------------------------- */

/** 23 substrings over 14 slugs. Verbatim, NFC, diacritics intact. */
const REGISTER = {
  oslobukta: [
    "En kollega ledet arbeidet; jeg var andreutvikler",
    "med omtrent hver tredje endring som min",
  ],
  "kronprinsparets-fond": [
    "Sidene var bygget av andre i 2020",
    "I 2026 bygde jeg neste generasjon alene",
    "Bygget alene: et monorepo der FLYT-appene deler design og innhold",
  ],
  "spreadsheet-wizard": [
    "I 2022 bygde Suman Chapai og jeg en Sanity-plugin",
    "Vi bygde den som Sanity-plugin i 2022, Suman Chapai og jeg",
    "Prosjektet var hans like mye som mitt",
    "36 av dem Sumans, 5 mine",
  ],
  akerbrygge: ["632 av plattformens 879 endringer er mine"],
  gyldendal: ["nest mest aktive utvikler på gyldendal.no med 179 bidrag"],
  lunnheim: ["med Stripe og Klarna i kassen"],
  "aquatiq-synk": ["SuperOffice, Shopify, Visma"],
  galleryspace: [
    "tretti små endringer",
    "181 endringer, og telleren går fortsatt",
  ],
  doey: [
    "pelle, en egen Mac mini med sin egen GitHub-bruker, som la 1 350 endringer på ni dager",
  ],
  "full-blast": [
    "Spillet begynner for hånd i nettleseren",
    "AI-flåten setter i gang gjenoppbyggingen",
  ],
  nextgen: [
    "versjon 1.0.147, 335 endringer skrevet alene",
    "Stille siden oktober 2025",
  ],
  "barkpark-cloud": ["av én person og en flåte av agenter"],
  hundesteder: ["Alt er designet og bygget fra bunnen, av meg"],
  "ticket-realtime": ["Bygget alene på én måned"],
};

/** The absence IS the immovable. Aquatiq's post states three named systems and
    no share of anything; a percentage there would be a number nobody measured. */
const NEGATIVE = {
  slug: "aquatiq-synk",
  forbidden: [
    { label: "%", test: (t) => (t.match(/%/g) ?? []).length },
    { label: "prosent", test: (t) => (t.toLowerCase().match(/prosent/g) ?? []).length },
  ],
};

const TOTAL = Object.values(REGISTER).reduce((n, v) => n + v.length, 0);

/* ---- normalisation ------------------------------------------------------ */

/** NFC, then the three space characters a Norwegian typographer reaches for
    (nbsp, narrow nbsp, thin space) folded to a plain space, then runs
    collapsed. "1 350 endringer" is written with U+00A0 in the CMS and with a
    plain space in the register; they are the same sentence. */
const norm = (s) =>
  s
    .normalize("NFC")
    .replace(/[   ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Every string value in a document, joined. Keys starting with `_` are
    Barkpark's own metadata (`_id`, `_rev`, `_type`) and carry slugs that
    would otherwise satisfy a match by accident. */
function harvest(node, acc = []) {
  if (typeof node === "string") acc.push(node);
  else if (Array.isArray(node)) for (const v of node) harvest(v, acc);
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith("_")) continue;
      harvest(v, acc);
    }
  return acc;
}

const textOf = (doc) => norm(harvest(doc).join(" "));

/** Drops <script>/<style> BODIES first, so an RSC payload embedded in a
    <script> tag cannot launder a match, then strips tags and unescapes. */
const stripTags = (html) =>
  norm(
    html
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16))),
  );

/* ---- the stores --------------------------------------------------------- */

async function store(type) {
  let res;
  try {
    res = await fetch(`${CMS}/v1/data/query/production/${type}?limit=100`);
  } catch (e) {
    console.error(`check-immovables: ${CMS} unreachable (${e.message ?? e}) — aborting.`);
    process.exit(2);
  }
  if (!res.ok) {
    console.error(`check-immovables: HTTP ${res.status} fetching ${type} — aborting.`);
    process.exit(2);
  }
  const docs = (await res.json())?.result?.documents ?? [];
  if (docs.length === 0) {
    console.error(
      `check-immovables: zero ${type} documents from ${CMS} — refusing to\n` +
        "  conclude anything from an empty scan.",
    );
    process.exit(2);
  }
  return docs;
}

const projects = await store("project");
const papers = await store("paper");
const bySlug = new Map(projects.filter((p) => p.slug).map((p) => [p.slug, p]));
const byId = new Map(papers.map((p) => [p._id, p]));
const paperText = new Map([...byId].map(([id, doc]) => [id, textOf(doc)]));

/* ---- the check ---------------------------------------------------------- */

const drift = [];
const found = { project: 0, story: 0, elsewhere: 0 };

for (const [slug, substrings] of Object.entries(REGISTER)) {
  const project = bySlug.get(slug);
  if (!project) {
    for (const s of substrings) drift.push({ slug, substring: s, why: "no such project document" });
    continue;
  }
  const projectText = textOf(project);
  const storyId = typeof project.story === "string" ? project.story : project.story?._ref;
  const storyText = storyId ? (paperText.get(storyId) ?? "") : "";

  for (const raw of substrings) {
    const needle = norm(raw);
    if (projectText.includes(needle)) {
      found.project += 1;
      continue;
    }
    if (storyText.includes(needle)) {
      found.story += 1;
      continue;
    }
    const elsewhere = [...paperText].find(([, t]) => t.includes(needle));
    if (elsewhere) {
      found.elsewhere += 1;
      console.log(
        `  flyttet:${slug} — found in paper/${elsewhere[0]}, not in the project doc` +
          (storyId ? ` nor in its story paper/${storyId}` : ""),
      );
      continue;
    }
    drift.push({ slug, substring: raw, why: "absent from both stores" });
  }
}

/* the negative row */
const negativeDoc = bySlug.get(NEGATIVE.slug);
const negativeHits = [];
if (!negativeDoc) {
  drift.push({ slug: NEGATIVE.slug, substring: "(negative row)", why: "no such project document" });
} else {
  const t = textOf(negativeDoc);
  for (const f of NEGATIVE.forbidden) {
    const n = f.test(t);
    if (n > 0) negativeHits.push(`${f.label} x${n}`);
  }
}

const ok = TOTAL - drift.filter((d) => d.substring !== "(negative row)").length;
console.log(
  `check-immovables: ${ok}/${TOTAL} exact substrings over ${Object.keys(REGISTER).length} slugs ` +
    `(${found.project} in the project doc, ${found.story} in its story paper, ` +
    `${found.elsewhere} elsewhere in the paper store) — scanned ${projects.length} projects ` +
    `+ ${papers.length} papers on ${CMS}.`,
);
console.log(
  negativeHits.length === 0
    ? `check-immovables: negative row clean — ${NEGATIVE.slug} states no share of anything.`
    : `check-immovables: negative row VIOLATED on ${NEGATIVE.slug}: ${negativeHits.join(", ")}`,
);

/* ---- the live witness --------------------------------------------------- */

if (liveWitness && drift.length === 0) {
  let lag = 0;
  let reached = 0;
  for (const [slug, substrings] of Object.entries(REGISTER)) {
    let html;
    try {
      const res = await fetch(`${SITE}/prosjekter/${slug}`);
      html = await res.text();
      reached += 1;
    } catch {
      continue; // an unreachable edge is not evidence of drift
    }
    const rendered = stripTags(html);
    for (const raw of substrings) {
      if (!rendered.includes(norm(raw))) {
        lag += 1;
        console.log(`  lag:${slug} — "${raw.slice(0, 48)}…" not yet on the rendered page`);
      }
    }
  }
  console.log(
    lag === 0
      ? `check-immovables: live witness agrees on all ${TOTAL} (${reached}/14 pages reached).`
      : `check-immovables: live witness lags on ${lag} substring(s) — ISR has not caught up. ` +
          "Not a failure: the CMS is the truth and it is clean.",
  );
}

/* ---- the verdict -------------------------------------------------------- */

if (drift.length > 0 || negativeHits.length > 0) {
  console.error("");
  for (const d of drift)
    console.error(`check-immovables: DRIFT ${d.slug} — ${d.why}\n    "${d.substring}"`);
  if (negativeHits.length > 0)
    console.error(
      `check-immovables: DRIFT ${NEGATIVE.slug} — the negative row is the immovable: ` +
        `${negativeHits.join(", ")}`,
    );
  console.error(
    "\ncheck-immovables: these sentences state who did what. Restore the exact\n" +
      "  wording, or amend the register in barkpark/tooling/grip/ledger/\n" +
      "  jarl-immovables-register-2026-08-02.md with the evidence for the new claim.",
  );
  process.exit(1);
}

console.log("check-immovables: 23/23 + negative row — the fence holds.");
