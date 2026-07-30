import type { KnownSection } from "@/content/sections";
import type { SectionItem } from "@/content/types";
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
  let previous = after;
  return (
    <>
      {sections.map((section, i) => {
        const rule = section.surface === previous;
        previous = section.surface;
        return (
          <Band
            key={i}
            surface={section.surface}
            rule={rule}
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

export type { SectionItem };
