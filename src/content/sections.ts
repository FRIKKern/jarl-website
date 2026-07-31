/**
 * Normalising the CMS `sections` array into something the renderer can trust.
 *
 * Three rules, all deliberate:
 *  1. FORWARD COMPATIBILITY — a `kind` this build does not know is dropped
 *     here, so it renders nothing rather than an empty band. Content can be
 *     authored ahead of the code.
 *  2. NO EMPTY BANDS — a section with no content of its own is dropped too.
 *     The site never paints a band around nothing.
 *  3. NO SOURCELESS NUMBERS — a figure datum whose source ref does not
 *     resolve (item.source, else the section's sourceDefault) is dropped
 *     before it can be drawn. Provenance is not decoration here; it is the
 *     price of admission for every number on the site.
 */

import { SECTION_KINDS } from "./types";
import type {
  Section,
  SectionItem,
  SectionKind,
  Surface,
} from "./types";
import { resolveSourceRef } from "./sources";

/** A section that survived normalisation: kind and surface are settled. */
export interface KnownSection extends Section {
  kind: SectionKind;
  surface: Surface;
  items: SectionItem[];
}

const KNOWN = new Set<string>(SECTION_KINDS);

/** The kinds that draw numbers — and therefore owe the reader a source. */
export const FIGURE_KINDS = new Set<SectionKind>([
  "statBand",
  "duel",
  "lineage",
]);

function hasText(...values: (string | undefined)[]): boolean {
  return values.some((v) => (v ?? "").trim() !== "");
}

function itemHasContent(item: SectionItem): boolean {
  return hasText(item.overline, item.title, item.body, item.value, item.value2);
}

/** Rule 3 — inside a figure, a datum must carry a resolved source ref. Items
    without a value on EITHER side (a lineage node that is just a period and
    a title) owe nothing; a duel row with only value2 is still a number. */
function itemHasProvenance(section: Section, item: SectionItem): boolean {
  if (!hasText(item.value, item.value2)) return true;
  return resolveSourceRef(item.source, section.sourceDefault) !== null;
}

/** Does this section carry enough to be worth a band? */
function isRenderable(section: KnownSection): boolean {
  const head = hasText(section.overline, section.title, section.body);
  switch (section.kind) {
    /* item-driven archetypes are nothing without their items */
    case "split":
      return section.items.length >= 2;
    case "timeline":
    case "featureGrid":
    case "steps":
      return section.items.length > 0;
    case "quote":
      return hasText(section.body);
    case "callout":
      return head;
    case "statBand":
    case "lineage":
      return section.items.length > 0;
    /* a duel's columns are meaningless without their names */
    case "duel":
      return (
        section.items.length > 0 &&
        hasText(section.legendA) &&
        hasText(section.legendB)
      );
    /* noImplicitReturns is off, so without this guard a future kind would
       fall through to `undefined` and silently drop its section. The `never`
       assignment turns that silence into a compile error instead. */
    default: {
      const unhandled: never = section.kind;
      void unhandled;
      return false;
    }
  }
}

export function normalizeSections(sections?: Section[]): KnownSection[] {
  return (sections ?? [])
    .filter((s): s is Section & { kind: string } => KNOWN.has(s.kind ?? ""))
    .map<KnownSection>((s) => ({
      ...s,
      kind: s.kind as SectionKind,
      surface: s.surface === "ink" ? "ink" : "paper",
      items: (s.items ?? [])
        .filter(itemHasContent)
        .filter(
          (item) =>
            !FIGURE_KINDS.has(s.kind as SectionKind) ||
            itemHasProvenance(s, item),
        ),
    }))
    .filter(isRenderable);
}
