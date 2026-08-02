#!/usr/bin/env node
/**
 * Kilde-loven for pictures — a capture must say where it came from and when.
 *
 * Every image on this site is a real screenshot or a real recording of a real
 * thing, and the caption is the only place that claim is testable. Two parts
 * have to be there: a NORWEGIAN DATE (what state of the thing this is — a
 * screenshot of a site that has since been redesigned is not a lie, an undated
 * one is) and an ORIGIN TOKEN (which thing it is a picture of).
 *
 * THE `Kilde:` GREP IS THE WRONG GATE. It reads like the convention and is
 * not one: only 12 of 45 captioned assets open with it. The other 33 say
 * "Skjermbilde av <url>, fanget <dato>" or "Opptak <dato> mot <host>", which
 * satisfy the law completely. A `^Kilde:` gate would fail 33 honest captions
 * and pass any caption that opened with the word and then said nothing. So
 * the gate tests the two SEMANTIC parts, in any order, anywhere in the
 * caption, spelled any of the ways the corpus already spells them.
 *
 * Wired means REACHABLE FROM A PUBLISHED DOCUMENT — a project hero, a page
 * mediaBand, a paper figure or asciicast. The media library's 47 assets are
 * not the subject: 28 of them are unwired, and an asset nobody points at
 * makes no claim to anyone. It also needs an admin token to read, and this
 * gate runs anonymously so CI can run it.
 *
 * A wired image with NO caption at all is reported as `ingen-bildekilde:` and
 * counted in every summary line, but does not fail the default run: it is a
 * content gap, not a false claim, and failing on it would have blocked this
 * gate from ever landing. `--strict` makes it fatal, and that is where this
 * gate is going once the corpus carries a caption on every wired image.
 *
 * Local run:  node scripts/check-image-kilde.mjs [--strict]
 *
 * Exit 1: a caption that makes a claim without dating or sourcing it.
 * Exit 2: nothing was scanned.
 */

const CMS = (process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud").replace(
  /\/$/,
  "",
);
const strict = process.argv.includes("--strict");

const MONTHS =
  "januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember";

/** "31. juli 2026" — the full form — or the month-precision form "juli 2026",
    which is what a caption says when the capture is dated to a month and the
    author refused to invent a day. Both state a time; neither invents one. */
const DATE = new RegExp(`(\\b\\d{1,2}\\.\\s*)?\\b(${MONTHS})\\s+20\\d\\d\\b`, "i");

/** The six ways this corpus names an origin. Any one is enough. */
const ORIGINS = [
  { name: "url", re: /https?:\/\/\S+/i },
  { name: "vert", re: /\b[a-z0-9][a-z0-9-]*\.(no|com|cloud|io|dev|org)\b/i },
  { name: "opptak", re: /\.cast\b|\bopptak(et)?\b/i },
  { name: "kilde", re: /\bKilde:/ },
  { name: "skjermbilde-av", re: /\bskjermbilde av\b/i },
  { name: "commit", re: /\b[0-9a-f]{7,40}\b/ },
];

const norm = (s) =>
  String(s).normalize("NFC").replace(/[   ]/g, " ").replace(/\s+/g, " ").trim();

async function store(type) {
  let res;
  try {
    res = await fetch(`${CMS}/v1/data/query/production/${type}?limit=100`);
  } catch (e) {
    console.error(`check-image-kilde: ${CMS} unreachable (${e.message ?? e}) — aborting.`);
    process.exit(2);
  }
  if (!res.ok) {
    console.error(`check-image-kilde: HTTP ${res.status} fetching ${type} — aborting.`);
    process.exit(2);
  }
  const docs = (await res.json())?.result?.documents ?? [];
  if (docs.length === 0) {
    console.error(
      `check-image-kilde: zero ${type} documents from ${CMS} — refusing to\n` +
        "  conclude anything from an empty scan.",
    );
    process.exit(2);
  }
  return docs;
}

