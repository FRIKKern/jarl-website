/**
 * Vendored-renderer smoke (charter D12).
 *
 * Proves the vendored @barkpark/react tarball actually carries the canonical
 * engine and that jarl's adoption seams hold:
 *   1. every block type the live jarl corpus uses renders — zero
 *      `bp-unknown-block` (the old hand renderer silently dropped these);
 *   2. the Reader-Owned spacing law: the engine still emits `<p></p>` for an
 *      empty paragraph, and the drakt carries the scoped `:empty` suppression
 *      so it is never layout;
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
];

test("live block vocabulary renders with zero bp-unknown-block", () => {
  const html = renderPortableDocument(LIVE_VOCABULARY);
  assert.ok(html.length > 100, "renderer emitted markup");
  assert.ok(!html.includes("bp-unknown-block"), `unknown block leaked:\n${html}`);
});

test("empty paragraph emits <p></p> and the drakt suppresses it", () => {
  const html = renderPortableDocument([{ type: "paragraph", id: "sp", content: [] }]);
  assert.equal(html, "<p></p>");
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
