import type { KnownSection } from "@/content/sections";
import type { SectionItem } from "@/content/types";
import { resolveSourceRef } from "@/content/sources";
import type { SourceRef } from "@/content/sources";
import { lineageFigure } from "@/lib/figures/lineage";
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
 * The seam rule: a band draws a hairline at its top only when the band above
 * it shares its ground. Where the ground changes, the tone change IS the seam.
 */
export function Sections({
  sections,
  /** Ground of whatever is directly above the first section. */
  after = "paper",
}: {
  sections: KnownSection[];
  after?: string;
}) {
  /* Seams are decided up front, so rendering stays a pure map. */
  const needsRule = sections.map(
    (section, i) => section.surface === (i === 0 ? after : sections[i - 1].surface),
  );

  return (
    <>
      {sections.map((section, i) => (
        <Band
          key={i}
          surface={section.surface}
          rule={needsRule[i]}
          space={section.kind === "quote" ? "tight" : "normal"}
        >
          <SectionBody section={section} />
        </Band>
      ))}
    </>
  );
}

/* ---- shared head ------------------------------------------------------- */

function Head({
  section,
  center = false,
}: {
  section: KnownSection;
  center?: boolean;
}) {
  if (!section.overline && !section.title && !section.body) return null;
  return (
    <header className={styles.head} data-center={center ? "" : undefined}>
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

/* ---- archetypes -------------------------------------------------------- */

function SectionBody({ section }: { section: KnownSection }) {
  switch (section.kind) {
    case "split":
      return <Split section={section} />;
    case "timeline":
      return <Timeline section={section} />;
    case "featureGrid":
      return <FeatureGrid section={section} />;
    case "callout":
      return <Callout section={section} />;
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
    is a grid, and the grid archetype already exists. */
function Split({ section }: { section: KnownSection }) {
  return (
    <>
      <Head section={section} center />
      <div className={styles.split}>
        {section.items.slice(0, 2).map((item, i) => (
          <div key={i} className={styles.splitCol}>
            {item.overline ? (
              <p className={styles.overline}>{item.overline}</p>
            ) : null}
            {item.title ? <h3 className={styles.splitTitle}>{item.title}</h3> : null}
            <ItemBody text={item.body} />
          </div>
        ))}
      </div>
    </>
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

/** A banded statement carrying the one solid fill on the site. */
function Callout({ section }: { section: KnownSection }) {
  return (
    <div className={styles.callout}>
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
    if (!(item.value ?? "").trim()) continue;
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
