/* eslint-disable @next/next/no-img-element -- satori renders these, not the browser */

/**
 * Server-rendered social card, drawn with the site's own type and tokens.
 *
 * Every string on the card is passed in by the caller from CMS fields; this
 * module only owns geometry and color.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { artworkDataUri } from "./artwork";
import { monogramDataUri } from "./monogram";
import { token } from "./palette";
import { SITE_HOST } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type FontSpec = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500;
  style: "normal";
};

let fontCache: Promise<FontSpec[]> | null = null;

async function loadFonts(): Promise<FontSpec[]> {
  fontCache ??= (async () => {
    const dir = join(process.cwd(), "assets", "fonts");
    const [display, body] = await Promise.all([
      readFile(join(dir, "Fraunces.ttf")),
      readFile(join(dir, "InstrumentSans.ttf")),
    ]);
    return [
      {
        name: "Fraunces",
        data: display.buffer.slice(
          display.byteOffset,
          display.byteOffset + display.byteLength,
        ) as ArrayBuffer,
        weight: 500,
        style: "normal",
      },
      {
        name: "Instrument Sans",
        data: body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        ) as ArrayBuffer,
        weight: 400,
        style: "normal",
      },
    ] satisfies FontSpec[];
  })();
  return fontCache;
}

function clip(value: string | undefined, max: number): string {
  const text = (value ?? "").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export interface OgCard {
  /** Small caps line above the title — an overline, section or site name. */
  kicker?: string;
  /** The headline. Always a CMS title. */
  title?: string;
  /** One quiet line under the rule — a summary, tagline or date. */
  footer?: string;
  /**
   * Seed for the generative figure — a project slug. When present the card
   * gains the same drawing the project's card carries on the site, so the
   * social image and the page agree on what the project looks like.
   * See src/lib/artwork.ts.
   */
  artworkSeed?: string;
}

/** The figure's column on the card, when there is one. */
const ART_W = 430;

export async function renderOgImage({
  kicker,
  title,
  footer,
  artworkSeed,
}: OgCard): Promise<ImageResponse> {
  const headline = clip(title, 84);
  const wide = !artworkSeed;
  const size = headline.length > 58 ? 62 : headline.length > 34 ? 78 : 96;
  const scale = wide ? 1 : 0.78;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: token("--paper-bg"),
          color: token("--paper-fg"),
          fontFamily: "Instrument Sans",
          borderLeft: `16px solid ${token("--paper-accent")}`,
        }}
      >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          minWidth: 0,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={monogramDataUri(64)} width={64} height={64} alt="" />
          {kicker ? (
            <div
              style={{
                display: "flex",
                fontSize: 26,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: token("--paper-accent"),
              }}
            >
              {clip(kicker, 42)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: Math.round(size * scale),
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            maxWidth: wide ? 960 : 560,
          }}
        >
          {headline}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 48,
            paddingTop: 28,
            borderTop: `1px solid ${token("--paper-line")}`,
            fontSize: wide ? 28 : 24,
            color: token("--paper-muted"),
          }}
        >
          <div style={{ display: "flex", maxWidth: wide ? 760 : 380 }}>
            {clip(footer, wide ? 110 : 76)}
          </div>
          <div style={{ display: "flex", whiteSpace: "nowrap" }}>
            {SITE_HOST}
          </div>
        </div>
      </div>

      {/* The project's figure, on its own ground, hairline-divided. Drawn
          from the same geometry the site uses — never an empty box. */}
      {artworkSeed ? (
        <div
          style={{
            display: "flex",
            width: ART_W,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            background: token("--ink-bg"),
            borderLeft: `1px solid ${token("--paper-line")}`,
          }}
        >
          <img
            src={artworkDataUri(artworkSeed, ART_W, OG_SIZE.height, "ink")}
            width={ART_W}
            height={OG_SIZE.height}
            alt=""
          />
        </div>
      ) : null}
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
