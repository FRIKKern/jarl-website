/**
 * The duel figure, given a scale.
 *
 * The canonical engine renders `bp-duel` as a three-column table: row label
 * (carrying the delta), value A, value B. Everything about that is true and
 * nothing about it is a comparison — four rows spanning 1478 to 12788 is an
 * 8.6× spread the reader cannot feel, because no mark is drawn at all. The
 * label sits at the far left and its numbers 600px away at the far right,
 * the delta — which IS the finding — is set at 11px under the label, and the
 * two series are told apart only by the colour of the numerals themselves,
 * which is the one encoding the dataviz rules forbid outright.
 *
 * So jarl gives the table a scale. This module rewrites the emitted markup —
 * it does NOT re-render it — inserting one track cell per row carrying a
 * dumbbell: two dots on a shared linear scale from zero, joined by a rule,
 * with the delta as a direct label at the far end of the connector. Identity
 * moves onto the dots; the numbers go back to being ink.
 *
 * WHY a string rewrite and not CSS: a magnitude has to be computed from the
 * values, and CSS cannot read the text of an element. WHY not upstream: the
 * engine is vendored and canonical here — jarl does not fork it. The clean
 * upstream fix is described at the bottom of this file.
 *
 * Pure and deterministic, so SSR and hydration agree byte for byte. If the
 * markup is not EXACTLY the shape below — a re-vendored engine, a new
 * column — every match fails and the original html is returned untouched,
 * so the worst case is today's table, never a broken one.
 */

/** `<div class="bp-duel">` up to the end of its table. */
const DUEL = /<div class="bp-duel">(<table class="bp-duel__table">.*?<\/table>)/gs;

const HEAD =
  /^<thead><tr><th class="bp-duel__th"><\/th>(<th class="bp-duel__th bp-duel__th--a" scope="col">.*?<\/th>)(<th class="bp-duel__th" scope="col">.*?<\/th>)<\/tr><\/thead>/s;

const ROW =
  /<tr class="bp-duel__row"><th class="bp-duel__label" scope="row">(.*?)(<span class="bp-duel__delta">.*?<\/span>)?<\/th><td class="bp-duel__val bp-duel__val--a">(.*?)<\/td><td class="bp-duel__val">(.*?)<\/td><\/tr>/gs;

/** Text of a fragment, tags and entities gone. */
function text(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)));
}

/**
 * A Norwegian measured number, or null.
 *
 * Thousands are separated by a space of some width, the decimal mark is a
 * comma, and a minus may be the typographic U+2212. Anything else — a ratio
 * ("3 av 5"), a range ("8–29"), a version — is deliberately NOT a number
 * here: a figure that cannot place every one of its values on the scale
 * does not get a scale.
 */
