# jarl-website

Personal site for Frikk Jarl — [jarl.no](https://jarl.no). Norwegian language.
Next.js (App Router) with a **dedicated Barkpark instance as its entire content
surface**: every string on every page is fetched from the CMS through typed
loaders. Zero hardcoded content in components.

Epic 2 of the programme charted in the paper `/papers/jarl-website-epic-plan`
(guerrilla.barkpark.cloud).

## Architecture

```
   ┌──────────────────────────────────────────────┐
   │  Barkpark instance · jarl.barkpark.cloud     │
   │  (dedicated box — content API + Studio)      │
   │                                              │
   │  siteSettings · navigation · page ·          │
   │  project · note · paper (Bulldocs)           │
   │                                              │
   │  `page` and `project` carry an ORDERED       │
   │  `sections` array — the composition system   │
   └──────────────────┬───────────────────────────┘
                      │  GET /v1/data/query/production/<type>
                      │  GET /v1/data/doc/production/<type>/<id>
                      │  Authorization: Bearer <read-only token>
                      ▼
   ┌──────────────────────────────────────────────┐
   │  Next.js App Router · ISR revalidate 60 s    │
   │                                              │
   │  src/content/   typed loaders (the only      │
   │                 way pages read content)      │
   │                 + section normaliser         │
   │  src/components Band, Sections, ArrowLink,   │
   │                 Artwork, PaperRenderer       │
   │  src/app/       routes (below)               │
   └──────────────────┬───────────────────────────┘
                      ▼
     /            inverted hero + section bands +
                  featured projects + notes
     /prosjekter  + /prosjekter/[slug]
     /notater     + /notater/[slug]
     /om          /kontakt
     /papers/[slug]   Bulldocs papers, mechanical spacing

     machine surfaces, all generated from the same CMS data:
     /sitemap.xml  /robots.txt  /feed.xml (RSS, notes + papers)
     /icon  /apple-icon        monogram, drawn in code
     …/opengraph-image         social card per page, next/og
```

The repo is bound to the instance by `.barkpark.json` (server URL only — never
a token), so `bp` commands run inside the repo target the jarl board.

## Env manifest

Epic 3 ships these via `bp sites env set`, which **replaces the whole env
blob** — this table must list every key the app needs.

| Key                    | Required | Value                                          |
| ---------------------- | -------- | ---------------------------------------------- |
| `BARKPARK_URL`         | yes      | `https://jarl.barkpark.cloud`                  |
| `BARKPARK_READ_TOKEN`  | yes      | read-only workspace-bound token (label `jarl-website-read`), minted with `bp token create` |
| `NEXT_PUBLIC_SITE_URL` | no       | public origin used for canonical URLs, sitemap, feed and social cards. Defaults to `https://jarl.no` |

Local dev: copy `.env.example` to `.env.local` (gitignored) and fill in the
token. CI: the `BARKPARK_READ_TOKEN` repo secret. A missing token never breaks
the build — pages render with empty content and the build logs a loud warning.

## Dev quickstart

```sh
pnpm install
cp .env.example .env.local   # then paste the read token
pnpm dev                     # http://localhost:3000
```

Checks (all wired into CI):

```sh
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint
pnpm check:contrast   # design gate: AA across 2 schemes × 2 surface families
pnpm check:tokens     # design gate: tokens only, palette mirror, band bindings
pnpm check:hover        # design gate: a painted surface pins its own ink
pnpm check:sources      # evidence gate: every figure datum names its source
pnpm check:measure      # width doctrine on rendered blocks
pnpm check:immovables   # fabrication fence: 23 sentences that may not move
pnpm check:image-kilde  # every wired caption dates and sources its picture
pnpm check              # typecheck + every gate above
pnpm build              # production build against the live instance
```

The content gates read the CMS **anonymously** and are ISR-immune by design;
`check:sources` and `check:measure` still want `BARKPARK_READ_TOKEN` from
`.env.local`:

```sh
set -a && . ./.env.local && set +a && pnpm check
```

### The capture rig

```sh
pnpm exec playwright install chromium   # once
pnpm capture:smoke   # one route, full quad, must yield 4 distinct PNGs
pnpm capture         # /prosjekter + all 20 project routes × the quad
pnpm shoot           # the same quad over the sitemap, against localhost
```

`scripts/capture-jarl.mjs` shoots 1440×900 and 390×844 in light and dark, warms
the ISR cache before every route (fetch, discard, wait, fetch — the edge serves
`STALE` even against a cache-busted URL), forces every lazy image to decode
before the shot, and writes an `audit.json` per route into the gitignored
`__shots__/`. Its vertical-run probe reports the longest unbroken run of prose
in CSS px between honest visual moments — a Sections archetype, a `bp-*` block
or an `img`/`figure`. A `Band` never counts: it is the layout primitive, and
counting it would let a wall of text score as illustrated.

`tooling/media/` holds the pipeline that produced every capture on the site,
rescued out of a session scratchpad — see its README.

## Design system

Hand-rolled CSS modules — no Tailwind. All design decisions live as CSS custom
properties in `src/app/globals.css`: OKLCH colors, a fluid type scale, a
spacing scale, and exactly one easing and one duration. Fraunces for display
type, Instrument Sans for body.

### Two surface families, not two themes

The palette is a mirrored pair — `--paper-*` (the warm default ground) and
`--ink-*` (the inverted ground) — each fully restated for light and dark. The
semantic `--color-*` names every component reads are *bindings* onto whichever
family is active, so a band flips ground with one attribute:

```html
<section data-surface="ink"> … </section>
```

Nothing downstream knows which ground it is standing on. Four combinations
exist (light/dark × paper/ink) and all four are under contract.

### Composition — bands and sections

Every route is a stack of full-bleed `<Band>`s. Rhythm comes from **tone and
hairlines, never from boxes**, and the seam rule falls out of that: a band
draws a hairline at its top only when the band above shares its ground, because
where the ground changes the tone change *is* the seam.

`page` and `project` documents carry an ordered `sections` array — one
composite with a `kind` discriminant, so a new archetype is a schema option
plus a renderer branch, never a new document type. Six ship today:

| kind          | shape                                                        |
| ------------- | ------------------------------------------------------------ |
| `split`       | two columns divided by a vertical hairline                     |
| `timeline`    | period rail left, entry right, hairline rows                   |
| `featureGrid` | two or three columns, one hairline cap per cell                |
| `callout`     | banded statement carrying the site's ONE solid fill            |
| `steps`       | numbered sequence, generated numeral + authored overline       |
| `quote`       | one pulled sentence and its attribution                        |

`src/content/sections.ts` drops any `kind` this build does not know — content
can be authored ahead of the code — and any section with no content of its own,
so the site never paints a band around nothing.

### Visual anchors

There is no photography and none is faked. `src/lib/artwork.ts` generates a
plotted contour field seeded from a project's slug: same slug, same figure,
forever. One geometry module feeds two renderers — real SVG bound to
`var(--color-*)` on the site (so the drawing inverts with its band and follows
the reader's color scheme), and a flat SVG string coloured from the palette
mirror for `next/og`. The figure is non-empty by construction.

### Interaction

`ArrowLink` owns the arrow-gap rule once: 0.5rem → 0.75rem over `--dur` with
`--ease`. The gap is a custom property, so an ancestor opens it by moving that
property instead of restating what hovering means; the figure reads
`--figure-ink` under the same contract. No motion library.

### The three gates

- `scripts/check-contrast.mjs` — every foreground/background pair meets WCAG AA
  in **all four** scheme × family combinations (28 pairs).
- `scripts/check-tokens.mjs` — no raw color literal outside the token file;
  `src/lib/palette.ts` (the numeric restatement `next/og` needs, since satori
  rasterises without a stylesheet) still mirrors `globals.css` exactly; and
  every semantic color is bound by `:root` **and** by both `[data-surface]`
  selectors, so a band can never inherit half a palette.
- `scripts/check-hover.mjs` — the cardinal rule: **any CSS rule that paints a
  background must set `color` in the same rule.** A subtree that paints a
  surface but inherits its ink is unreadable the moment it lands on the other
  family. Gradients and image-only backgrounds are exempt; a rule may opt out
  with `/* check-hover-allow: <reason> */`, and every exemption is printed on
  every run so none of them go quiet.

## SEO, social and discovery

Every route resolves its own metadata through `src/lib/metadata.ts`: canonical
URL, Open Graph (`nb_NO`, article times on detail pages) and a Twitter summary
card, with titles and descriptions taken from CMS fields only. `next/og` draws
the social card per page in Fraunces and Instrument Sans over the site's own
tokens (`src/lib/og.tsx`); the two faces are vendored as static TTFs under
`assets/fonts/` so nothing is fetched from a third party at request time. The
favicon and home-screen icon are the same monogram, `src/lib/monogram.ts`,
drawn as geometry rather than set in a typeface.

`app/sitemap.ts`, `app/robots.ts` and `app/feed.xml/route.ts` enumerate live
CMS documents, so a document published in Studio is in the sitemap and the feed
within the revalidate window. JSON-LD (`src/lib/structured-data.ts`) emits a
Person on the home page and a BlogPosting / CreativeWork on detail pages —
again, no field that is not in Barkpark.

## Accessibility

Skip link to `#innhold`, one labelled navigation landmark with `aria-current`
on the active item, a global `:focus-visible` ring, heading order that never
skips a level (`ProjectCard` takes a `headingLevel`), and a
`prefers-reduced-motion` block that neutralises every transition.

### UI chrome copy

The site's rule is that all copy lives in the CMS. Four states have no CMS
document behind them — the skip link, the error boundary and the bare 404 — so
`src/content/chrome.ts` holds Norwegian fallbacks that each read an *optional*
`siteSettings` field first. Add the field in Studio and it takes over with no
code change. A 404 additionally prefers a `page` document with the slug `404`.

## Do not add a `loading.tsx` to a list segment

Unknown detail routes answer a real `404` — verified for
`/prosjekter/<ukjent>` and `/notater/<ukjent>`. That only holds because the
list segments have **no** `loading.tsx`. A Suspense boundary above a route that
combines `generateStaticParams` with `dynamicParams: true` makes Next commit
`200` before `notFound()` throws, turning every unknown slug into a soft 404.
The boundaries were removed for exactly this reason; do not put them back.

## Papers — the mechanical spacing law

`/papers/[slug]` renders Bulldocs papers (paragraph, heading, list, table,
callout, eyebrow, ingress, divider). The renderer adds **no vertical margins**
between blocks; an empty paragraph block renders as **exactly one blank row**,
never collapsed. All whitespace on a paper page is authored in the document.
