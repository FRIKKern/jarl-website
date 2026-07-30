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
```

The repo is bound to the instance by `.barkpark.json` (server URL only — never
a token), so `bp` commands run inside the repo target the jarl board.

## Env manifest

Epic 3 ships these via `bp sites env set`, which **replaces the whole env
blob** — this table must list every key the app needs.

| Key                   | Required | Value                                          |
| --------------------- | -------- | ---------------------------------------------- |
| `BARKPARK_URL`        | yes      | `https://jarl.barkpark.cloud`                  |
| `BARKPARK_READ_TOKEN` | yes      | read-only workspace-bound token (label `jarl-website-read`), minted with `bp token create` |

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
file.

## Papers — the mechanical spacing law

`/papers/[slug]` renders Bulldocs papers (paragraph, heading, list, table,
callout, eyebrow, ingress, divider). The renderer adds **no vertical margins**
between blocks; an empty paragraph block renders as **exactly one blank row**,
never collapsed. All whitespace on a paper page is authored in the document.
