/**
 * The Jarl mark — a serif `J` cut from geometry, not from a typeface, so the
 * favicon renders identically everywhere and needs no font payload.
 *
 * Colors come from the inverted surface family (see src/lib/palette.ts):
 * the ink ground, its foreground for the letter, its accent for the crossbar.
 * The mark is therefore an ink band shrunk to 64 units.
 */

import { token } from "./palette";

export interface MonogramOptions {
  /** Corner radius in the 64-unit grid. Use 0 for iOS, which masks its own. */
  radius?: number;
}

/** Square SVG markup for the mark, sized to `size` pixels. */
export function monogramSvg(size: number, options: MonogramOptions = {}): string {
  const tile = token("--ink-bg");
  const letter = token("--ink-fg");
  const bar = token("--ink-accent");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">`,
    `<rect width="64" height="64" rx="${options.radius ?? 14}" fill="${tile}"/>`,
    `<g fill="none" stroke-width="6" stroke-linecap="round">`,
    `<path d="M36 19 V35 a9 9 0 0 1 -18 0" stroke="${letter}"/>`,
    `<path d="M24 19 H46" stroke="${bar}"/>`,
    `</g>`,
    `</svg>`,
  ].join("");
}

/** The same mark as a data URI, for surfaces that only take an image source. */
export function monogramDataUri(
  size: number,
  options: MonogramOptions = {},
): string {
  return `data:image/svg+xml;base64,${Buffer.from(
    monogramSvg(size, options),
  ).toString("base64")}`;
}
