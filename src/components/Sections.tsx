import type { KnownSection } from "@/content/sections";
import type { SectionItem } from "@/content/types";
import { resolveSourceRef } from "@/content/sources";
import type { SourceRef } from "@/content/sources";
import { lineageFigure } from "@/lib/figures/lineage";
import { artwork } from "@/lib/artwork";
import { focusPosition } from "@/lib/focus";
import { metaSegments } from "@/lib/text";
import { Band } from "./Band";
import { Prose } from "./Prose";
import { ArrowLink } from "./ArrowLink";
import styles from "./Sections.module.css";

/**
 * The CMS section renderer.
 *
 * Sections are ordered and typed; each one becomes exactly one full-bleed
 * band. Unknown kinds never reach here — see src/content/sections.ts.
 *
 * The seam rule, under page-level theming: every section stands on the page's
 * one ground, so like meets like at every seam and every band draws its top
 * hairline. The two instruments that CHANGE tone mid-page — the media band's
 * panel and the form band's surface — get clean cuts instead: a surface
 * change is its own seam, and drawing a hairline over it would double it.
 */
export function Sections({ sections }: { sections: KnownSection[] }) {
  return (
    <>
      {sections.map((section, i) => {
        if (section.kind === "mediaBand") {
          return <MediaBand key={i} section={section} />;
        }
        if (section.kind === "callout") {
          return <FormBand key={i} section={section} />;
        }
        return (
          <Band
            key={i}
            rule
            space={section.kind === "quote" ? "tight" : "normal"}
          >
            <SectionBody section={section} />
          </Band>
        );
      })}
    </>
  );
}

/* ---- shared head ------------------------------------------------------- */

/** Every section head is a centered stack on the page's axis — the same
    ceremony as the heroes. Kicker, serif title, narrow lede. */
function Head({ section }: { section: KnownSection }) {
  if (!section.overline && !section.title && !section.body) return null;
  return (
    <header className={styles.head}>
      {section.overline ? (
        <p className={styles.overline}>{section.overline}</p>
      ) : null}
      {section.title ? <h2 className={styles.title}>{section.title}</h2> : null}
      {section.body ? <Prose text={section.body} /> : null}
    </header>
  );
}

function ItemBody({ text }: { text?: string }) {
  if (!text) return null;
  return <p className={styles.itemBody}>{text}</p>;
}

function hasText(...values: (string | undefined)[]): boolean {
  return values.some((v) => (v ?? "").trim() !== "");
}

/* ---- archetypes -------------------------------------------------------- */

function SectionBody({ section }: { section: KnownSection }) {
  switch (section.kind) {
    case "split":
      return <Split section={section} />;
    case "timeline":
      return <Timeline section={section} />;
    case "featureGrid":
      return <FeatureGrid section={section} />;
    case "steps":
      return <Steps section={section} />;
    case "quote":
      return <Quote section={section} />;
    case "statBand":
      return <StatBand section={section} />;
    case "duel":
      return <Duel section={section} />;
    case "lineage":
      return <Lineage section={section} />;
  }
}

/** Two columns divided by a vertical hairline. Exactly two — a third column
    is a grid, and the grid archetype already exists.

    An item that carries its own CTA becomes tinholt's CTA card: kicker (as a
    piped meta row when the author pipes it), serif title, body, bordered
    button — flat, no box, the rail is the whole architecture. */
