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
