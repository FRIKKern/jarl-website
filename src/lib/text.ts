/** Derivations over CMS text — never a source of new copy. */

/** First paragraph of a plain-text body, clipped on a word boundary. */
export function excerpt(text?: string, max = 165): string | undefined {
  const first = (text ?? "").split(/\n{2,}/)[0]?.replace(/\s+/g, " ").trim();
  if (!first) return undefined;
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const stop = cut.lastIndexOf(" ");
  return `${(stop > max * 0.6 ? cut.slice(0, stop) : cut).trimEnd()}…`;
}

/** Escape a string for inclusion in XML character data. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
