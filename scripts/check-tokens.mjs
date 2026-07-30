#!/usr/bin/env node
/**
 * Design gate 2 — tokens only.
 *
 * No raw color literals (hex, oklch(), rgb(), hsl(), color()) anywhere in
 * src/ except the single token file src/app/globals.css. Components must
 * reference colors exclusively through var(--color-*) tokens.
 * Exits 1 listing every violation with file:line.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(root, "src");
const TOKEN_FILE = resolve(root, "src/app/globals.css");
const EXTENSIONS = new Set([".css", ".tsx", ".ts", ".jsx", ".js"]);

const COLOR_LITERAL =
  /#[0-9a-fA-F]{3,8}\b|\b(?:oklch|oklab|rgba?|hsla?|hwb|lab|lch|color)\(/;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(full.slice(full.lastIndexOf(".")))) yield full;
  }
}

const violations = [];
for (const file of walk(srcDir)) {
  if (resolve(file) === TOKEN_FILE) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = line.match(COLOR_LITERAL);
    if (m) {
      violations.push(
        `${relative(root, file)}:${i + 1}  ${line.trim().slice(0, 90)}`,
      );
    }
  });
}

if (violations.length > 0) {
  console.error("check-tokens: raw color literals outside the token file:\n");
  for (const v of violations) console.error("  " + v);
  console.error(
    `\ncheck-tokens: ${violations.length} violation(s) — use var(--color-*) tokens.`,
  );
  process.exit(1);
}
console.log("check-tokens: no raw color literals outside globals.css.");

/* ============================================================
   Part two — the satori mirror.

   next/og rasterises the icons and social cards server-side and never sees a
   stylesheet, so src/lib/palette.ts restates the same colors as plain numbers.
   That copy is only legitimate while it is exact: this check fails the build
   the moment the two files disagree.
   ============================================================ */

const PALETTE_FILE = resolve(root, "src/lib/palette.ts");
const css = readFileSync(TOKEN_FILE, "utf8");
const paletteSource = readFileSync(PALETTE_FILE, "utf8");

function cssTokens(source) {
  const out = {};
  const re = /(--(?:paper|ink)-[\w-]+)\s*:\s*oklch\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    out[m[1]] = m[2].trim().split(/[\s/]+/).map(Number);
  }
  return out;
}

function tsTokens(name) {
  const start = paletteSource.indexOf(`export const ${name}`);
  if (start === -1) return null;
  const block = paletteSource.slice(start, paletteSource.indexOf("};", start));
  const out = {};
  const re = /"(--(?:paper|ink)-[\w-]+)":\s*\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    out[m[1]] = m[2].split(",").map((n) => Number(n.trim()));
  }
  return out;
}

const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
const cssLight = cssTokens(css.slice(0, darkStart));
const cssDark = { ...cssLight, ...cssTokens(css.slice(darkStart, css.indexOf("/* ==", darkStart))) };

const drift = [];
for (const [theme, expected] of [
  ["LIGHT", cssLight],
  ["DARK", cssDark],
]) {
  const actual = tsTokens(theme);
  if (!actual) {
    drift.push(`src/lib/palette.ts: missing export ${theme}`);
    continue;
  }
  for (const [name, value] of Object.entries(expected)) {
    const mirrored = actual[name];
    if (!mirrored) {
      drift.push(`${theme}: ${name} missing from palette.ts`);
    } else if (
      mirrored.length !== value.length ||
      mirrored.some((n, i) => n !== value[i])
    ) {
      drift.push(
        `${theme}: ${name} is [${mirrored.join(", ")}] in palette.ts, [${value.join(", ")}] in globals.css`,
      );
    }
  }
  for (const name of Object.keys(actual)) {
    if (!expected[name]) drift.push(`${theme}: ${name} in palette.ts is not a token`);
  }
}

if (drift.length > 0) {
  console.error("\ncheck-tokens: palette.ts has drifted from globals.css:\n");
  for (const d of drift) console.error("  " + d);
  process.exit(1);
}
console.log("check-tokens: src/lib/palette.ts mirrors globals.css exactly.");

/* ============================================================
   Part three — the surface bindings are complete.

   Components read only the semantic --color-* names. Each one must be
   bound in :root and re-bound by BOTH surface-family selectors, or a
   band would inherit half a palette from the ground behind it.
   ============================================================ */

const SEMANTIC = Object.keys(cssLight)
  .filter((n) => n.startsWith("--paper-"))
  .map((n) => n.replace("--paper-", ""));

function bindingsIn(selector) {
  const at = css.indexOf(selector);
  if (at === -1) return null;
  const open = css.indexOf("{", at);
  const block = css.slice(open, css.indexOf("}", open));
  const out = new Set();
  const re = /(--color-[\w-]+)\s*:\s*var\(\s*(--(?:paper|ink)-[\w-]+)\s*\)/g;
  let m;
  while ((m = re.exec(block)) !== null) out.add(`${m[1]}→${m[2]}`);
  return out;
}

const holes = [];
for (const [selector, family] of [
  [':root {\n  /* -- paper', "paper"],
  ['[data-surface="paper"]', "paper"],
  ['[data-surface="ink"]', "ink"],
]) {
  /* :root is matched by its first declaration group; fall back to the
     bare selector so a reformat cannot silently disable the check. */
  const bound = bindingsIn(selector) ?? bindingsIn(selector.split(" {")[0]);
  if (!bound) {
    holes.push(`missing surface selector: ${selector}`);
    continue;
  }
  for (const suffix of SEMANTIC) {
    const want = `--color-${suffix === "fg" ? "ink" : suffix}→--${family}-${suffix}`;
    if (!bound.has(want)) holes.push(`${selector}: no binding ${want}`);
  }
}

if (holes.length > 0) {
  console.error("\ncheck-tokens: incomplete surface bindings:\n");
  for (const h of holes) console.error("  " + h);
  console.error(
    "\ncheck-tokens: every --color-* must be bound by :root and by both" +
      " [data-surface] selectors.",
  );
  process.exit(1);
}
console.log(
  `check-tokens: all ${SEMANTIC.length} semantic colors bound on both surfaces.`,
);
