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
}

export async function renderOgImage({
  kicker,
  title,
  footer,
}: OgCard): Promise<ImageResponse> {
  const headline = clip(title, 84);
  const size =
    headline.length > 58 ? 62 : headline.length > 34 ? 78 : 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: token("--paper-bg"),
          color: token("--paper-fg"),
          fontFamily: "Instrument Sans",
          padding: "72px 80px",
          borderLeft: `16px solid ${token("--paper-accent")}`,
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
            fontSize: size,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            maxWidth: 960,
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
            fontSize: 28,
            color: token("--paper-muted"),
          }}
        >
          <div style={{ display: "flex", maxWidth: 760 }}>
            {clip(footer, 110)}
          </div>
          <div style={{ display: "flex", whiteSpace: "nowrap" }}>
            {SITE_HOST}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
