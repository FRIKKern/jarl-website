import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { getNavigation, getSiteSettings } from "@/content/loaders";
import { getChrome } from "@/content/chrome";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HTML_LANG, OG_LOCALE, SITE_URL } from "@/lib/site";
import styles from "./layout.module.css";
import "./globals.css";

/* Instrument Serif ships ONE weight (400) and its italic — that is the
   point. Headings get no bolder than the cut itself; hierarchy on this
   site is size and the serif/sans split, never weight. */
const display = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--next-font-display",
  display: "swap",
});

const body = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--next-font-body",
  display: "swap",
});

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings?.title ?? "";
  const description = settings?.tagline;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${title}` },
    description,
    applicationName: title || undefined,
    authors: title ? [{ name: title, url: SITE_URL }] : undefined,
    creator: title || undefined,
    publisher: title || undefined,
    alternates: {
      types: {
        "application/rss+xml": [{ url: "/feed.xml", title: title || undefined }],
      },
    },
    openGraph: {
      type: "website",
      url: SITE_URL,
      siteName: title || undefined,
      locale: OG_LOCALE,
      title: title || undefined,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: title || undefined,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, navItems] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
  ]);
  const chrome = getChrome(settings);

  return (
    <html
      lang={HTML_LANG}
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Pre-paint theme stamp: the canonical paper-surface.css keys its
            dark tokens on html[data-theme="dark"] ONLY (zero
            prefers-color-scheme coverage), while jarl is media-query driven —
            so mirror the media query onto the attribute before first paint,
            and keep it live on scheme changes. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var m=window.matchMedia("(prefers-color-scheme: dark)");var d=document.documentElement;var set=function(){d.setAttribute("data-theme",m.matches?"dark":"light")};set();m.addEventListener("change",set)}catch(e){}})()',
          }}
        />
        <a href="#innhold" className={styles.skipLink}>
          {chrome.skipToContent}
        </a>
        <SiteHeader siteTitle={settings?.title} items={navItems} />
        <main id="innhold" tabIndex={-1} className={styles.main}>
          {children}
        </main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
