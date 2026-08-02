#!/usr/bin/env node
/**
 * The screenshot rig — every route, both viewports, both schemes.
 *
 * Routes are DERIVED, never listed by hand: the sitemap is the census, with
 * the production host rewritten to the local server. The matrix is the
 * review quad — 1440x900 and 390x844, light and dark — one fullPage PNG per
 * capture into the gitignored __shots__/, plus one audit row per capture:
 * document overflow, the leaf elements that caused it, and the MEASURED
 * prose and figure widths (px and ch) so the width doctrine is checked on
 * rendered pixels, not on CSS text.
 *
 * Waiting is `load` + document.fonts.ready + a short settle — NEVER
 * `networkidle`: a warm next server keeps connections open and networkidle
 * times out at 30s per route; and pre-fonts overflow data is noise in both
 * directions (fallback metrics both hide and invent overflow).
 *
 * Usage:
 *   node scripts/shoot.mjs                       # full matrix (~124 captures)
 *   node scripts/shoot.mjs --routes / --routes /papers/scaffy-historien
 *
 * BASE / OUT env override the server and output dir. Exit 2 when zero
 * routes survive (a rig that shot nothing has proven nothing); exit 1 when
 * any capture fails after its retry.
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "./__shots__";
const VIEWS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
];
const SCHEMES = ["light", "dark"];

/* Repeatable --routes <path> filter for the inner loop. */
const wanted = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--routes") {
    const v = argv[++i];
    if (!v) {
      console.error("shoot: --routes needs a path");
      process.exit(2);
    }
    wanted.push(v);
  } else {
    console.error(`shoot: unknown argument ${argv[i]}`);
    process.exit(2);
  }
}

/* The sitemap is the census. Hosts in <loc> are the production origin
   (https://jarl.no/...) — only the pathname matters; it is re-anchored on
   BASE, which rewrites the host to the local server. */
let xml;
try {
  xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
} catch (e) {
  console.error(`shoot: cannot fetch ${BASE}/sitemap.xml — is the server up? (${e.message ?? e})`);
  process.exit(2);
}
let routes = [...new Set(
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname),
)].sort();
if (wanted.length > 0) routes = routes.filter((r) => wanted.includes(r));

if (routes.length === 0) {
  console.error(
    wanted.length > 0
      ? `shoot: no sitemap route matches ${wanted.join(", ")} — nothing shot, nothing proven.`
      : "shoot: the sitemap yielded zero routes — nothing shot, nothing proven.",
  );
  process.exit(2);
}

mkdirSync(OUT, { recursive: true });

/* Rendered-width probe, evaluated in the page: document overflow with its
   leaf culprits, plus the measured prose column and paper surface. The ch
   figure divides the measured px by a real rendered 1ch inside the element
   itself — the element's own font, loaded and shaped — so it is the same ch
   a stylesheet would mean. (A canvas measureText shortcut lies here: next/
   font's hashed family names defeat the canvas font shorthand parser.)

   `proseW`/`figureW` are measured by SHAPE and exist on every route.
   `paperProseW`/`paperFigureW` are the original `.bp-paper-surface` readings
   and stay null off a paper — kept because the doctrine's numbers were taken
   against them, so a comparison across the recovery must not silently change
   what the column means. */
