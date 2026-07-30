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
   │  src/components PaperRenderer, cards, shell  │
   │  src/app/       routes (below)               │
   └──────────────────┬───────────────────────────┘
                      ▼
     /            hero + featured projects + notes
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
pnpm check:contrast   # design gate: OKLCH tokens meet WCAG AA, both themes
pnpm check:tokens     # design gate: no raw color literals outside globals.css
pnpm build            # production build against the live instance
```

## Design system (the Frick pattern)

Hand-rolled CSS modules — no Tailwind. All design decisions live as CSS custom
properties in `src/app/globals.css`: OKLCH colors (light + dark via
`prefers-color-scheme`), a fluid type scale, and a spacing scale. Fraunces for
display type, Instrument Sans for body. Two CI gates keep it honest:
`scripts/check-contrast.mjs` parses the token file and verifies every declared
foreground/background pair meets WCAG AA in both themes;
`scripts/check-tokens.mjs` rejects any raw color literal outside the token
file, **and** verifies that `src/lib/palette.ts` — the numeric restatement of
the same colors, needed because `next/og` rasterises without a stylesheet —
still mirrors `globals.css` exactly.

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

## Known: soft 404 on list-backed detail routes

`/notater/<ukjent>` and `/prosjekter/<ukjent>` render the 404 page but answer
`200` instead of `404`. `notFound()` is called correctly; Next 16.2.12 commits
the status before the throw when a route combines `generateStaticParams` with
`dynamicParams: true`. `/papers/<ukjent>` answers `404` (its loader hits a
document endpoint that 404s outright), as does any unrouted path. The two
workarounds both cost more than the wart: `dynamicParams: false` breaks the
"publish in Studio, live in a minute" promise for *new* documents, and dropping
`generateStaticParams` makes every detail page render per request. Revisit when
Next fixes the status handling. This is also why detail routes have no
`loading.tsx` — a Suspense boundary there makes the soft 404 unconditional.

## Papers — the mechanical spacing law

`/papers/[slug]` renders Bulldocs papers (paragraph, heading, list, table,
callout, eyebrow, ingress, divider). The renderer adds **no vertical margins**
between blocks; an empty paragraph block renders as **exactly one blank row**,
never collapsed. All whitespace on a paper page is authored in the document.
