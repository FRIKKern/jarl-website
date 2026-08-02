#!/usr/bin/env node
/**
 * The capture rig — every project post, the full review quad, against a cache
 * that lies.
 *
 * THE CACHE IS THE WHOLE PROBLEM. jarl.no answers
 * `cache-control: s-maxage=60, stale-while-revalidate=31535940` and will hand
 * back `x-nextjs-cache: STALE` even for a cache-busted query string. A rig
 * that fetches once photographs whatever the edge happened to be holding —
 * possibly a render from a year ago — and then reports it as today. So every
 * URL is WARMED before it is shot: fetch once (that request is thrown away; its
 * only job is to trip the stale-while-revalidate background render), wait, then
 * fetch again and record what the second answer said. Both verdicts land in the
 * audit. A capture whose warm never reached `HIT` is labelled, not silently
 * shipped.
 *
 * THE MATRIX IS THE QUAD: 1440x900 and 390x844, light and dark — four captures
 * per route, no exceptions, no `mobile: slug === 'barkpark'` shortcuts. The
 * ancestor of this file (tooling/media/epic13/capture-jarl.mjs) shot mobile and
 * dark for one slug out of twenty; the other nineteen were never reviewed at
 * all in three of the four cells.
 *
 * THE VERTICAL-RUN PROBE answers one question: how far can a reader fall
 * through this page without meeting anything but text? It measures the longest
 * unbroken run of prose, in CSS px, between honest visual moments. A moment is
 * a Sections-module ARCHETYPE (split, timeline, grid, steps, quote, statBand,
 * duel, lineage, mediaBand, formBand), a `bp-*` block inside a paper surface,
 * or an `img`/`figure`. A `Band-module` element is NEVER a moment: a band is
 * the site's only layout primitive (see Band.tsx) — it paints edge to edge and
 * draws at most a hairline, so counting it would let a page of pure prose score
 * as richly illustrated simply by being well-structured.
 *
 * Usage:
 *   node scripts/capture-jarl.mjs                          # 21 routes x quad
 *   node scripts/capture-jarl.mjs --smoke prosjekter/doey   # one route, quad
 *   node scripts/capture-jarl.mjs --routes /prosjekter/scaffy --routes /om
 *
 * BASE (default https://jarl.no) and OUT (default ./__shots__) override the
 * origin and the output dir. The route census comes from the CMS project store
 * anonymously, so the rig and the content gates read the same truth.
 *
 * Exit 2: nothing was shot, or the census came back empty — a rig that shot
 * nothing has proven nothing. Exit 1: a capture failed after its retry, or a
 * --smoke quad did not produce four distinct images (four identical PNGs mean
 * the viewport and colour-scheme switches are not reaching the page).
 */

import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const BASE = (process.env.BASE ?? "https://jarl.no").replace(/\/$/, "");
const OUT = process.env.OUT ?? "./__shots__";
const CMS = (process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud").replace(
  /\/$/,
  "",
);

const VIEWS = [
  ["desktop", 1440, 900],
  ["mobile", 390, 844],
];
const SCHEMES = ["light", "dark"];

/* ---- arguments ---------------------------------------------------------- */

const argv = process.argv.slice(2);
const wanted = [];
let smoke = null;
for (let i = 0; i < argv.length; i++) {
  const flag = argv[i];
  if (flag === "--smoke" || flag === "--routes") {
    const v = argv[++i];
    if (!v) {
      console.error(`capture-jarl: ${flag} needs a route`);
      process.exit(2);
    }
    const path = v.startsWith("/") ? v : `/${v}`;
    if (flag === "--smoke") smoke = path;
    wanted.push(path);
  } else {
    console.error(`capture-jarl: unknown argument ${flag}`);
    process.exit(2);
  }
}

/* ---- the census --------------------------------------------------------- */

/** Every published project, from the CMS rather than from a list in this file.
    A hand-kept slug array goes stale the day someone publishes a 21st post,
    and a rig that silently skips the new post is worse than no rig. */
