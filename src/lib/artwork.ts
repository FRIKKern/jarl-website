/**
 * Deterministic generative artwork.
 *
 * The site has no photography and refuses to fake any, so every project gets
 * a drawing instead: a plotted contour field, seeded from the project slug.
 * The same slug always produces the same figure — it is an identity, not a
 * decoration — and the figure is always non-empty, so no surface can ever
 * fall back to an empty box.
 *
 * This module owns GEOMETRY ONLY. Two renderers consume it:
 *  - src/components/Artwork.tsx — real SVG in the DOM, strokes bound to
 *    var(--color-*), so the drawing follows the band it sits on and the
 *    reader's color scheme;
 *  - `artworkSvg()` below — a flat SVG string with literal hex from the
 *    palette mirror, for next/og, which never sees a stylesheet.
 *
 * The character is plotter, not paint: a faint measured grid, a stack of
 * ruled contour lines, one of them in the accent, one filled tick. Nothing
 * is random at render time and nothing is soft.
 */

import { token } from "./palette";

/* ---- seeded randomness ------------------------------------------------- */

/** Exported for the card grid's ground parity — see ProjectCard. */
export function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — small, fast, and identical on every machine. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- geometry ---------------------------------------------------------- */

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Contour {
  d: string;
  accent: boolean;
}

export interface Artwork {
  width: number;
  height: number;
  grid: Line[];
  contours: Contour[];
  /** The one filled mark — a plotted station on the field. */
  tick: { cx: number; cy: number; r: number };
  /** Baseline under the field, the way a plotter closes an axis. */
  baseline: Line;
}

const round = (n: number) => Math.round(n * 100) / 100;

export interface ArtworkOptions {
  /** Calm the central horizontal band so serif type can stand ON the field.
      The contours keep their frequencies and phases — the same terrain —
      but their amplitude is damped toward flat through the middle, and the
      accent line and the filled tick are re-parked outside it. The quiet is
      composed into the drawing, not painted over it: no scrim, no veil. */
  textSafe?: boolean;
}

/** How far out from the vertical center the calm band reaches (of half-height),
    and where full amplitude is restored. Between the two, a linear ramp. */
const CALM_INNER = 0.26;
const CALM_OUTER = 0.56;
/** Amplitude left inside the calm band — near-flat rules, not erased lines. */
const CALM_FLOOR = 0.14;

/** 1 at the edges, CALM_FLOOR through the middle, ramped between. */
function calmEnvelope(y: number, height: number): number {
  const cd = Math.abs(y - height / 2) / (height / 2);
  const t = Math.min(1, Math.max(0, (cd - CALM_INNER) / (CALM_OUTER - CALM_INNER)));
  return CALM_FLOOR + (1 - CALM_FLOOR) * t;
}

/**
 * Build the figure for a seed at a given pixel size.
 *
 * Everything scales off the box, so the same seed reads as the same drawing
 * at 640×260 on a card and at 460×630 on a social image. `textSafe` damps
 * the middle of the field (see ArtworkOptions) WITHOUT re-rolling anything:
 * the random stream is consumed in the same order, so a seed keeps the same
 * terrain whether or not text will stand on it.
 */
