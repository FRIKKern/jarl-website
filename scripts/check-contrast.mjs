#!/usr/bin/env node
/**
 * Design gate 1 — WCAG AA contrast.
 *
 * Parses the OKLCH color tokens in src/app/globals.css (light `:root`
 * block and the dark `@media (prefers-color-scheme: dark)` override),
 * converts OKLCH → linear sRGB → WCAG relative luminance, and verifies
 * every declared foreground/background pair meets its minimum ratio.
 * Exits 1 with a table of failures.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cssPath = resolve(root, "src/app/globals.css");
const css = readFileSync(cssPath, "utf8");

/* ---- pairs under contract: [foreground, background, minimum] ---------- */
const PAIRS = [
  ["--color-ink", "--color-bg", 4.5],
  ["--color-ink", "--color-surface", 4.5],
  ["--color-muted", "--color-bg", 4.5],
  ["--color-muted", "--color-surface", 4.5],
  ["--color-accent", "--color-bg", 4.5],
  ["--color-accent", "--color-surface", 4.5],
];

/* ---- parse tokens per theme ------------------------------------------- */
function parseBlock(source) {
  const tokens = {};
  const re = /(--color-[\w-]+)\s*:\s*oklch\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const [l, c, h] = m[2].trim().split(/[\s/]+/).map(Number);
    tokens[m[1]] = { l, c, h: h || 0 };
  }
  return tokens;
}

const darkStart = css.indexOf("@media (prefers-color-scheme: dark)");
if (darkStart === -1) {
  console.error("check-contrast: no dark theme block found in globals.css");
  process.exit(1);
}
const lightTokens = parseBlock(css.slice(0, darkStart));
const darkEnd = css.indexOf("/* ==", darkStart);
const darkOverrides = parseBlock(css.slice(darkStart, darkEnd));
const darkTokens = { ...lightTokens, ...darkOverrides };

/* ---- OKLCH → WCAG relative luminance ---------------------------------- */
function oklchLuminance({ l, c, h }) {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const L = l_ ** 3;
  const M = m_ ** 3;
  const S = s_ ** 3;
  const r = 4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S;
  const g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S;
  const bl = -0.0041960863 * L - 0.7034186147 * M + 1.707614701 * S;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(bl);
}

function contrast(fg, bg) {
  const y1 = oklchLuminance(fg);
  const y2 = oklchLuminance(bg);
  const [hi, lo] = y1 >= y2 ? [y1, y2] : [y2, y1];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---- run --------------------------------------------------------------- */
let failures = 0;
for (const [themeName, tokens] of [
  ["light", lightTokens],
  ["dark", darkTokens],
]) {
  for (const [fg, bg, min] of PAIRS) {
    if (!tokens[fg] || !tokens[bg]) {
      console.error(`FAIL [${themeName}] missing token ${!tokens[fg] ? fg : bg}`);
      failures++;
      continue;
    }
    const ratio = contrast(tokens[fg], tokens[bg]);
    const ok = ratio >= min;
    const line = `${ok ? " ok " : "FAIL"} [${themeName}] ${fg} on ${bg}: ${ratio.toFixed(2)}:1 (min ${min}:1)`;
    if (ok) console.log(line);
    else {
      console.error(line);
      failures++;
    }
  }
}

if (failures > 0) {
  console.error(`\ncheck-contrast: ${failures} pair(s) below AA — fix the tokens.`);
  process.exit(1);
}
console.log("\ncheck-contrast: all pairs pass WCAG AA.");
