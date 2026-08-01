import { artwork } from "@/lib/artwork";
import { Emphasis } from "./Emphasis";
import styles from "./MuralHero.module.css";

/* Drawing box for the hero room: viewport proportions, tinholt's first
   frame (their 1440-wide video under the masthead runs ~760px tall). */
const HERO_W = 1440;
const HERO_H = 760;

/**
 * The hero room — tinholt's opening grammar, said in jarl's own media.
 *
 * Directly under the masthead: one full-width media band, inset from the
 * viewport by the page gutter (radius 0, no shadow), carrying the site's
 * generative duotone at hero scale on the ink ground — and the page's
 * declaration standing ON it in the eggshell serif. tinholt does this with
 * a kitchen video; jarl has no photography of itself, so the honest
 * equivalent is the plotted field, drawn with a composed calm through its
 * middle (artwork textSafe) so the type gets quiet contours to stand on.
 *
 * The words are CMS-driven and arrive as props; this component owns only
 * the room. `scale="mega"` is the home declaration (96–120px desktop);
 * `display` keeps the ordinary page-title step for subpage heroes.
 */
export function MuralHero({
  seed,
  title,
  lede,
  scale = "display",
}: {
  seed: string;
  title: string;
  /** Optional italic line under the title — the subpage hero's lede. */
  lede?: string;
  scale?: "mega" | "display";
}) {
  const art = artwork(seed, HERO_W, HERO_H, { textSafe: true });

  return (
    <section className={styles.band}>
      <div className={styles.frame} data-surface="ink">
        {/* The same deterministic geometry as every drawing on the site,
            at room scale; `slice` bleeds the field to the frame like a
            photograph. Strokes ride the ink family's tokens. */}
        <svg
          className={styles.art}
          viewBox={`0 0 ${HERO_W} ${HERO_H}`}
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <g stroke="var(--color-line)" strokeWidth="1">
            {art.grid.map((l, i) => (
              <path key={i} d={`M${l.x1} ${l.y1}L${l.x2} ${l.y2}`} />
            ))}
            <path
              d={`M${art.baseline.x1} ${art.baseline.y1}L${art.baseline.x2} ${art.baseline.y2}`}
            />
          </g>
          <g fill="none" strokeLinecap="round">
            {/* the hero draws itself in on first paint — the same breath as
                the home mural once had, one instrument, one place */}
            {art.contours.map((c, i) => (
              <path
                key={i}
                d={c.d}
                pathLength={1}
                className={styles.contour}
                style={{ "--draw-delay": `${i * 90}ms` } as React.CSSProperties}
                stroke={c.accent ? "var(--color-accent)" : "var(--color-muted)"}
                strokeWidth={c.accent ? 2 : 1}
                opacity={c.accent ? 1 : 0.72}
              />
            ))}
          </g>
          <circle
            cx={art.tick.cx}
            cy={art.tick.cy}
            r={art.tick.r}
            fill="var(--color-accent)"
          />
        </svg>
        <header className={styles.stack}>
          <h1
            className={`${styles.title} jarl-reveal-1`}
            data-scale={scale}
          >
            <Emphasis text={title} />
          </h1>
          {lede ? (
            <p className={`${styles.lede} jarl-reveal-2`}>
              <Emphasis text={lede} />
            </p>
          ) : null}
        </header>
      </div>
    </section>
  );
}
