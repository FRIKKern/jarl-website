/**
 * UI chrome micro-copy.
 *
 * The site's rule is that every user-visible string lives in the CMS. These
 * few labels belong to states the CMS has no document for — the skip link, the
 * error boundary, the bare 404 — so each one reads an OPTIONAL `siteSettings`
 * field first and only falls back to the value below. Add the field in Studio
 * and it takes over with no code change.
 *
 * A 404 additionally prefers a `page` document with the slug `404`
 * (see src/app/not-found.tsx); this is the last resort under that.
 */

import type { SiteSettings } from "./types";

export interface Chrome {
  skipToContent: string;
  notFoundTitle: string;
  notFoundIntro: string;
  errorTitle: string;
  errorIntro: string;
  retry: string;
}

export const CHROME_FALLBACK: Chrome = {
  skipToContent: "Hopp til innhold",
  notFoundTitle: "Siden finnes ikke",
  notFoundIntro: "Adressen fører ingen steder. Prøv en av disse i stedet.",
  errorTitle: "Noe gikk galt",
  errorIntro: "Siden kunne ikke lastes. Prøv igjen, eller kom tilbake senere.",
  retry: "Prøv igjen",
};

export function getChrome(settings: SiteSettings | null): Chrome {
  return {
    skipToContent: settings?.skipToContentLabel ?? CHROME_FALLBACK.skipToContent,
    notFoundTitle: settings?.notFoundTitle ?? CHROME_FALLBACK.notFoundTitle,
    notFoundIntro: settings?.notFoundIntro ?? CHROME_FALLBACK.notFoundIntro,
    errorTitle: settings?.errorTitle ?? CHROME_FALLBACK.errorTitle,
    errorIntro: settings?.errorIntro ?? CHROME_FALLBACK.errorIntro,
    retry: settings?.retryLabel ?? CHROME_FALLBACK.retry,
  };
}
