/**
 * Normalising the CMS `sections` array into something the renderer can trust.
 *
 * Two rules, both deliberate:
 *  1. FORWARD COMPATIBILITY — a `kind` this build does not know is dropped
 *     here, so it renders nothing rather than an empty band. Content can be
 *     authored ahead of the code.
 *  2. NO EMPTY BANDS — a section with no content of its own is dropped too.
 *     The site never paints a band around nothing.
 */

import { SECTION_KINDS } from "./types";
import type {
  Section,
  SectionItem,
  SectionKind,
  Surface,
} from "./types";

/** A section that survived normalisation: kind and surface are settled. */
export interface KnownSection extends Section {
  kind: SectionKind;
  surface: Surface;
  items: SectionItem[];
}

const KNOWN = new Set<string>(SECTION_KINDS);

function hasText(...values: (string | undefined)[]): boolean {
  return values.some((v) => (v ?? "").trim() !== "");
}

function itemHasContent(item: SectionItem): boolean {
  return hasText(item.overline, item.title, item.body);
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
  }
}

export function normalizeSections(sections?: Section[]): KnownSection[] {
  return (sections ?? [])
    .filter((s): s is Section & { kind: string } => KNOWN.has(s.kind ?? ""))
    .map<KnownSection>((s) => ({
      ...s,
      kind: s.kind as SectionKind,
      surface: s.surface === "ink" ? "ink" : "paper",
      items: (s.items ?? []).filter(itemHasContent),
    }))
    .filter(isRenderable);
}