/* ---- the census of wired images ----------------------------------------
   Mirrors the renderers rather than crawling blindly: ProjectVisual reads
   `project.image`, Sections' MediaBand reads `section.image`, and
   PortableDocSurface reads the paper's blocks — where a `figure` carries the
   caption and its `child` carries the src. A paper exposes the same blocks
   twice (`blocks` and `body.blocks`); the renderer prefers the first, so the
   gate does too. */

const wired = [];
const add = (where, src, caption) => {
  if (typeof src !== "string" || !src.includes("/media/files/")) return;
  wired.push({ where, file: src.split("/").pop(), caption: caption ? norm(caption) : null });
};

for (const doc of await store("project")) {
  const at = `project/${doc._id}`;
  add(`${at}#image`, doc.image?.src, doc.image?.caption);
  (doc.sections ?? []).forEach((s, i) =>
    add(`${at}#sections[${i}].image`, s.image?.src, s.image?.caption),
  );
}
for (const doc of await store("page")) {
  const at = `page/${doc._id}`;
  add(`${at}#image`, doc.image?.src, doc.image?.caption);
  (doc.sections ?? []).forEach((s, i) =>
    add(`${at}#sections[${i}].image`, s.image?.src, s.image?.caption),
  );
}
for (const doc of await store("paper")) {
  const at = `paper/${doc._id}`;
  const blocks = doc.blocks ?? doc.body?.blocks ?? [];
  blocks.forEach((b, i) => {
    add(`${at}#blocks[${i}]`, b.src, b.caption);
    add(`${at}#blocks[${i}].child`, b.child?.src, b.caption ?? b.child?.caption);
  });
}

if (wired.length === 0) {
  console.error(
    "check-image-kilde: not one wired image found across project/page/paper —\n" +
      "  the walk no longer matches the renderers, and a gate that scanned\n" +
      "  nothing has proven nothing.",
  );
  process.exit(2);
}

/* ---- the verdict -------------------------------------------------------- */

const noCaption = [];
const noDate = [];
const noOrigin = [];
const originsUsed = {};

for (const img of wired) {
  if (!img.caption) {
    noCaption.push(img);
    continue;
  }
  if (!DATE.test(img.caption)) noDate.push(img);
  const hit = ORIGINS.find((o) => o.re.test(img.caption));
  if (hit) originsUsed[hit.name] = (originsUsed[hit.name] ?? 0) + 1;
  else noOrigin.push(img);
}

const captioned = wired.length - noCaption.length;
const clean = captioned - new Set([...noDate, ...noOrigin]).size;

console.log(
  `check-image-kilde: ${wired.length} wired images, ${captioned} captioned, ` +
    `${clean} carrying both a Norwegian date and an origin ` +
    `(${Object.entries(originsUsed).map(([k, v]) => `${k}:${v}`).join(" ")}).`,
);

for (const img of noCaption) console.log(`  ingen-bildekilde:${img.where} (${img.file})`);
for (const img of noDate)
  console.log(`  ingen-dato:${img.where} — "${img.caption.slice(0, 70)}"`);
for (const img of noOrigin)
  console.log(`  ingen-opphav:${img.where} — "${img.caption.slice(0, 70)}"`);

const fatal = noDate.length + noOrigin.length + (strict ? noCaption.length : 0);
if (fatal > 0) {
  console.error(
    `\ncheck-image-kilde: ${fatal} caption(s) short of the law. Every picture on\n` +
      "  this site claims to be a capture of a real thing at a real time — say\n" +
      "  which thing (a URL, a host, a recording, a commit) and when (a\n" +
      "  Norwegian date), or do not publish the picture.",
  );
  process.exit(1);
}

if (noCaption.length > 0)
  console.log(
    `check-image-kilde: ${noCaption.length} wired image(s) carry no caption at all — ` +
      "a gap, not a false claim. --strict fails on these.",
  );
console.log("check-image-kilde: every wired caption dates and sources its picture.");
