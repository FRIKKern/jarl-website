/** Document shapes served by the Barkpark instance (schema v2, dataset `production`). */

interface BarkparkDoc {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
  _rev: string;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface SiteSettings extends BarkparkDoc {
  _type: "siteSettings";
  title?: string;
  tagline?: string;
  email?: string;
  footerText?: string;
  socialLinks?: SocialLink[];

  /* Optional chrome overrides — see src/content/chrome.ts. Absent from the
     schema today; the moment they exist in Studio they win over the
     fallbacks, with no code change. */
  skipToContentLabel?: string;
  notFoundTitle?: string;
  notFoundIntro?: string;
  errorTitle?: string;
  errorIntro?: string;
  retryLabel?: string;
}

export interface NavItem {
  label: string;
  href: string;
  order?: number;
}

export interface Navigation extends BarkparkDoc {
  _type: "navigation";
  items?: NavItem[];
}

/* ---- composable sections ------------------------------------------------
   An ORDERED, typed list authored in Studio and rendered top to bottom.
   One composite shape with a `kind` discriminant: every archetype reads the
   fields it needs and ignores the rest, so adding an archetype is a schema
   option and a renderer branch — never a new document type.

   Forward compatibility is a hard rule: a `kind` this build does not know
   renders NOTHING. Content can therefore be authored ahead of the code. */

/** Which ground a band stands on. See the surface families in globals.css. */
export type Surface = "paper" | "ink";

/** The archetypes this build renders. Anything else is ignored on purpose. */
export const SECTION_KINDS = [
  "split",
  "timeline",
  "featureGrid",
  "callout",
  "steps",
  "quote",
  "statBand",
  "duel",
  "lineage",
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

/** A row, column, cell, step — or a figure datum. Which of the fields matter
    is the parent section's business. */
export interface SectionItem {
  overline?: string;
  title?: string;
  body?: string;
  /** Figure kinds — the datum. statBand: the tile's number. duel: the
      legend-A value. lineage: an optional node value. */
  value?: string;
  /** Duel only — the legend-B value of this row. */
  value2?: string;
  /** Unit or qualifier rendered after the value ('%', 'USD', 'dager'). */
  unit?: string;
  /** Provenance ref for this datum — see src/content/sources.ts. A figure
      datum whose source does not resolve is dropped by the normaliser. */
  source?: string;
}

export interface Section {
  /** Deliberately widened to `string`: unknown kinds must survive the type
      system exactly the way they survive the renderer. */
  kind?: string;
  surface?: string;
  overline?: string;
  title?: string;
  body?: string;
  attribution?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Duel only — the two column heads. A duel without both legends does not
      render: the columns are MEANINGLESS without their names. */
  legendA?: string;
  legendB?: string;
  /** Fallback source ref for every figure item without one of its own. */
  sourceDefault?: string;
  items?: SectionItem[];
}

export interface Page extends BarkparkDoc {
  _type: "page";
  /** May carry the *emphasis* convention: `*ord*` spans become <em> in the
      hero (components/Emphasis — tolerant, unpaired asterisks stay literal;
      metadata strips the markers via stripEmphasis). */
  title?: string;
  slug?: string;
  /** Same *emphasis* convention as `title`. On the home page the intro joins
      the title as ONE centered hero declaration; the italic inflection is
      authored here, never hardcoded. */
  intro?: string;
  /** The home hero's single arrow link. */
  ctaLabel?: string;
  ctaHref?: string;
  body?: string;
  sections?: Section[];
  seoDescription?: string;
}

export interface Project extends BarkparkDoc {
  _type: "project";
  title?: string;
  slug?: string;
  overline?: string;
  summary?: string;
  body?: string;
  /** The project's story — a reference to a Bulldocs `paper`, served as the
      paper's document id. Papers are the ONLY Studio-editable blocks docs
      (the blocks-doc write path is a closed whitelist), so the long-form
      narrative lives as its own paper and this field binds it in. */
  story?: string;
  sections?: Section[];
  tags?: string[];
  url?: string;
  order?: number;
  featured?: boolean;
  /** A real, captured image of the thing itself — the card and hero visual.
      `src` is served by the Barkpark media library, root-relative through the
      same-origin `/media` proxy. Absent means no capture exists yet, and the
      generative `Artwork` drawing stands in (see `ProjectVisual`). */
  image?: ProjectImage;
}

export interface ProjectImage {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  /** Where this capture came from and when — the kilde law applies to
      screenshots exactly as it does to figure data. Rendered under the
      hero on the project page; the card omits it, a thumbnail is not a
      place for provenance. */
  caption?: string;
}

export interface Note extends BarkparkDoc {
  _type: "note";
  title?: string;
  slug?: string;
  publishedAt?: string;
  body?: string;
}

/* ---- Bulldocs papers ---------------------------------------------------- */

/** Inline content: either a bare string or a typed span. */
export type PaperInline =
  | string
  | { type: "text"; value: string; marks?: string[] }
  | { type: "link"; value?: string; href?: string; text?: string }
  | { type?: string; value?: string; [key: string]: unknown };

export interface HeadingBlock {
  type: "heading";
  id?: string;
  level?: number;
  content?: PaperInline[];
}

export interface ParagraphBlock {
  type: "paragraph";
  id?: string;
  content?: PaperInline[];
}

export interface ListBlock {
  type: "list";
  id?: string;
  ordered?: boolean;
  items?: PaperInline[][];
}

export interface TableBlock {
  type: "table";
  id?: string;
  head?: string[];
  rows?: string[][];
}

export interface CalloutBlock {
  type: "callout";
  id?: string;
  tone?: string;
  title?: string;
  text?: string | PaperInline[];
}

export interface EyebrowBlock {
  type: "eyebrow";
  id?: string;
  text?: string;
}

export interface IngressBlock {
  type: "ingress";
  id?: string;
  content?: PaperInline[];
}

export interface DividerBlock {
  type: "divider";
  id?: string;
}

export interface UnknownBlock {
  type: string;
  id?: string;
  [key: string]: unknown;
}

export type PaperBlock =
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | TableBlock
  | CalloutBlock
  | EyebrowBlock
  | IngressBlock
  | DividerBlock
  | UnknownBlock;

export interface Paper extends BarkparkDoc {
  _type: "paper";
  title?: string;
  description?: string;
  blocks?: PaperBlock[];
  /** Mirror of the top-level block array (byte-equal on the live instance). */
  body?: { blocks?: PaperBlock[] };
}