export function parseMeasure(raw: string): number | null {
  const s = text(raw)
    .replace(/[\s   ]/g, "")
    .replace(/−/g, "-")
    .trim();
  if (!/^-?\d+(?:,\d+)?$/.test(s)) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const pct = (n: number) => `${Math.round(n * 10000) / 100}%`;

interface Row {
  label: string;
  delta: string;
  a: string;
  b: string;
  na: number;
  nb: number;
}

function trackCell(r: Row, max: number): string {
  const fa = max > 0 ? Math.min(1, Math.max(0, r.na / max)) : 0;
  const fb = max > 0 ? Math.min(1, Math.max(0, r.nb / max)) : 0;
  const lo = pct(Math.min(fa, fb));
  const hi = pct(Math.max(fa, fb));
  const delta = r.delta
    ? `<span class="jarl-duel__delta" style="left:${hi}">${text(r.delta)}</span>`
    : "";
  return (
    `<td class="jarl-duel__track" aria-hidden="true">` +
    `<span class="jarl-duel__plot" style="--lo:${lo};--hi:${hi}">` +
    `<span class="jarl-duel__rule"></span>` +
    `<span class="jarl-duel__dot jarl-duel__dot--b" style="left:${pct(fb)}"></span>` +
    `<span class="jarl-duel__dot jarl-duel__dot--a" style="left:${pct(fa)}"></span>` +
    delta +
    `</span></td>`
  );
}

/** The scale's own caption: where zero is and where the top of the scale is. */
function axisCell(max: string): string {
  return (
    `<th class="bp-duel__th jarl-duel__th--track" aria-hidden="true">` +
    `<span class="jarl-duel__axis"><span>0</span><span>${max}</span></span>` +
    `</th>`
  );
}

/** Rewrite one duel table. Returns null when the shape is not recognised. */
function enhanceDuel(table: string): string | null {
  const head = table
    .slice("<table class=\"bp-duel__table\">".length)
    .match(HEAD);
  if (!head) return null;

  const rows: Row[] = [];
  ROW.lastIndex = 0;
  for (let m = ROW.exec(table); m !== null; m = ROW.exec(table)) {
    const na = parseMeasure(m[3]);
    const nb = parseMeasure(m[4]);
    /* one unplaceable value and the whole figure stays a table */
    if (na === null || nb === null) return null;
    rows.push({
      label: m[1],
      delta: m[2] ?? "",
      a: m[3],
      b: m[4],
      na,
      nb,
    });
  }
  if (rows.length === 0) return null;

  const values = rows.flatMap((r) => [r.na, r.nb]);
  const max = Math.max(...values);
  /* a shared scale rooted at zero, or the marks would encode nothing */
  if (!(max > 0) || Math.min(...values) < 0) return null;
  /* the top of the scale, printed exactly as the author printed it */
  const top = rows.find((r) => r.na === max || r.nb === max) as Row;
  const topLabel = text(top.na === max ? top.a : top.b);

  const body = rows
    .map(
      (r) =>
        `<tr class="bp-duel__row">` +
        `<th class="bp-duel__label" scope="row">${r.label}</th>` +
        trackCell(r, max) +
        `<td class="bp-duel__val bp-duel__val--a">${r.a}</td>` +
        `<td class="bp-duel__val">${r.b}</td>` +
        `</tr>`,
    )
    .join("");

  return (
    `<table class="bp-duel__table">` +
    `<thead><tr><th class="bp-duel__th"></th>` +
    axisCell(topLabel) +
    head[1] +
    head[2] +
    `</tr></thead><tbody>${body}</tbody></table>`
  );
}

/**
 * Give every recognisable duel on a rendered paper its scale.
 *
 * Called on the html string the engine returns, before it reaches the DOM —
 * see src/components/PortableDocSurface.tsx.
 */
export function enhanceDuels(html: string): string {
  if (!html.includes('class="bp-duel"')) return html;
  DUEL.lastIndex = 0;
  return html.replace(DUEL, (whole, table: string) => {
    const next = enhanceDuel(table);
    return next === null ? whole : `<div class="bp-duel jarl-duel">${next}`;
  });
}

/* ------------------------------------------------------------------------
 * What would make this module unnecessary, upstream (@barkpark/react,
 * blocks/core.ts `duelRowHtml` / `duel`):
 *
 *   1. Emit the parsed magnitudes the renderer already has in hand, as
 *      custom properties on the row — `style="--bp-duel-a:.116;--bp-duel-b:.166"`
 *      — plus `--bp-duel-max` on `.bp-duel`. That single change moves the
 *      whole figure into CSS, here and in Studio, with no string rewriting
 *      anywhere.
 *   2. Emit the delta in its own cell rather than inside the row label, so
 *      it can be positioned against the scale instead of against the label.
 *   3. Stop carrying series identity in `.bp-duel__val--a`'s text colour;
 *      let a mark carry it. The drakt below already un-does this locally.
 *
 * Until then the rewrite lives here, on jarl's side of the vendor line.
 * ---------------------------------------------------------------------- */
