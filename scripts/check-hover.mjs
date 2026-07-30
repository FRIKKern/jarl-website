#!/usr/bin/env node
/**
 * Design gate 3 — a painted surface pins its own text color.
 *
 * The site carries two mirrored surface families — `--paper-*` (the default
 * ground) and `--ink-*` (the inverted band ground) — and a band swaps the
 * whole `--color-*` set at once with `[data-surface="ink"]`. So any rule that
 * paints a background but lets `color` inherit is a latent bug: the moment
 * that subtree lands on the other family the text keeps the old ground's
 * color and goes unreadable, or invisible.
 *
 * The rule enforced here: if a rule sets an opaque background, the SAME
 * declaration block must also set `color`. A gradient or image with no
 * standalone color token is not a painted surface (a hairline drawn as a
 * gradient paints nothing text sits on) and is not checked.
 *
 * Allowlist — put a comment reading
 *
 *     check-hover-allow: why this one is safe
 *
 * on the line immediately above the selector, or anywhere inside the block.
 * The reason is mandatory; an empty one is itself a violation. Every
 * exemption is printed on every run, so none of them go quiet.
 *
 * Exits 1 listing every violation with file:line.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolve(root, "src");

/* Values that paint nothing, whatever property they land on. */
const NOT_A_PAINT = new Set([
  "none",
  "transparent",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "currentcolor",
]);

/* Values of `color` that pin nothing — they defer to the ground again. */
const NOT_PINNED = new Set(["inherit", "unset", "revert", "revert-layer"]);

/* Bare idents legal in the `background` shorthand that are not colors. */
const NOT_A_COLOR = new Set([
  "repeat", "no-repeat", "repeat-x", "repeat-y", "space", "round",
  "scroll", "fixed", "local",
  "border-box", "padding-box", "content-box", "text",
  "left", "right", "top", "bottom", "center",
  "cover", "contain", "auto",
  ...NOT_A_PAINT,
]);

/* Functions that produce an image, not a color. Their arguments name color
   tokens, but nothing behind them is painted — strip them whole. */
const IMAGE_FN =
  /^(?:(?:repeating-)?(?:linear|radial|conic)-gradient|-webkit-[\w-]*gradient|url|image|image-set|-webkit-image-set|cross-fade|element|paint)$/;

const COLOR_FN = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)$/;
const COLOR_VAR = /^--(?:color|paper|ink)-/;

const ALLOW = /^\s*check-hover-allow\b\s*:?\s*(.*)$/s;

/* ---- source scanning --------------------------------------------------- */
function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (full.endsWith(".css")) yield full;
  }
}

/* Blank out comments in place so offsets — and therefore line numbers —
   still map 1:1 onto the original file. Strings are stepped over. */
function stripComments(src) {
  const clean = src.split("");
  const comments = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i++;
      while (i < src.length && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      i++;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      const bodyEnd = end === -1 ? src.length : end;
      const stop = end === -1 ? src.length : end + 2;
      comments.push({ at: i, end: stop, body: src.slice(i + 2, bodyEnd) });
      for (let k = i; k < stop; k++) if (clean[k] !== "\n") clean[k] = " ";
      i = stop;
      continue;
    }
    i++;
  }
  return { clean: clean.join(""), comments };
}

/* Recursive descent over balanced braces. Returns the declarations of this
   block plus every nested block, so rules inside @media / @supports /
   @keyframes are reached exactly like top-level ones. */
