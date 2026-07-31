#!/usr/bin/env node
/**
 * Evidence gate — every figure datum has a source.
 *
 * The site's figure kinds (statBand, duel, lineage) and the papers' stat
 * blocks draw NUMBERS. The evidence law says every one of them traces to a
 * commit, a paper, a task or a URL — so this gate walks the LIVE content and
 * fails when a datum carries a value but no pattern-valid resolved source
 * (item.source, else the section's sourceDefault; block source for papers).
 * One `ingen-kilde:<where>` sentinel is printed per missing source, every
 * run, so the gap is always visible.
 *
 * VACUITY GUARD (exit 2, distinct from a real failure's exit 1): an
 * unauthenticated query answers 200 and silently downgrades to zero
 * documents, which would turn this gate green forever. So the run REFUSES
 * to conclude anything when BARKPARK_READ_TOKEN is unset or any checked
 * type comes back empty — a gate that scanned nothing has proven nothing.
 *
 * Local run:  export $(grep -v '^#' .env.local | xargs) && node scripts/check-sources.mjs
 */

const BARKPARK_URL = (
  process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud"
).replace(/\/$/, "");
const READ_TOKEN = process.env.BARKPARK_READ_TOKEN;

/** Mirrors the CMS schema's validation.pattern and src/content/sources.ts. */
const SOURCE_REF_PATTERN =
  /^(commit:[0-9a-f]{7,40}|paper:[a-z0-9][a-z0-9-]*|task:[A-Za-z0-9._-]+|https:\/\/.+)$/;

const FIGURE_KINDS = new Set(["statBand", "duel", "lineage"]);
const STAT_BLOCK_TYPES = new Set(["stat", "stats", "stat-grid"]);

if (!READ_TOKEN) {
  console.error(
    "check-sources: BARKPARK_READ_TOKEN is not set — refusing to run.\n" +
      "  An unauthenticated query answers 200 with zero documents, and a\n" +
      "  gate that scanned nothing has proven nothing.",
  );
  process.exit(2);
}

async function fetchDocs(type) {
  const res = await fetch(`${BARKPARK_URL}/v1/data/query/production/${type}`, {
    headers: { Authorization: `Bearer ${READ_TOKEN}` },
  });
  if (!res.ok) {
    console.error(`check-sources: HTTP ${res.status} fetching ${type} — aborting.`);
    process.exit(2);
  }
  const json = await res.json();
  return json?.result?.documents ?? [];
}

const text = (v) => (typeof v === "string" ? v.trim() : "");
const validRef = (v) => SOURCE_REF_PATTERN.test(text(v));
/** A datum's value counts whether authored as a string or a bare number —
    a stat block with `value: 75` owes a source exactly like `value: "75"`. */
const hasValue = (v) => text(v) !== "" || typeof v === "number";

const missing = [];
let figureData = 0;

/** A datum needs a resolved, pattern-valid ref. Record a sentinel if not. */
function requireSource(where, resolved) {
  figureData += 1;
  if (!validRef(resolved)) missing.push(`ingen-kilde:${where}`);
}

/* ---- sections on pages and projects ------------------------------------ */

let sectionCount = 0;
let figureSections = 0;

function walkSections(type, doc) {
  (doc.sections ?? []).forEach((section, i) => {
    sectionCount += 1;
    if (!FIGURE_KINDS.has(section.kind)) return;
    figureSections += 1;
    (section.items ?? []).forEach((item, j) => {
      if (!hasValue(item.value) && !hasValue(item.value2)) return;
      const resolved = text(item.source) || text(section.sourceDefault);
      requireSource(
        `${type}/${doc._id}#sections[${i}].items[${j}]`,
        resolved,
      );
    });
  });
}

/* ---- figure blocks in papers --------------------------------------------
   The canonical figure family (barkpark#8475): stat/stats/stat-grid items,
   duel rows and lineage nodes are all figure data. The kilde law's fallback
   is the block's `sourceDefault` (the engine's contract; bare `source` on a
   single stat block is the pre-8475 spelling and still honoured). Only
   datum-bearing entries owe a ref: a lineage node without a value is prose
   on a line, not a number. */

let statBlocks = 0;

function walkPaperBlocks(doc) {
  const blocks = doc.blocks ?? doc.body?.blocks ?? [];
  blocks.forEach((block, i) => {
    const fallback = text(block.sourceDefault) || text(block.source);
    if (STAT_BLOCK_TYPES.has(block.type)) {
      statBlocks += 1;
      const data = Array.isArray(block.items) ? block.items : [block];
      data.forEach((datum, j) => {
        if (!hasValue(datum.value)) return;
        const resolved = text(datum.source) || fallback;
        requireSource(
          `paper/${doc._id}#blocks[${i}]${data.length > 1 ? `.items[${j}]` : ""}`,
          resolved,
        );
      });
    } else if (block.type === "duel") {
      statBlocks += 1;
      (Array.isArray(block.rows) ? block.rows : []).forEach((row, j) => {
        if (!hasValue(row.valueA) && !hasValue(row.valueB)) return;
        const resolved = text(row.source) || fallback;
        requireSource(`paper/${doc._id}#blocks[${i}].rows[${j}]`, resolved);
      });
    } else if (block.type === "lineage") {
      statBlocks += 1;
      (Array.isArray(block.nodes) ? block.nodes : []).forEach((node, j) => {
        if (!hasValue(node.value)) return;
        const resolved = text(node.source) || fallback;
        requireSource(`paper/${doc._id}#blocks[${i}].nodes[${j}]`, resolved);
      });
    }
  });
}

/* ---- run ---------------------------------------------------------------- */

const counts = {};
for (const type of ["page", "project", "paper"]) {
  const docs = await fetchDocs(type);
  counts[type] = docs.length;
  if (docs.length === 0) {
    console.error(
      `check-sources: zero ${type} documents from ${BARKPARK_URL} — refusing to\n` +
        "  conclude anything from an empty scan (silent-downgrade signature).",
    );
    process.exit(2);
  }
  for (const doc of docs) {
    if (type === "paper") walkPaperBlocks(doc);
    else walkSections(type, doc);
  }
}

console.log(
  `check-sources: scanned ${counts.page} pages + ${counts.project} projects ` +
    `(${sectionCount} sections, ${figureSections} figure sections) and ` +
    `${counts.paper} papers (${statBlocks} figure blocks): ` +
    `${figureData} figure data checked.`,
);

for (const sentinel of missing) console.log("  " + sentinel);

if (missing.length > 0) {
  console.error(
    `\ncheck-sources: ${missing.length} figure datum/data with no valid source ` +
      "— every number the site draws must carry commit:/paper:/task:/https:// provenance.",
  );
  process.exit(1);
}
console.log("check-sources: every figure datum carries a valid source ref.");
