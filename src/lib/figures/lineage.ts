/**
 * Deterministic geometry for the lineage figure — the timeline arc.
 *
 * Same discipline as src/lib/artwork.ts: this module owns GEOMETRY ONLY,
 * pure and seeded, so the same seed at the same size always produces the
 * same drawing, on every machine, with no randomness at render time. The
 * renderer (src/components/Sections.tsx) binds the strokes to var(--color-*)
 * tokens; nothing here knows about color.
 *
 * The character is plotter, not paint: one rising spine sampled from a
 * seeded slow wave, a station tick dropped to the baseline at every node,
 * and the nodes themselves sitting exactly on the spine.
 */

export interface LineagePoint {
  cx: number;
  cy: number;
  r: number;
}

export interface LineageLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface LineageFigure {
  width: number;
  height: number;
  /** The rising arc through every node. */
  spine: string;
  /** One node per item, in item order, sitting on the spine. */
  nodes: LineagePoint[];
  /** Vertical drop from each node to the baseline — the plotted station. */
  ticks: LineageLine[];
  baseline: LineageLine;
}

function hashSeed(input: string): number {
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

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Build the arc for `count` nodes at a given pixel size. Everything scales
 * off the box, so the figure reads the same at any width the band gives it.
 */
export function lineageFigure(
  seed: string,
  width: number,
  height: number,
  count: number,
): LineageFigure {
  const n = Math.max(1, count);
  const random = makeRandom(hashSeed(seed || "lineage"));

  const padX = width * 0.04;
  const padTop = height * 0.18;
  const baseY = height * 0.82;
  const innerW = width - padX * 2;
  const rise = (baseY - padTop) * (0.72 + random() * 0.2);

  /* one slow seeded wave shared by spine and nodes, so the nodes sit ON the
     line instead of near it */
  const f = 0.9 + random() * 1.4;
  const phase = random() * Math.PI * 2;
  const amp = rise * 0.1;
  const yAt = (t: number) =>
    baseY - rise * Math.pow(t, 1.15) - amp * Math.sin(f * t * Math.PI + phase);

  const samples = 72;
  let spine = "";
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const x = padX + innerW * t;
    spine += `${s === 0 ? "M" : "L"}${round(x)} ${round(yAt(t))}`;
    if (s < samples) spine += " ";
  }

  const nodes: LineagePoint[] = [];
  const ticks: LineageLine[] = [];
  const r = Math.max(3, Math.min(width, height) * 0.018);
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const cx = round(padX + innerW * t);
    const cy = round(yAt(t));
    nodes.push({ cx, cy, r: round(r) });
    ticks.push({ x1: cx, y1: cy, x2: cx, y2: round(baseY) });
  }

  const baseline: LineageLine = {
    x1: round(padX),
    y1: round(baseY),
    x2: round(width - padX),
    y2: round(baseY),
  };

  return { width, height, spine, nodes, ticks, baseline };
}
