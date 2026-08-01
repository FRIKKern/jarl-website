import { artwork } from "@/lib/artwork";
import styles from "./Artwork.module.css";

/**
 * The drawing box. Every CARD gets the same tall 4:3 frame — the image-led
 * plate's ratio (ProjectVisual.module.css) — so the drawing FILLS the plate
 * a capture would fill and a mixed grid keeps one baseline. The project
 * hero opts into the wide panel box instead: a contour field at hero width
 * reads as a plotted panorama, not a tall empty room.
 */
const BOX = {
  card: { w: 640, h: 480 },
  panel: { w: 640, h: 260 },
} as const;

/**
 * A project's generative figure, as real SVG in the document.
 *
 * Strokes are bound to var(--color-*), so the drawing takes the ground it is
 * standing on — it inverts with an ink band and follows the reader's color
 * scheme with no second asset. The geometry is shared with the social-image
 * renderer; see src/lib/artwork.ts.
 */
export function Artwork({
  seed,
  box = "card",
}: {
  seed: string;
  box?: keyof typeof BOX;
}) {
  const { w: W, h: H } = BOX[box];
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
