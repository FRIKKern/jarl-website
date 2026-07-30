/**
 * Canonical identity of the deployed site.
 *
 * These are addresses and locale codes — not content. Every user-visible
 * string still comes from the Barkpark CMS.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jarl.no"
).replace(/\/$/, "");

/** BCP-47 tag for <html lang>. */
export const HTML_LANG = "nb";

/** Open Graph locale. */
export const OG_LOCALE = "nb_NO";

/** RSS language code. */
export const FEED_LANGUAGE = "nb-no";

/** Bare hostname, e.g. `jarl.no` — used as a visual wordmark on OG images. */
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

/** Absolute URL for an app-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
