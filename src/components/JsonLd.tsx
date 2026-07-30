/** Emits a schema.org graph node. Server-only; the object is built by callers
 *  from CMS fields exclusively (see src/lib/structured-data.ts). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
