import { artwork } from "@/lib/artwork";
import styles from "./Artwork.module.css";

/** The drawing box. Every card gets the same frame so a row of cards lines
    up; the figure inside it is the part that differs. */
const W = 640;
const H = 260;

/**
 * A project's generative figure, as real SVG in the document.
 *
 * Strokes are bound to var(--color-*), so the drawing takes the ground it is
 * standing on — it inverts with an ink band and follows the reader's color
 * scheme with no second asset. The geometry is shared with the social-image
 * renderer; see src/lib/artwork.ts.
 */
export function Artwork({ seed }: { seed: string }) {
  const art = artwork(seed, W, H);

  return (
    <svg
      className={styles.artwork}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.grid}>
        {art.grid.map((l, i) => (
          <path key={i} d={`M${l.x1} ${l.y1}L${l.x2} ${l.y2}`} />
        ))}
      </g>
      <g className={styles.contours}>
        {art.contours.map((c, i) => (
          <path
            key={i}
            d={c.d}
            className={c.accent ? styles.accentLine : styles.line}
          />
        ))}
      </g>
      <path
        className={styles.grid}
        d={`M${art.baseline.x1} ${art.baseline.y1}L${art.baseline.x2} ${art.baseline.y2}`}
      />
      <circle
        className={styles.tick}
        cx={art.tick.cx}
        cy={art.tick.cy}
        r={art.tick.r}
      />
    </svg>
  );
}
