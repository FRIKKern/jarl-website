/**
 * Design tokens as numbers, for the surfaces that cannot read CSS.
 *
 * `next/og` (satori) rasterises server-side and never sees a stylesheet, so
 * the icon, artwork and OG-image routes need the palette as plain values. The
 * lightness / chroma / hue triples below MIRROR `src/app/globals.css`, which
 * stays the single source of truth — `scripts/check-tokens.mjs` fails the
 * build if the two ever drift apart.
 *
 * Both surface families are mirrored: `--paper-*` (the default ground) and
 * `--ink-*` (the inverted ground). The semantic `--color-*` bindings are a
 * CSS-only concept and deliberately absent here.
 *
 * Values are converted to sRGB hex programmatically; no color literal is
 * written here, so the tokens-only design gate still holds.
 */

export type Lch = readonly [number, number, number];

/** Light scheme — mirrors the `:root` block of globals.css. */
export const LIGHT: Record<string, Lch> = {
  "--paper-bg": [0.923, 0.011, 63],
  "--paper-surface": [0.956, 0.007, 81],
  "--paper-fg": [0.261, 0.045, 262],
  "--paper-muted": [0.42, 0.027, 266],
  "--paper-accent": [0.261, 0.045, 262],
  "--paper-line": [0.829, 0.005, 34],
  "--paper-accent-soft": [0.885, 0.012, 262],
  "--paper-solid-bg": [0.261, 0.045, 262],
  "--paper-solid-fg": [0.923, 0.011, 63],
  "--ink-bg": [0.261, 0.045, 262],
  "--ink-surface": [0.305, 0.045, 262],
  "--ink-fg": [0.923, 0.011, 63],
  "--ink-muted": [0.79, 0.02, 265],
  "--ink-accent": [0.923, 0.011, 63],
  "--ink-line": [0.34, 0.03, 262],
  "--ink-accent-soft": [0.345, 0.04, 262],
  "--ink-solid-bg": [0.923, 0.011, 63],
  "--ink-solid-fg": [0.261, 0.045, 262],
};

/** Dark scheme — mirrors the prefers-color-scheme override of globals.css. */
export const DARK: Record<string, Lch> = {
  "--paper-bg": [0.22, 0.04, 262],
  "--paper-surface": [0.26, 0.04, 262],
  "--paper-fg": [0.93, 0.008, 80],
  "--paper-muted": [0.78, 0.02, 265],
  "--paper-accent": [0.85, 0.03, 262],
  "--paper-line": [0.34, 0.035, 262],
  "--paper-accent-soft": [0.32, 0.04, 262],
  "--paper-solid-bg": [0.93, 0.008, 80],
  "--paper-solid-fg": [0.22, 0.04, 262],
  "--ink-bg": [0.17, 0.035, 262],
  "--ink-surface": [0.21, 0.035, 262],
  "--ink-fg": [0.94, 0.008, 80],
  "--ink-muted": [0.77, 0.02, 265],
  "--ink-accent": [0.85, 0.03, 262],
  "--ink-line": [0.28, 0.03, 262],
  "--ink-accent-soft": [0.27, 0.04, 262],
  "--ink-solid-bg": [0.94, 0.008, 80],
  "--ink-solid-fg": [0.17, 0.035, 262],
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function gamma(linear: number): number {
  const v = clamp01(linear);
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

function channelHex(linear: number): string {
  return Math.round(gamma(linear) * 255)
    .toString(16)
    .padStart(2, "0");
}

/** Perceptual lightness/chroma/hue triple to an sRGB hex string. */
export function toHex([l, c, h]: Lch): string {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc;
  const g = -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc;
  const bl = -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc;
  return "#" + channelHex(r) + channelHex(g) + channelHex(bl);
}

/** Hex value of a token in a given color scheme, for satori-rendered surfaces. */
export function token(
  name: keyof typeof LIGHT,
  scheme: "light" | "dark" = "light",
): string {
  const source = scheme === "dark" ? DARK : LIGHT;
  return toHex(source[name]);
}