const probe = () => {
  const chOf = (el, px) => {
    const ruler = document.createElement("span");
    ruler.style.cssText =
      "position:absolute;visibility:hidden;width:100ch;display:inline-block";
    el.appendChild(ruler);
    const hundredCh = ruler.getBoundingClientRect().width;
    ruler.remove();
    return hundredCh > 0 ? Math.round((px / (hundredCh / 100)) * 10) / 10 : null;
  };
  const widthOf = (el) => {
    if (!el) return { px: null, ch: null };
    const px = Math.round(el.getBoundingClientRect().width);
    return { px, ch: chOf(el, px) };
  };
  const vw = document.documentElement.clientWidth;
  const leaves = [
    ...document.querySelectorAll("*"),
  ]
    .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.children.length === 0)
    .map(
      (el) =>
        `${el.tagName}.${String(el.className).slice(0, 40)} sw=${el.scrollWidth} cw=${el.clientWidth}`,
    );
  const paperProse = widthOf(document.querySelector(".bp-paper-surface > p"));
  const paperFigure = widthOf(document.querySelector(".bp-paper-surface"));

  /* The paper selectors above answer `null` on the fourteen project pages
     that have no story — which was most of the site. The width doctrine
     applies to those pages too, so the widest RENDERED prose line and the
     widest RENDERED figure are measured directly, by shape rather than by
     component: a paragraph that owns real text is prose wherever it lives,
     and a Sections archetype, a paper block or a figure is a figure. A
     Band-module element is deliberately absent from the figure ladder: the
     band is full-bleed by definition and would report the viewport width on
     every page, drowning the number that matters. */
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  let prose = { px: null, ch: null };
  for (const el of document.querySelectorAll("p, li, blockquote")) {
    if (!visible(el)) continue;
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ");
    if (own.length < 40) continue;
    const w = widthOf(el);
    if (prose.px === null || w.px > prose.px) prose = w;
  }
  let figure = { px: null, ch: null };
  for (const el of document.querySelectorAll(
    '[class*="Sections-module__"], [class^="bp-"], [class*=" bp-"], figure, img, pre, table',
  )) {
    if (!visible(el)) continue;
    const w = widthOf(el);
    if (figure.px === null || w.px > figure.px) figure = w;
  }

  return {
    scrollW: document.documentElement.scrollWidth,
    clientW: vw,
    leaves: [...new Set(leaves)].slice(0, 5),
    proseW: prose.px,
    proseCh: prose.ch,
    figureW: figure.px,
    figureCh: figure.ch,
    paperProseW: paperProse.px,
    paperProseCh: paperProse.ch,
    paperFigureW: paperFigure.px,
    paperFigureCh: paperFigure.ch,
  };
};

const t0 = Date.now();
const browser = await chromium.launch();
const audit = [];
let captures = 0;
let failures = 0;
let retries = 0;

for (const [view, width, height] of VIEWS) {
  for (const scheme of SCHEMES) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      colorScheme: scheme,
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    for (const route of routes) {
      const slug =
        route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
      const file = `${OUT}/${slug}__${view}__${scheme}.png`;
      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        if (attempt) retries++;
        try {
          const resp = await page.goto(BASE + route, {
            waitUntil: "load",
            timeout: 25000,
          });
          await page.evaluate(() => document.fonts.ready);
          await page.waitForTimeout(300);
          const measured = await page.evaluate(probe);
          await page.screenshot({ path: file, fullPage: true });
          audit.push({
            route,
            view,
            scheme,
            status: resp.status(),
            ...measured,
            overflow: measured.scrollW > measured.clientW + 1,
          });
          ok = true;
        } catch (e) {
          if (attempt === 1) {
            failures++;
            audit.push({ route, view, scheme, error: String(e).split("\n")[0] });
          }
        }
      }
      captures++;
    }
    await ctx.close();
  }
}
await browser.close();

const secs = (Date.now() - t0) / 1000;
writeFileSync(`${OUT}/audit.json`, JSON.stringify(audit, null, 1));
console.log(
  `shoot: captures=${captures} failures=${failures} retries=${retries} ` +
    `routes=${routes.length} wall=${secs.toFixed(1)}s per_capture=${(secs / captures).toFixed(2)}s → ${OUT}/`,
);

const overflowing = audit.filter((a) => a.overflow);
console.log(`shoot: horizontal overflow on ${overflowing.length} capture(s)`);
for (const a of overflowing)
  console.log(
    `  ${a.view} ${a.scheme} ${a.route} ${a.scrollW}/${a.clientW} leaves=${JSON.stringify(a.leaves)}`,
  );

if (failures > 0) process.exit(1);
