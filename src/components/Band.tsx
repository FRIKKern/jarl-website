import type { Surface } from "@/content/types";
import styles from "./Band.module.css";

/**
 * A full-bleed horizontal band — the page's only layout primitive.
 *
 * A band declares which ground it stands on. `data-surface` rebinds the whole
 * --color-* set for the subtree (see globals.css), so everything inside a band
 * is automatically correct on either ground and in either color scheme.
 *
 * Rhythm on this site comes from TONE and HAIRLINES, never from boxes: a band
 * paints edge to edge, and the only line it may draw is the seam above it.
 */
export function Band({
  surface = "paper",
  /** Hairline across the top seam. Required when the band above shares this
      band's ground, or the two read as one. */
  rule = false,
  /** Vertical air. `hero` is the display band; `tight` closes a pairing up. */
  space = "normal",
  as: Tag = "section",
  labelledBy,
  children,
}: {
  surface?: Surface;
  rule?: boolean;
  space?: "hero" | "normal" | "tight";
  as?: "section" | "div" | "header" | "footer";
  labelledBy?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag
      className={styles.band}
      data-surface={surface}
      data-rule={rule ? "" : undefined}
      data-space={space}
      aria-labelledby={labelledBy}
    >
      <div className={styles.inner}>{children}</div>
    </Tag>
  );
}
