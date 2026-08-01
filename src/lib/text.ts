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

/** Plain-text mirror of the *emphasis* convention (see components/Emphasis):
    strips paired markers, leaves unpaired asterisks alone. Metadata runs
    every title and description through this so the markers never reach a
    <title> or a social card. */
export function stripEmphasis(text?: string): string | undefined {
  if (text === undefined) return undefined;
  return text.replace(/\*([^*\n]+)\*/g, "$1");
}

/** Split a kicker/tagline into its piped segments — the small-caps meta row
    under a centered hero. Splits on the copy's own separators (comma, dash,
    interpunct, pipe) and drops a terminal period; never invents words. */
export function metaSegments(text?: string): string[] {
  return (text ?? "")
    .split(/\s*[,·|—–]\s*/)
    .map((s) => s.trim().replace(/[.]$/, ""))
    .filter(Boolean);
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
