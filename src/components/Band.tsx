import type { Surface } from "@/content/types";
import styles from "./Band.module.css";

/**
 * A full-bleed horizontal band — the page's only layout primitive.
 *
 * By default a band declares NO ground of its own: it paints whatever the
 * page laid down (the page-level theme, globals.css), so the same route is
 * greige or navy on one CMS field. Passing `surface` pins the band to a
 * family regardless of the page — that right is reserved for the footer's
 * constant navy and the renderer-owned instruments (media panel, form card);
 * sections never pin.
 *
 * Rhythm on this site comes from TONE and HAIRLINES, never from boxes: a band
 * paints edge to edge, and the only line it may draw is the seam above it.
 */
export function Band({
  surface,
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
