/**
 * The emphasis convention — the hero's italic inflection.
 *
 * A CMS string may mark the words that carry feeling with *asterisk* spans:
 *
 *     «Jeg bygger *verktøy* og *nettsteder* som gjør jobben uten støy.»
 *
 * Rendered here, each pair becomes a real <em>, which the display serif sets
 * in its italic cut. The parser is deliberately TOLERANT:
 *
 *   - no asterisks         → the string renders exactly as authored,
 *   - an unpaired asterisk → stays a literal character, never eats the line,
 *   - a pair spanning a newline is not a pair — emphasis never crosses lines.
 *
 * The plain-text mirror lives in src/lib/text.ts (`stripEmphasis`), which
 * metadata uses so a <title> or Open Graph card never shows the markers.
 */

const EMPHASIS = /\*([^*\n]+)\*/g;

export function Emphasis({ text }: { text?: string }) {
  if (!text) return null;
  const parts = text.split(EMPHASIS);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <em key={i}>{part}</em> : part,
      )}
    </>
  );
}
