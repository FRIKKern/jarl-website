/**
 * Vendored-renderer smoke (charter D12).
 *
 * Proves the vendored @barkpark/react tarball actually carries the canonical
 * engine and that jarl's adoption seams hold:
 *   1. every block type the live jarl corpus uses renders — zero
 *      `bp-unknown-block` (the old hand renderer silently dropped these);
 *   2. the Reader-Owned spacing law (doctrine flip 2026-07-31): the engine
 *      suppresses a blank-paragraph scaffold at the SOURCE — it emits nothing,
 *      not an empty `<p>` — and the drakt still carries the scoped `:empty`
 *      suppression as belt-and-braces for legacy cached `<p></p>` HTML;
 *   3. the dark-mode bridge: the vendored stylesheet keys dark on
 *      `html[data-theme="dark"]` and the root layout stamps `data-theme`
 *      pre-paint — lose either side and dark silently no-ops.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderPortableDocument } from "@barkpark/react";

/* The block vocabulary in use on the live jarl instance
   (velkommen-til-jarl-no) plus the roles the wave named. */
const LIVE_VOCABULARY = [
  { type: "eyebrow", id: "t-0", text: "Notat" },
  { type: "heading", id: "t-1", level: 1, content: [{ type: "text", value: "Tittel" }] },
  { type: "paragraph", id: "t-2", content: [{ type: "text", value: "Brødtekst." }] },
  { type: "ingress", id: "t-3", content: [{ type: "text", value: "Ingress." }] },
  { type: "list", id: "t-4", ordered: false, items: [[{ type: "text", value: "punkt" }]] },
  { type: "table", id: "t-5", head: ["A", "B"], rows: [["1", "2"]] },
  { type: "callout", id: "t-6", tone: "info", title: "T", text: "innhold" },
  { type: "callout", id: "t-7", tone: "info", content: [{ type: "text", value: "array-form" }] },
  { type: "divider", id: "t-8" },
  /* The jarl figure family (ruling jdf-bl-historiene-renderer-reconciliation,
     merged upstream as barkpark#8475) — the whole point of this re-vendor. */
  {
    type: "stat", id: "t-9", value: "40", unit: "%", label: "Mindre støy",
    body: "Én setning om hva tallet betyr.", source: "paper:historiene",
  },
  {
    type: "duel", id: "t-10", legendA: "Før", legendB: "Etter",
    sourceDefault: "paper:historiene",
    rows: [{ label: "Byggetid", delta: "−30 %", valueA: "10", valueB: "7", unit: "min" }],
  },
  {
    type: "lineage", id: "t-11", sourceDefault: "paper:historiene",
    nodes: [{ overline: "2024", title: "Første kutt", value: "1", body: "Starten." }],
  },
];

test("live block vocabulary renders with zero bp-unknown-block", () => {
  const html = renderPortableDocument(LIVE_VOCABULARY);
  assert.ok(html.length > 100, "renderer emitted markup");
  assert.ok(!html.includes("bp-unknown-block"), `unknown block leaked:\n${html}`);
});

test("figure family: duel/lineage/stat render with the kilde stamp", () => {
  const html = renderPortableDocument(LIVE_VOCABULARY);
  assert.ok(html.includes('class="bp-stat"'), "stat tile missing");
  assert.ok(html.includes('bp-stat__unit'), "stat unit span missing");
  assert.ok(html.includes('bp-stat__body'), "stat body prose missing");
  assert.ok(html.includes('class="bp-duel"'), "duel figure missing");
  assert.ok(html.includes('class="bp-lineage"'), "lineage figure missing");
  /* The kilde law: every figure datum carries provenance, surfaced as the
     «Kilde» stamp. Three figures, one shared paper: ref → three stamps. */
  const stamps = html.match(/bp-kilde__word/g) ?? [];
  assert.equal(stamps.length, 3, "every figure must stamp its kilde");
  assert.ok(!html.includes("bp-dataviz--empty"), "a figure fell to the empty box");
});

test("empty paragraph is suppressed at the source; the drakt keeps the legacy net", () => {
  const html = renderPortableDocument([{ type: "paragraph", id: "sp", content: [] }]);
  assert.equal(html, "", "blank-paragraph scaffold must emit NOTHING (doctrine invariant 4)");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.match(
    css,
    /\.bp-paper-surface p:empty\s*\{\s*display:\s*none/,
    "globals.css must carry the scoped empty-paragraph suppression",
  );
});

test("dark-mode bridge: vendored css keys on data-theme, layout stamps it", () => {
  const vendored = readFileSync(
    new URL("../node_modules/@barkpark/react/dist/paper-surface.css", import.meta.url),
    "utf8",
  );
  assert.ok(
    vendored.includes('html[data-theme="dark"] .bp-paper-surface'),
    "vendored paper-surface.css no longer keys dark on data-theme — re-audit the bridge",
  );
  const layout = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");
  assert.ok(
    layout.includes("prefers-color-scheme: dark") && layout.includes('setAttribute("data-theme"'),
    "layout.tsx must stamp data-theme from the media query pre-paint",
  );
});