async function census() {
  const res = await fetch(`${CMS}/v1/data/query/production/project?limit=100`);
  if (!res.ok) {
    console.error(`capture-jarl: HTTP ${res.status} from ${CMS} — aborting.`);
    process.exit(2);
  }
  const docs = (await res.json())?.result?.documents ?? [];
  const slugs = docs.map((d) => d.slug).filter(Boolean).sort();
  if (slugs.length === 0) {
    console.error(
      "capture-jarl: the project store answered zero slugs — refusing to\n" +
        "  conclude anything from an empty census.",
    );
    process.exit(2);
  }
  return ["/prosjekter", ...slugs.map((s) => `/prosjekter/${s}`)];
}

let routes = await census();
const censusSize = routes.length;
if (wanted.length > 0) {
  const missing = wanted.filter((w) => !routes.includes(w));
  routes = wanted; // an explicit route is shot even if it is not a project page
  if (missing.length > 0)
    console.log(`capture-jarl: off-census route(s) ${missing.join(", ")}`);
}

/* ---- cache warming ------------------------------------------------------ */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const WARM_WAIT_MS = Number(process.env.WARM_WAIT_MS ?? 2500);

/** Fetch, discard, wait, fetch again.
 *
 * The first request exists to be thrown away: under
 * stale-while-revalidate it is what triggers the background re-render, and
 * its own body is by definition the stale one. The wait gives that render
 * time to land. The second request is the one whose verdict we keep.
 * `fresh` is true only when the second answer was a HIT on a revalidated
 * entry — STALE twice means the edge is still serving an old render and the
 * capture must be read with that written on it. */
async function warm(url) {
  const verdict = async () => {
    const res = await fetch(url, { redirect: "follow" });
    await res.arrayBuffer(); // drain, or the connection stays half-open
    return {
      status: res.status,
      cache: res.headers.get("x-nextjs-cache") ?? "-",
      age: res.headers.get("age") ?? "-",
    };
  };
  let first, second;
  try {
    first = await verdict();
    await sleep(WARM_WAIT_MS);
    second = await verdict();
  } catch (e) {
    return { error: String(e.message ?? e), fresh: false };
  }
  return {
    first: first.cache,
    second: second.cache,
    status: second.status,
    age: second.age,
    fresh: second.cache === "HIT" || second.cache === "MISS",
  };
}

/* ---- the in-page probe -------------------------------------------------- */

/** Runs inside the page. Everything it needs is inlined: page.evaluate ships
    the source, not the closure. */
