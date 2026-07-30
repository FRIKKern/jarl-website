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
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

/** A row, column, cell or step. Which of the three fields matter is the
    parent section's business. */
export interface SectionItem {
  overline?: string;
  title?: string;
  body?: string;
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
  items?: SectionItem[];
}

export interface Page extends BarkparkDoc {
  _type: "page";
  title?: string;
  slug?: string;
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
  sections?: Section[];
  tags?: string[];
  url?: string;
  order?: number;
  featured?: boolean;
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
}
