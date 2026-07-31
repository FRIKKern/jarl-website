#!/usr/bin/env node
/**
 * Design gate 4 — the reading-measure doctrine holds for every block.
 *
 * globals.css states the doctrine: EVERY direct child of .bp-paper-surface
 * defaults to the reading measure (`.bp-paper-surface > * { max-width:
 * var(--measure) }`), and a small, known figure family opts out to the band
 * (`max-width: var(--figure)`). That inversion makes a NEW prose block ship
 * correct with zero edits — but a NEW figure-shaped block would ship
 * squeezed to 672px, silently, unless something forces the triage.
 *
 * This gate is that something. It renders the LIVE paper corpus with the
 * SAME vendored emitter the build uses (`renderPortableDocument` from
 * @barkpark/react — papers and project stories are both `paper` docs), and
 * asserts every top-level block root is one it can place on exactly one of
 * the two widths:
 *
 *   - on the FIGURE allowlist  → the band. The allowlist is parsed out of
 *     globals.css itself (the `max-width: var(--figure)` rule), so the gate
 *     and the CSS cannot drift apart.
 *   - a KNOWN prose root       → the measure, by the `> *` default.
 *   - anything else            → FAIL. A block type this gate has never
 *     seen must be triaged by a human: prose (add it to KNOWN_PROSE here)
 *     or figure (add one selector line to the opt-out rule in globals.css).
 *
 * It also fails any top-level block carrying an inline width — an inline
 * style is the one thing that outruns the doctrine's selectors.
 *
 * VACUITY GUARD (exit 2, distinct from a real failure's exit 1): the gate
 * refuses to conclude anything when the doctrine rules are missing from
 * globals.css, the corpus comes back empty, or rendering yields zero
 * blocks — a gate that scanned nothing has proven nothing.
 *
 * Local run:  node scripts/check-measure.mjs
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BARKPARK_URL = (
  process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud"
).replace(/\/$/, "");
const READ_TOKEN = process.env.BARKPARK_READ_TOKEN;

/* ---- 1 · the doctrine, read from the stylesheet that states it --------- */

const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8");

/* The inverted default: every direct child takes the measure. */
const defaultRule =
  /\.bp-paper-surface\s*>\s*\*\s*\{[^}]*max-width:\s*var\(--measure\)/.test(
    css,
  );

