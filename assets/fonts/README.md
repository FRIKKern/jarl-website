# OG fonts

Static latin subsets of the two site faces, vendored so that server-rendered
images (`next/og` / satori) can use the site's own type without reaching out to
a third party at request time.

| File                 | Family          | Instance          | Source                                  |
| -------------------- | --------------- | ----------------- | --------------------------------------- |
| `Fraunces.ttf`        | Fraunces        | `opsz 9..144`, wght 500 | Google Fonts (`css2` API, truetype) |
| `InstrumentSans.ttf`  | Instrument Sans | wght 500          | Google Fonts (`css2` API, truetype)      |

Both are licensed under the SIL Open Font License 1.1. The browser-facing
copies of the same faces are still loaded by `next/font/google` in
`src/app/layout.tsx`; these files exist only for rasterised images.