function Split({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} />
      <div className={styles.split}>
        {section.items.slice(0, 2).map((item, i) => (
          <div key={i} className={styles.splitCol}>
            <ItemOverline text={item.overline} />
            {item.title ? <h3 className={styles.splitTitle}>{item.title}</h3> : null}
            <ItemBody text={item.body} />
            {item.ctaLabel && item.ctaHref ? (
              <p className={styles.splitCta}>
                <ArrowLink href={item.ctaHref}>{item.ctaLabel}</ArrowLink>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}

/** A kicker that splits on the copy's own pipes into the site's piped
    small-caps meta row — the same idiom as the hero meta and the card
    tags. One segment renders exactly like the plain overline. */
function ItemOverline({ text }: { text?: string }) {
  if (!text) return null;
  const segments = metaSegments(text);
  if (segments.length <= 1) return <p className={styles.overline}>{text}</p>;
  return (
    <p className={styles.overline}>
      {segments.map((segment) => (
        <span key={segment} className={styles.overlineSegment}>
          {segment}
        </span>
      ))}
    </p>
  );
}

/** The period rail: fixed-width left column of periods, a continuous vertical
    hairline, and the entry on the right. Hairline rows, no boxes. */
function Timeline({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} />
      <ol className={styles.timeline}>
        {section.items.map((item, i) => (
          <li key={i} className={styles.timelineRow}>
            <p className={styles.rail}>{item.overline}</p>
            <div className={styles.timelineEntry}>
              {item.title ? (
                <h3 className={styles.entryTitle}>{item.title}</h3>
              ) : null}
              <ItemBody text={item.body} />
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

/** Two or three columns, one hairline cap per cell. The cap is the whole
    decoration — the cell paints no surface and casts no shadow. */
function FeatureGrid({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} />
      <div
        className={styles.grid}
        data-cols={section.items.length % 3 === 0 ? "3" : "2"}
      >
        {section.items.map((item, i) => (
          <div key={i} className={styles.cell}>
            {item.overline ? (
              <p className={styles.overline}>{item.overline}</p>
            ) : null}
            {item.title ? <h3 className={styles.cellTitle}>{item.title}</h3> : null}
            <ItemBody text={item.body} />
          </div>
        ))}
      </div>
    </>
  );
}

/** The FORM SURFACE (tinholt rule 4): the callout archetype renders as the
    lighter band — one step up from the ground, in the eggshell family —
    and it exists only to carry a call to contact; it is never decorative.

    The band pins `data-surface="paper"` and paints `--color-surface`, so on
    a light page it is tinholt's lighter-band move exactly, and on a navy page it
    is the deliberately bright eggshell room (rule 3's photography, said in
    jarl's duotone) with the navy-filled button on it. In the dark scheme the
    same bindings resolve one quiet step above the page — the mirror holds.

    A surface change is its own seam: no hairline (rule 6). */
function FormBand({ section }: { section: KnownSection }) {
  return (
    <section className={styles.formBand} data-surface="paper">
      <div className={styles.formBandInner}>
        {section.overline ? (
          <p className={styles.overline}>{section.overline}</p>
        ) : null}
        {section.title ? (
          <h2 className={styles.calloutTitle}>{section.title}</h2>
        ) : null}
        {section.body ? <Prose text={section.body} /> : null}
        {section.ctaLabel && section.ctaHref ? (
          <p className={styles.calloutCta}>
            <ArrowLink href={section.ctaHref} variant="solid">
              {section.ctaLabel}
            </ArrowLink>
          </p>
        ) : null}
      </div>
    </section>
  );
}

/* ---- the media band ------------------------------------------------------
   The SECOND DARK (tinholt rules 3 + 5). A full-bleed room of media, inset
   from the viewport by the page's own gutter so the ground reads as a
   continuous frame — only the footer touches the edges.

   Two voices, one instrument:
   - no capture → the generative duotone at mural scale: an ink panel
     (deeper still in the dark scheme), jarl's plotted contours in greige,
     one short serif line overlaid — own artwork, never stock;
   - a capture → the photograph fills the room and a greige text-card
     rides it, tinholt's fullfoto-board move, linking onward. */

/** Drawing box for the mural: panel proportions, not card proportions. */
const MURAL_W = 1440;
const MURAL_H = 700;

function MediaBand({ section }: { section: KnownSection }) {
  const image = section.image;
  const card =
    hasText(section.overline, section.title, section.body) ||
    (section.ctaLabel && section.ctaHref);

  if (image?.src) {
    const focus = focusPosition(image.focus);
    return (
      <section className={styles.mediaBand}>
        <figure className={`${styles.mediaFrame} ${styles.mediaCapture}`}>
          {/* Same-origin /media proxy, immutable-cached — the plain <img>
              rationale from ProjectVisual applies unchanged. EAGER on
              purpose: this image IS the band (a blank room is a broken
              composition, observed as exactly that under lazy decode),
              and there is at most one capture room on a page. The authored
              `focus` (ProjectImage.focus → src/lib/focus.ts) art-directs
              which part of the capture the room's cover-crop keeps. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.mediaImg}
            src={image.src}
            alt={image.alt ?? ""}
            decoding="async"
            style={focus ? { objectPosition: focus } : undefined}
          />
          {card ? (
            <figcaption className={styles.mediaCard} data-surface="paper">
              <ItemOverline text={section.overline} />
              {section.title ? (
                <h2 className={styles.mediaCardTitle}>{section.title}</h2>
              ) : null}
              {section.body ? (
                <p className={styles.mediaCardBody}>{section.body}</p>
              ) : null}
              {section.ctaLabel && section.ctaHref ? (
                <p className={styles.mediaCardCta}>
                  <ArrowLink href={section.ctaHref} variant="solid">
                    {section.ctaLabel}
                  </ArrowLink>
                </p>
              ) : null}
            </figcaption>
          ) : null}
        </figure>
      </section>
    );
  }

  const art = artwork(section.seed ?? section.title ?? "jarl", MURAL_W, MURAL_H);
  return (
    <section className={styles.mediaBand}>
      <div className={styles.mediaFrame} data-surface="ink">
        {/* The mural: the same deterministic geometry as every project card,
            drawn at panel scale. `slice` lets the field bleed to the frame
            like a photograph would; strokes ride the ink family's tokens. */}
        <svg
          className={styles.mediaArt}
          viewBox={`0 0 ${MURAL_W} ${MURAL_H}`}
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
            {/* THE MURAL BREATHES — the one kinetic moment outside the hero
                reveal, and it lives here only (the mural instrument renders
                on the home strip alone). Each contour draws itself in once
                on first paint: pathLength=1 normalises every path so ONE
                dasharray in CSS covers all of them, the stagger rides a
                custom property, and prefers-reduced-motion kills it via the
                global animation kill in globals.css. */}
            {art.contours.map((c, i) => (
              <path
                key={i}
                d={c.d}
                pathLength={1}
                className={styles.muralContour}
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
        {hasText(section.body, section.title) ? (
          <p className={styles.mediaLine}>
            {hasText(section.body) ? section.body : section.title}
          </p>
        ) : null}
      </div>
    </section>
  );
}

/** A numbered sequence. The numeral is generated; the overline is authored. */
function Steps({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} />
      <ol className={styles.steps}>
        {section.items.map((item, i) => (
          <li key={i} className={styles.step}>
            <p className={styles.stepIndex}>
              {String(i + 1).padStart(2, "0")}
            </p>
            {item.overline ? (
              <p className={styles.overline}>{item.overline}</p>
            ) : null}
            {item.title ? <h3 className={styles.cellTitle}>{item.title}</h3> : null}
            <ItemBody text={item.body} />
          </li>
        ))}
      </ol>
    </>
  );
}

function Quote({ section }: { section: KnownSection }) {
  return (
    <figure className={styles.quote}>
      <blockquote className={styles.quoteText}>{section.body}</blockquote>
      {section.attribution ? (
        <figcaption className={styles.quoteBy}>{section.attribution}</figcaption>
      ) : null}
    </figure>
  );
}

/* ---- the figure family --------------------------------------------------
   Three kinds that draw NUMBERS, and therefore owe the reader a source.
   The normaliser guarantees every datum reaching here has a resolved ref
   (item.source, else the section's sourceDefault); the KildeFooter makes
   that provenance visible as one deduped rail line per figure. */

/** Every resolved ref used by this figure's data, deduped, in item order. */
function figureSources(section: KnownSection): SourceRef[] {
  const seen = new Map<string, SourceRef>();
  for (const item of section.items) {
    if (!(item.value ?? "").trim() && !(item.value2 ?? "").trim()) continue;
    const ref = resolveSourceRef(item.source, section.sourceDefault);
    if (ref && !seen.has(ref.raw)) seen.set(ref.raw, ref);
  }
  return [...seen.values()];
}

/** The kilde stamp — one line in the rail idiom (mono / xs / muted).
    Only URL refs link out; commit/paper/task refs are identities, not
    reading material, and render as text. */
function KildeFooter({ section }: { section: KnownSection }) {
  const refs = figureSources(section);
  if (refs.length === 0) return null;
  return (
    <p className={styles.kilde}>
      <span>{refs.length > 1 ? "Kilder" : "Kilde"}</span>
      {refs.map((ref) => (
        <span key={ref.raw} className={styles.kildeRef}>
          {ref.href ? <a href={ref.href}>{ref.label}</a> : ref.label}
        </span>
      ))}
    </p>
  );
}

/** A row of stat tiles: the value large in the display serif, the label in
    the overline idiom, unit and provenance in the rail idiom. */
function StatBand({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} />
      <div className={styles.statBand}>
        {section.items.map((item, i) => (
          <div key={i} className={styles.stat}>
            {item.overline ? (
              <p className={styles.overline}>{item.overline}</p>
            ) : null}
            <p className={styles.statValue}>
              {item.value}
              {item.unit ? (
                <span className={styles.statUnit}>{item.unit}</span>
              ) : null}
            </p>
            {item.title ? (
              <h3 className={styles.statLabel}>{item.title}</h3>
            ) : null}
            <ItemBody text={item.body} />
          </div>
        ))}
      </div>
      <KildeFooter section={section} />
    </>
  );
}

/** The two-column scoreboard. The column heads come ONLY from the authored
    legends — swapping legendA/legendB without swapping the values inverts
    the whole board, so the renderer never hardcodes a side. Column A is the
    emphasized side by convention: the page's own subject always stands
    left, and carries the surface's one accent. */
function Duel({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} />
      <table className={styles.duel}>
        <thead>
          <tr>
            <td />
            <th scope="col" className={styles.duelLegend} data-accent="">
              {section.legendA}
            </th>
            <th scope="col" className={styles.duelLegend}>
              {section.legendB}
            </th>
          </tr>
        </thead>
        <tbody>
          {section.items.map((item, i) => (
            <tr key={i} className={styles.duelRow}>
              <th scope="row" className={styles.duelMeasure}>
                {item.title}
                {item.overline ? (
                  <span className={styles.duelNote}>{item.overline}</span>
                ) : null}
              </th>
              <td className={styles.duelValue} data-accent="">
                {item.value}
                {item.unit ? (
                  <span className={styles.duelUnit}>{item.unit}</span>
                ) : null}
              </td>
              <td className={styles.duelValue}>
                {item.value2}
                {item.unit ? (
                  <span className={styles.duelUnit}>{item.unit}</span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <KildeFooter section={section} />
    </>
  );
}

/** Pixel box the lineage arc is drawn in; the SVG scales via its viewBox. */
const LINEAGE_W = 960;
const LINEAGE_H = 200;

/** The timeline arc: a deterministic rising spine (src/lib/figures/lineage)
    with one plotted station per item. The SVG is decoration over the real
    content below it — hence aria-hidden — and every stroke and fill is an
    SVG attribute bound to a --color-* token, so the drawing follows its
    band and the reader's color scheme. */
function Lineage({ section }: { section: KnownSection }) {
  const fig = lineageFigure(
    section.title ?? section.overline ?? "lineage",
    LINEAGE_W,
    LINEAGE_H,
    section.items.length,
  );
  return (
    <>
      <Head section={section} />
      <div className={styles.lineage}>
        <svg
          className={styles.lineageArt}
          viewBox={`0 0 ${fig.width} ${fig.height}`}
          aria-hidden="true"
          focusable="false"
        >
          <path
            d={`M${fig.baseline.x1} ${fig.baseline.y1}L${fig.baseline.x2} ${fig.baseline.y2}`}
            stroke="var(--color-line)"
            strokeWidth="1"
            fill="none"
          />
          {fig.ticks.map((t, i) => (
            <path
              key={i}
              d={`M${t.x1} ${t.y1}L${t.x2} ${t.y2}`}
              stroke="var(--color-line)"
              strokeWidth="1"
              fill="none"
            />
          ))}
          <path
            d={fig.spine}
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {fig.nodes.map((node, i) => (
            <circle
              key={i}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill="var(--color-accent)"
            />
          ))}
        </svg>
        <ol
          className={styles.lineageRow}
          style={{ "--lineage-cols": section.items.length } as React.CSSProperties}
        >
          {section.items.map((item, i) => (
            <li key={i} className={styles.lineageNode}>
              {item.overline ? (
                <p className={styles.lineagePeriod}>{item.overline}</p>
              ) : null}
              {item.title ? (
                <h3 className={styles.entryTitle}>{item.title}</h3>
              ) : null}
              {item.value ? (
                <p className={styles.lineageValue}>
                  {item.value}
                  {item.unit ? (
                    <span className={styles.statUnit}>{item.unit}</span>
                  ) : null}
                </p>
              ) : null}
              <ItemBody text={item.body} />
            </li>
          ))}
        </ol>
      </div>
      <KildeFooter section={section} />
    </>
  );
}

export type { SectionItem };
