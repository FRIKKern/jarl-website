/**
 * The source-ref grammar — provenance for every figure datum.
 *
 * Every number the site draws must say where it comes from. A ref is one of
 * four shapes, validated by the same pattern the CMS schema enforces:
 *
 *   commit:<sha>       a git commit (7–40 hex chars)
 *   paper:<id>         a published Barkpark paper id
 *   task:<id>          a Barkpark task id
 *   https://…          a public URL
 *
 * The grammar is enforced in four layers: the schema's validation.pattern,
 * the normaliser (src/content/sections.ts drops figure data with no resolved
 * ref — the site physically cannot paint a sourceless number), the online
 * gate scripts/check-sources.mjs, and CI. This module is the shared parser
 * all of them agree with.
 *
 * `ingen-kilde:<grunn>` is the SENTINEL, never a valid ref: check-sources
 * prints one per missing source so the gap is visible on every run, and the
 * schema pattern rejects it so it can never be authored as a real source.
 */

/** Mirrors the CMS schema's validation.pattern for source / sourceDefault. */
export const SOURCE_REF_PATTERN =
  /^(commit:[0-9a-f]{7,40}|paper:[a-z0-9][a-z0-9-]*|task:[A-Za-z0-9._-]+|https:\/\/.+)$/;

export const NO_SOURCE_SENTINEL = "ingen-kilde";

export interface SourceRef {
  kind: "commit" | "paper" | "task" | "url";
  /** The ref exactly as authored. */
  raw: string;
  /** Short display text for the kilde footer. */
  label: string;
  /** Present only for URL refs — the only kind that links out. */
  href?: string;
}

/** Parse a ref; null when it does not match the grammar (or is empty). */
export function parseSourceRef(raw: string | undefined): SourceRef | null {
  const value = (raw ?? "").trim();
  if (!SOURCE_REF_PATTERN.test(value)) return null;
  if (value.startsWith("commit:")) {
    /* a full sha is an identity, not reading material — show the short form */
    return { kind: "commit", raw: value, label: `commit:${value.slice(7, 14)}` };
  }
  if (value.startsWith("paper:")) {
    return { kind: "paper", raw: value, label: value };
  }
  if (value.startsWith("task:")) {
    return { kind: "task", raw: value, label: value };
  }
  return { kind: "url", raw: value, label: value.replace(/^https:\/\//, "").replace(/\/$/, ""), href: value };
}

/** The sentinel line check-sources prints for a datum with no source. */
export function formatNoSource(reason: string): string {
  return `${NO_SOURCE_SENTINEL}:${reason}`;
}

/** Item ref wins over the section fallback; null when neither resolves. */
export function resolveSourceRef(
  itemSource: string | undefined,
  sectionDefault: string | undefined,
): SourceRef | null {
  return parseSourceRef(itemSource) ?? parseSourceRef(sectionDefault);
}
