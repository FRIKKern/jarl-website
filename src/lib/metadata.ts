/**
 * One shape for every route's metadata: canonical URL, Open Graph and
 * Twitter card. Titles and descriptions are always CMS values handed in by
 * the route — this module only assembles them.
 */

import type { Metadata } from "next";
import { OG_LOCALE, absoluteUrl } from "./site";
import { stripEmphasis } from "./text";

export interface RouteMeta {
  /** CMS title of the page. */
  title?: string;
  /** CMS summary / seo description. */
  description?: string;
  /** App-relative path, e.g. `/prosjekter/barkpark`. */
  path: string;
  /** CMS site title, used as the Open Graph site name. */
  siteName?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export function routeMetadata({
  title: rawTitle,
  description: rawDescription,
  path,
  siteName,
  type = "website",
  publishedTime,
  modifiedTime,
}: RouteMeta): Metadata {
  /* CMS strings may carry the *emphasis* convention (components/Emphasis);
     metadata is plain text, so the markers come off here — a no-op for
     strings that never used them. */
  const title = stripEmphasis(rawTitle);
  const description = stripEmphasis(rawDescription);
  const url = absoluteUrl(path);
  const socialTitle =
    title && siteName && title !== siteName ? `${title} · ${siteName}` : (title ?? siteName);

  const shared = {
    url,
    siteName,
    locale: OG_LOCALE,
    title: socialTitle,
    description,
  };

  return {
    title,
    description,
    /* `alternates` replaces the parent's object rather than merging, so the
       feed link has to be restated on every route that sets a canonical. */
    alternates: {
      canonical: path,
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: siteName }],
      },
    },
    openGraph:
      type === "article"
        ? { ...shared, type: "article", publishedTime, modifiedTime }
        : { ...shared, type: "website" },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