/* The figure opt-out rule: selectors sharing the `var(--figure)` block. */
const figureRule = css.match(
  /((?:\.bp-paper-surface\s*>\s*[^,{]+,\s*)*\.bp-paper-surface\s*>\s*[^,{]+)\{[^}]*max-width:\s*var\(--figure\)/,
);

if (!defaultRule || !figureRule) {
  console.error(
    "check-measure: the doctrine is missing from src/app/globals.css —\n" +
      (defaultRule
        ? ""
        : "  no `.bp-paper-surface > * { max-width: var(--measure) }` default\n") +
      (figureRule
        ? ""
        : "  no `.bp-paper-surface > … { max-width: var(--figure) }` opt-out\n") +
      "  refusing to run: with no doctrine there is nothing to assert.",
  );
  process.exit(2);
}

/* "figure", "pre" (element roots) and "bp-*" (class roots). */
const figureAllow = new Set(
  figureRule[1]
    .split(",")
    .map((s) => s.replace(/\.bp-paper-surface\s*>\s*/, "").trim())
    .map((s) => (s.startsWith(".") ? s.slice(1) : `<${s}>`)),
);

/* Prose roots this gate recognises (they take the `> *` default). Plain
   tags and unclassed elements are prose by construction; these are the
   engine's CLASSED prose roots. A new engine block lands in neither set
   and fails below — that is the point. */
const KNOWN_PROSE = new Set([
  "bp-blockquote",
  "bp-role-eyebrow",
  "bp-role-ingress",
  "bp-role-byline",
  "bp-role-pullquote",
  "bp-callout",
  "bp-note",
  "bp-notes",
  "bp-footnote",
  "bp-expandable",
  "bp-toc",
  "bp-equation",
  "bp-unknown-block",
]);

/* ---- 2 · the live corpus, rendered by the build's own emitter ---------- */

const { renderPortableDocument } = await import("@barkpark/react");

const res = await fetch(`${BARKPARK_URL}/v1/data/query/production/paper`, {
  headers: READ_TOKEN ? { Authorization: `Bearer ${READ_TOKEN}` } : {},
});
if (!res.ok) {
  console.error(`check-measure: HTTP ${res.status} fetching papers — aborting.`);
  process.exit(2);
}
const papers = (await res.json())?.result?.documents ?? [];
if (papers.length === 0) {
  console.error(
    "check-measure: the paper corpus came back empty — refusing to\n" +
      "  conclude anything. A gate that scanned nothing has proven nothing.",
  );
  process.exit(2);
}

/* ---- 3 · walk every top-level block root ------------------------------- */

const VOID = new Set([
  "br", "hr", "img", "input", "meta", "link", "source", "track", "wbr", "col", "embed",
]);

/** Top-level elements of an HTML fragment: [{tag, classes, style}]. */
function topLevel(html) {
  const out = [];
  const re = /<(\/)?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  let depth = 0;
  let m;
  while ((m = re.exec(html))) {
    const [, closing, rawTag, attrs] = m;
    const tag = rawTag.toLowerCase();
    if (!closing && depth === 0) {
      out.push({
        tag,
        classes: (attrs.match(/class="([^"]*)"/)?.[1] ?? "")
          .split(/\s+/)
          .filter(Boolean),
        style: attrs.match(/style="([^"]*)"/)?.[1] ?? "",
      });
    }
    if (VOID.has(tag) || /\/\s*$/.test(attrs)) continue;
    depth += closing ? -1 : 1;
  }
  return out;
}

const violations = [];
let blockCount = 0;
let proseCount = 0;
let figureCount = 0;
const seen = new Map(); // root signature → count

for (const doc of papers) {
  const blocks = doc.blocks ?? doc.body?.blocks ?? [];
  if (!Array.isArray(blocks) || blocks.length === 0) continue;
  const slug = doc.slug ?? doc._id ?? "?";
  for (const el of topLevel(renderPortableDocument(blocks))) {
    blockCount += 1;
    const sig = el.classes.length
      ? `${el.tag}.${el.classes.join(".")}`
      : `<${el.tag}>`;
    seen.set(sig, (seen.get(sig) ?? 0) + 1);

    if (/(?:^|;)\s*(?:max-)?width\s*:/.test(el.style)) {
      violations.push(
        `${slug}: <${el.tag}> carries an inline width (${el.style}) — ` +
          "inline styles outrun the doctrine",
      );
      continue;
    }

    const isFigure =
      figureAllow.has(`<${el.tag}>`) ||
      el.classes.some((c) => figureAllow.has(c));
    if (isFigure) {
      figureCount += 1;
      continue;
    }

    const bpClasses = el.classes.filter((c) => c.startsWith("bp-"));
    const known =
      bpClasses.length === 0 || bpClasses.some((c) => KNOWN_PROSE.has(c));
    if (known) {
      proseCount += 1;
      continue;
    }

    violations.push(
      `${slug}: unknown block root ${sig} — triage it: prose (add to ` +
        "KNOWN_PROSE in scripts/check-measure.mjs) or figure (add " +
        `\`.bp-paper-surface > .${bpClasses[0]}\` to the --figure rule in ` +
        "src/app/globals.css)",
    );
  }
}

if (blockCount === 0) {
  console.error(
    "check-measure: the corpus rendered zero top-level blocks — refusing\n" +
      "  to conclude anything.",
  );
  process.exit(2);
}

/* ---- 4 · report -------------------------------------------------------- */

console.log(
  `check-measure: ${papers.length} papers, ${blockCount} top-level blocks — ` +
    `${proseCount} at the measure, ${figureCount} on the figure band.`,
);
console.log(
  `  figure allowlist (parsed from globals.css, ${figureAllow.size} roots): ` +
    [...figureAllow].join(" "),
);
console.log("  block roots seen:");
for (const [sig, n] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(4)}x ${sig}`);
}

if (violations.length > 0) {
  console.error(`\ncheck-measure: ${violations.length} violation(s):`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log("check-measure: OK — every block stands on one of the two widths.");
