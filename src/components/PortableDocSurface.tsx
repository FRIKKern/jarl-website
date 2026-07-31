"use client";

import { useEffect, useRef } from "react";
import { renderPortableDocument, type Block } from "@barkpark/react";
import { hydratePortableDoc } from "@barkpark/react/client";
import { enhanceDuels } from "@/lib/figures/duel";

interface Props {
  /** The canonical, type-keyed PortableDocument block array (Barkpark grammar). */
  blocks: Block[];
  /** Extra class(es) appended to the `bp-paper-surface` root. */
  className?: string;
}

/**
 * The one canonical PortableDocument surface on jarl.no.
 *
 * The body HTML is produced by `renderPortableDocument` — the same string
 * emitter that skins Studio's `/papers` reader — so it runs during SSR and the
 * static blocks cost zero client work. It mounts inside `.bp-paper-surface`,
 * whose engine skin ships from `@barkpark/react/paper-surface.css` (imported
 * once, in the route's server page) and whose jarl drakt lives in globals.css,
 * scoped to `.bp-paper-surface`.
 *
 * The only client work is MEDIA hydration: `hydratePortableDoc(ref.current)`
 * turns the inert mount points the renderer emits into live views —
 * `<pre class="mermaid">` → an SVG diagram, `<div class="bp-asciicast">` → a
 * terminal player. The hook is idempotent, so re-renders re-run it safely.
 *
 * One jarl-side pass runs over the emitted string first: `enhanceDuels` gives
 * the duel table a shared scale (see lib/figures/duel.ts). It is pure, so SSR
 * and hydration produce the same bytes, and it no-ops on anything it does not
 * recognise.
 */
export function PortableDocSurface({ blocks, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) void hydratePortableDoc(ref.current);
  }, [blocks]);

  const cls = className ? `bp-paper-surface ${className}` : "bp-paper-surface";
  return (
    <div
      ref={ref}
      className={cls}
      dangerouslySetInnerHTML={{
        __html: enhanceDuels(renderPortableDocument(blocks)),
      }}
    />
  );
}