function parseBlock(src, from, to) {
  const decls = [];
  const rules = [];
  let start = -1;
  let depth = 0;

  const flushDecl = (end) => {
    if (start === -1) return;
    const text = src.slice(start, end);
    const colon = text.indexOf(":");
    if (colon > 0) {
      decls.push({
        prop: text.slice(0, colon).trim().toLowerCase(),
        value: text.slice(colon + 1).trim(),
        at: start,
      });
    }
    start = -1;
  };

  for (let i = from; i < to; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      if (start === -1) start = i;
      i++;
      while (i < to && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") depth--;
    if (depth > 0) continue;
    if (c === "{") {
      const close = matchBrace(src, i, to);
      const inner = parseBlock(src, i + 1, close);
      rules.push({
        selector: src.slice(start === -1 ? i : start, i).trim(),
        at: start === -1 ? i : start,
        open: i,
        close,
        ...inner,
      });
      start = -1;
      i = close;
      continue;
    }
    if (c === ";") {
      flushDecl(i);
      continue;
    }
    if (start === -1 && !/\s/.test(c)) start = i;
  }
  flushDecl(to);
  return { decls, rules };
}

function matchBrace(src, open, to) {
  let depth = 0;
  for (let i = open; i < to; i++) {
    const c = src[i];
    if (c === '"' || c === "'") {
      i++;
      while (i < to && src[i] !== c) i += src[i] === "\\" ? 2 : 1;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return to;
}

/* ---- does this declaration paint a surface? ---------------------------- */

/* Remove image functions, arguments and all, so a value that is only a
   gradient reads as empty of color even though the gradient mentions tokens. */
function stripImageFns(value) {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== "(") {
      out += value[i];
      continue;
    }
    const name = (out.match(/[\w-]+$/) ?? [""])[0];
    const close = closeParen(value, i);
    if (IMAGE_FN.test(name)) out = out.slice(0, out.length - name.length);
    else out += value.slice(i, close + 1);
    i = close;
  }
  return out;
}

function closeParen(value, open) {
  let depth = 0;
  for (let i = open; i < value.length; i++) {
    if (value[i] === "(") depth++;
    else if (value[i] === ")" && --depth === 0) return i;
  }
  return value.length - 1;
}

function hasColor(value) {
  /* Function calls first: var(--color-*) and the color functions count. */
  for (const m of value.matchAll(/([\w-]+)\(/g)) {
    const name = m[1].toLowerCase();
    if (COLOR_FN.test(name)) return true;
    if (name === "var") {
      const arg = value.slice(m.index + m[0].length).match(/^\s*(--[\w-]+)/);
      if (arg && COLOR_VAR.test(arg[1])) return true;
    }
  }
  /* Then bare tokens outside any function: a hex, or any ident that is not
     one of the shorthand's position / repeat / box keywords. */
  const bare = stripFnCalls(value);
  for (const token of bare.split(/[\s,/]+/)) {
    if (!token) continue;
    if (token.startsWith("#")) return true;
    if (/^[a-z][\w-]*$/i.test(token) && !NOT_A_COLOR.has(token.toLowerCase()))
      return true;
  }
  return false;
}

function stripFnCalls(value) {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== "(") {
      out += value[i];
      continue;
    }
    out = out.replace(/[\w-]+$/, "");
    i = closeParen(value, i);
  }
  return out;
}

function paintsSurface({ prop, value }) {
  const v = value.trim().toLowerCase();
  if (!v || NOT_A_PAINT.has(v)) return false;
  if (prop === "background-color") return true;
  if (prop !== "background") return false;
  return hasColor(stripImageFns(v));
}

/* ---- run --------------------------------------------------------------- */
const violations = [];
const allowed = [];
let painters = 0;

for (const file of walk(srcDir)) {
  const src = readFileSync(file, "utf8");
  const { clean, comments } = stripComments(src);
  const lineOf = (offset) => src.slice(0, offset).split("\n").length;
  const where = (offset) => `${relative(root, file)}:${lineOf(offset)}`;

  /* An allow comment with no reason exempts nothing and fails on its own. */
  const allows = [];
  for (const comment of comments) {
    const m = comment.body.match(ALLOW);
    if (!m) continue;
    const reason = m[1].trim();
    if (!reason) {
      violations.push({
        where: where(comment.at),
        selector: "/* check-hover-allow */",
        why: "empty reason — an exemption has to say why it is safe.",
      });
      continue;
    }
    allows.push({ at: comment.at, line: lineOf(comment.at), reason });
  }

  const visit = (rule) => {
    const painter = rule.decls.find(paintsSurface);
    if (painter) {
      painters++;
      const selector = rule.selector.replace(/\s+/g, " ").slice(0, 90);
      const decl = `${painter.prop}: ${painter.value.replace(/\s+/g, " ")}`;
      const allow = allows.find(
        (a) =>
          a.line === lineOf(rule.at) - 1 ||
          (a.at > rule.open && a.at < rule.close),
      );
      if (allow) {
        allowed.push({ where: where(rule.at), selector, reason: allow.reason });
      } else if (
        !rule.decls.some(
          (d) => d.prop === "color" && !NOT_PINNED.has(d.value.toLowerCase()),
        )
      ) {
        violations.push({
          where: where(rule.at),
          selector,
          why: `paints with \`${decl}\` but sets no color — text here inherits the ground it came from and breaks on the other surface family.`,
        });
      }
    }
    rule.rules.forEach(visit);
  };
  parseBlock(clean, 0, clean.length).rules.forEach(visit);
}

if (allowed.length > 0) {
  console.log("check-hover: allowlisted rules:\n");
  for (const a of allowed)
    console.log(`  ${a.where}  ${a.selector}\n      ${a.reason}`);
  console.log("");
}

if (violations.length > 0) {
  console.error("check-hover: painted surfaces that do not pin their color:\n");
  for (const v of violations)
    console.error(`  ${v.where}  ${v.selector}\n      ${v.why}`);
  console.error(
    `\ncheck-hover: ${violations.length} violation(s) — set \`color\` in the same rule.`,
  );
  process.exit(1);
}
console.log(
  `check-hover: ${painters} rule(s) paint a surface, all pin their color` +
    ` (${allowed.length} allowlisted).`,
);