const probe = () => {
  const KINDS = new Set([
    "split",
    "timeline",
    "grid",
    "steps",
    "quote",
    "statBand",
    "duel",
    "lineage",
    "mediaBand",
    "formBand",
  ]);
  const classes = (el) =>
    (typeof el.className === "string"
      ? el.className
      : (el.className?.baseVal ?? "")
    ).split(/\s+/);
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.width > 0;
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY };
  };

  /* -- moments -----------------------------------------------------------
     A CSS-module class is `<File>-module__<hash>__<local>`. That gives the
     probe an exact grip on WHICH component drew an element, which is the
     only reason the Band exclusion can be stated as a fact rather than a
     guess: a Band element is any class whose file part is `Band`, and no
     such element is ever a moment. */
  const moments = [];
  const kindsSeen = [];
  for (const el of document.querySelectorAll("[class]")) {
    if (!visible(el)) continue;
    let why = null;
    for (const c of classes(el)) {
      const m = /^([A-Za-z0-9]+)-module__[A-Za-z0-9_-]+__(.+)$/.exec(c);
      if (m) {
        if (m[1] === "Band") continue; // the layout primitive is never a moment
        if (m[1] === "Sections" && KINDS.has(m[2])) {
          why = `section:${m[2]}`;
          kindsSeen.push(m[2]);
        }
      } else if (
        c.startsWith("bp-") &&
        c !== "bp-paper-surface" &&
        !c.startsWith("bp-role-")
      ) {
        why = why ?? `block:${c}`;
      }
    }
    if (why) moments.push({ why, ...box(el) });
  }
  for (const el of document.querySelectorAll("img, figure")) {
    if (!visible(el)) continue;
    moments.push({ why: el.tagName.toLowerCase(), ...box(el) });
  }

  /* -- text boxes --------------------------------------------------------
     Only elements that own a non-empty text node directly. A wrapper
     inherits its children's text and would otherwise span the whole page. */
  const textBoxes = [];
  for (const el of document.querySelectorAll("p, h1, h2, h3, h4, li, blockquote, dd, dt, td, th")) {
    if (!visible(el)) continue;
    const own = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 0,
    );
    if (!own) continue;
    const b = box(el);
    textBoxes.push({ ...b, text: el.textContent.trim().slice(0, 90) });
  }
  textBoxes.sort((a, b) => a.top - b.top);

  /* -- merge moments into opaque bands ----------------------------------
     A figure inside a mediaBand is one moment, not two. */
  moments.sort((a, b) => a.top - b.top);
  const merged = [];
  for (const m of moments) {
    const last = merged[merged.length - 1];
    if (last && m.top <= last.bottom) {
      last.bottom = Math.max(last.bottom, m.bottom);
      last.why += `+${m.why}`;
    } else merged.push({ ...m });
  }

  /* -- the runs ----------------------------------------------------------
     A run is the vertical extent of TEXT that falls in a gap between two
     moments. Empty air is not a run: a reader scrolling past 900px of
     padding is bored, but not reading. */
  const docH = document.documentElement.scrollHeight;
  const gaps = [];
  let cursor = 0;
  for (const m of merged) {
    if (m.top > cursor) gaps.push([cursor, m.top]);
    cursor = Math.max(cursor, m.bottom);
  }
  if (cursor < docH) gaps.push([cursor, docH]);

  const runs = [];
  for (const [a, b] of gaps) {
    const inside = textBoxes.filter((t) => t.bottom > a && t.top < b);
    if (inside.length === 0) continue;
    const top = Math.max(a, Math.min(...inside.map((t) => t.top)));
    const bottom = Math.min(b, Math.max(...inside.map((t) => t.bottom)));
    if (bottom - top <= 0) continue;
    runs.push({
      px: Math.round(bottom - top),
      from: Math.round(top),
      to: Math.round(bottom),
      lines: inside.length,
      opens: inside[0].text,
    });
  }
  runs.sort((a, b) => b.px - a.px);

  const byWhy = {};
  for (const m of merged) byWhy[m.why] = (byWhy[m.why] ?? 0) + 1;

  return {
    docH,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    moments: merged.length,
    sectionKinds: [...new Set(kindsSeen)].sort(),
    momentsBy: byWhy,
    longestRunPx: runs.length > 0 ? runs[0].px : 0,
    longestRun: runs[0] ?? null,
    runs: runs.slice(0, 5),
  };
};

/* ---- the run ------------------------------------------------------------ */

mkdirSync(OUT, { recursive: true });
const t0 = Date.now();
const browser = await chromium.launch();
const audit = [];
let captures = 0;
let failures = 0;
let staleWarms = 0;