export function artwork(
  seed: string,
  width: number,
  height: number,
  opts: ArtworkOptions = {},
): Artwork {
  const random = makeRandom(hashSeed(seed || "jarl"));

  const padX = width * 0.08;
  const padY = height * 0.12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  /* -- the measured grid -- */
  const cols = 4 + Math.floor(random() * 4); // 4–7
  const rows = 3 + Math.floor(random() * 3); // 3–5
  const grid: Line[] = [];
  for (let i = 1; i < cols; i++) {
    const x = round(padX + (innerW * i) / cols);
    grid.push({ x1: x, y1: round(padY), x2: x, y2: round(padY + innerH) });
  }
  for (let i = 1; i < rows; i++) {
    const y = round(padY + (innerH * i) / rows);
    grid.push({ x1: round(padX), y1: y, x2: round(padX + innerW), y2: y });
  }

  /* -- the contour stack -- */
  const count = 7 + Math.floor(random() * 5); // 7–11
  const spacing = innerH / (count + 1);
  const accentAt = 1 + Math.floor(random() * (count - 2));

  /* two frequencies per figure, shared by every line so the stack reads as
     one terrain rather than a pile of unrelated waves */
  const f1 = 1.2 + random() * 2.2;
  const f2 = 2.6 + random() * 3.4;
  const phase = random() * Math.PI * 2;
  const drift = 0.35 + random() * 0.5;

  /* textSafe: the accent must not shout inside the calm band. The draw above
     already happened (stream order!), so the pick is REMAPPED, not re-rolled:
     walk outward from the drawn index to the nearest contour whose baseline
     clears the band. Deterministic, and a no-op without textSafe. */
  const contourY = (i: number) => padY + spacing * (i + 1);
  let accent = accentAt;
  if (opts.textSafe) {
    const clear = (i: number) =>
      Math.abs(contourY(i) - height / 2) / (height / 2) > CALM_OUTER * 0.8;
    for (let step = 0; step < count && !clear(accent); step++) {
      const up = accentAt - step - 1;
      const down = accentAt + step + 1;
      if (down < count && clear(down)) accent = down;
      else if (up >= 0 && clear(up)) accent = up;
    }
  }

  const samples = 72;
  const contours: Contour[] = [];
  for (let i = 0; i < count; i++) {
    const baseY = contourY(i);
    /* a bell across the stack: the middle lines carry the ridge */
    const bell = Math.sin((Math.PI * (i + 1)) / (count + 1)) ** 1.4;
    let amp = spacing * 1.18 * bell * (0.6 + random() * 0.45);
    if (opts.textSafe) amp *= calmEnvelope(baseY, height);
    const lineShift = i * drift;

    let d = "";
    for (let s = 0; s <= samples; s++) {
      const t = s / samples;
      const a = t * Math.PI * 2;
      const y =
        baseY -
        amp *
          (Math.sin(f1 * a + phase + lineShift) * 0.68 +
            Math.sin(f2 * a + phase * 1.7 - lineShift) * 0.32);
      const x = padX + innerW * t;
      d += `${s === 0 ? "M" : "L"}${round(x)} ${round(y)}`;
      if (s < samples) d += " ";
    }
    contours.push({ d, accent: i === accent });
  }

  /* -- the one filled mark, parked on a grid intersection -- */
  const tickCol = 1 + Math.floor(random() * (cols - 1));
  const tickRow = 1 + Math.floor(random() * (rows - 1));
  let tickY = padY + (innerH * tickRow) / rows;
  if (opts.textSafe) {
    /* the filled mark leaves the calm band too. Few grids have an interior
       row outside it (3–5 rows cluster around the middle), so the search
       is honest about failing: the best clearing row wins, and when none
       clears, the mark parks on the BASELINE — the plotter's own axis,
       always below the calm. */
    const rowY = (r: number) => padY + (innerH * r) / rows;
    const cd = (y: number) => Math.abs(y - height / 2) / (height / 2);
    if (cd(tickY) < CALM_OUTER) {
      let best = -1;
      for (let r = 1; r < rows; r++) {
        if (cd(rowY(r)) >= CALM_OUTER && (best === -1 || cd(rowY(r)) > cd(rowY(best)))) {
          best = r;
        }
      }
      tickY = best === -1 ? height - padY * 0.45 : rowY(best);
    }
  }
  const tick = {
    cx: round(padX + (innerW * tickCol) / cols),
    cy: round(tickY),
    r: round(Math.min(width, height) * 0.026 + 2),
  };

  const baseY = round(height - padY * 0.45);
  const baseline: Line = {
    x1: round(padX),
    y1: baseY,
    x2: round(width - padX),
    y2: baseY,
  };

  return { width, height, grid, contours, tick, baseline };
}

/* ---- flat SVG, for surfaces that cannot read CSS ----------------------- */

/**
 * The same figure as a standalone SVG string, coloured from the palette
 * mirror. Used by next/og via a data URI, exactly like the monogram.
 */
export function artworkSvg(
  seed: string,
  width: number,
  height: number,
  family: "paper" | "ink" = "paper",
  scheme: "light" | "dark" = "light",
): string {
  const art = artwork(seed, width, height);
  const line = token(`--${family}-line`, scheme);
  const ink = token(`--${family}-muted`, scheme);
  const accent = token(`--${family}-accent`, scheme);

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">`,
    `<g stroke="${line}" stroke-width="1">`,
    ...art.grid.map(
      (l) => `<path d="M${l.x1} ${l.y1}L${l.x2} ${l.y2}"/>`,
    ),
    `</g>`,
    `<g fill="none" stroke-linecap="round">`,
    ...art.contours.map(
      (c) =>
        `<path d="${c.d}" stroke="${c.accent ? accent : ink}" stroke-width="${
          c.accent ? 2 : 1
        }" opacity="${c.accent ? 1 : 0.72}"/>`,
    ),
    `</g>`,
    `<path d="M${art.baseline.x1} ${art.baseline.y1}L${art.baseline.x2} ${art.baseline.y2}" stroke="${line}" stroke-width="1"/>`,
    `<circle cx="${art.tick.cx}" cy="${art.tick.cy}" r="${art.tick.r}" fill="${accent}"/>`,
    `</svg>`,
  ];
  return parts.join("");
}

/** The figure as a data URI, for image sources. */
export function artworkDataUri(
  seed: string,
  width: number,
  height: number,
  family: "paper" | "ink" = "paper",
  scheme: "light" | "dark" = "light",
): string {
  return `data:image/svg+xml;base64,${Buffer.from(
    artworkSvg(seed, width, height, family, scheme),
  ).toString("base64")}`;
}