for (const route of routes) {
  const slug =
    route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
  const heat = await warm(BASE + route);
  if (!heat.fresh) staleWarms += 1;

  for (const [view, width, height] of VIEWS) {
    for (const scheme of SCHEMES) {
      const ctx = await browser.newContext({
        viewport: { width, height },
        colorScheme: scheme,
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        isMobile: view === "mobile",
        hasTouch: view === "mobile",
      });
      const page = await ctx.newPage();
      const file = `${OUT}/${slug}/${slug}__${view}__${scheme}.png`;
      mkdirSync(dirname(file), { recursive: true });
      let done = false;
      for (let attempt = 0; attempt < 2 && !done; attempt++) {
        try {
          /* `load` + fonts, never `networkidle`: a warm next server keeps
             connections open and networkidle times out at 30s per route. */
          const resp = await page.goto(BASE + route, {
            waitUntil: "load",
            timeout: 30000,
          });
          await page.evaluate(() => document.fonts.ready);

          /* Force every deferred image to decode BEFORE the shot. A lazy
             image below the fold never loads in a headless fullPage
             capture, and a blank frame is not a light page — it is a lie
             about a heavy one. Flip loading to eager, walk the document
             once so the intersection observers fire, then wait on the
             decode rather than on a guessed timeout. */
          await page.evaluate(async () => {
            for (const img of document.querySelectorAll("img")) {
              img.loading = "eager";
              if (img.getAttribute("decoding") === "async")
                img.setAttribute("decoding", "sync");
            }
            const step = Math.max(200, innerHeight - 100);
            for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
              scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 60));
            }
            scrollTo(0, 0);
            await Promise.all(
              [...document.querySelectorAll("img")].map((i) =>
                i.complete ? null : i.decode().catch(() => null),
              ),
            );
          });
          await page.waitForTimeout(400);

          const measured = await page.evaluate(probe);
          await page.screenshot({ path: file, fullPage: true });
          const sha = createHash("sha256")
            .update(readFileSync(file))
            .digest("hex");
          audit.push({
            route,
            view,
            scheme,
            status: resp?.status() ?? null,
            warm: heat,
            file,
            sha256: sha,
            ...measured,
            overflow: measured.scrollW > measured.clientW + 1,
          });
          done = true;
        } catch (e) {
          if (attempt === 1) {
            failures += 1;
            audit.push({
              route,
              view,
              scheme,
              warm: heat,
              error: String(e).split("\n")[0],
            });
          }
        }
      }
      captures += 1;
      await ctx.close();
    }
  }

  /* One audit.json per route, next to that route's four PNGs — the capture
     and the numbers taken from it never get separated. */
  const rows = audit.filter((a) => a.route === route);
  writeFileSync(
    `${OUT}/${slug}/audit.json`,
    JSON.stringify({ route, base: BASE, warm: heat, captures: rows }, null, 1),
  );
  const worst = Math.max(0, ...rows.map((r) => r.longestRunPx ?? 0));
  console.log(
    `capture-jarl: ${route.padEnd(38)} warm=${heat.first ?? "err"}->${heat.second ?? "err"} ` +
      `moments=${rows[0]?.moments ?? "-"} longest-run=${worst}px`,
  );
}

await browser.close();

writeFileSync(
  `${OUT}/audit.json`,
  JSON.stringify(
    { base: BASE, census: censusSize, routes, generated: new Date().toISOString(), captures: audit },
    null,
    1,
  ),
);

const secs = (Date.now() - t0) / 1000;
console.log(
  `capture-jarl: captures=${captures} failures=${failures} routes=${routes.length} ` +
    `stale-warms=${staleWarms} wall=${secs.toFixed(1)}s -> ${OUT}/`,
);

const overflowing = audit.filter((a) => a.overflow);
if (overflowing.length > 0) {
  console.log(`capture-jarl: horizontal overflow on ${overflowing.length} capture(s)`);
  for (const a of overflowing)
    console.log(`  ${a.view} ${a.scheme} ${a.route} ${a.scrollW}/${a.clientW}`);
}

const ranked = audit
  .filter((a) => a.longestRunPx)
  .sort((a, b) => b.longestRunPx - a.longestRunPx)
  .slice(0, 5);
if (ranked.length > 0) {
  console.log("capture-jarl: longest unbroken text runs");
  for (const a of ranked)
    console.log(
      `  ${String(a.longestRunPx).padStart(5)}px ${a.view}/${a.scheme} ${a.route}` +
        ` @${a.longestRun.from}-${a.longestRun.to} "${a.longestRun.opens.slice(0, 50)}"`,
    );
}

/* The smoke's entire claim is that the quad is a quad. Four identical hashes
   mean the viewport or the colour-scheme switch never reached the page, and a
   green run would then be certifying nothing. */
if (smoke) {
  const rows = audit.filter((a) => a.route === smoke && a.sha256);
  const distinct = new Set(rows.map((a) => a.sha256));
  console.log(
    `capture-jarl: smoke ${smoke} -> ${rows.length} capture(s), ${distinct.size} distinct image(s)`,
  );
  for (const a of rows) console.log(`  ${a.view}/${a.scheme} ${a.sha256.slice(0, 12)} ${a.file}`);
  if (rows.length !== 4 || distinct.size !== 4) {
    console.error(
      "capture-jarl: the smoke quad is not four distinct images — the matrix is\n" +
        "  not reaching the page, and every capture in a full run would be suspect.",
    );
    process.exit(1);
  }
}

if (failures > 0) process.exit(1);
if (captures === 0) process.exit(2);
