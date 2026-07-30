import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { getNavigation, getSiteSettings } from "@/content/loaders";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--next-font-display",
  axes: ["opsz", "SOFT", "WONK"],
});

const body = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--next-font-body",
});

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: {
      default: settings?.title ?? "",
      template: `%s · ${settings?.title ?? ""}`,
    },
    description: settings?.tagline,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, navItems] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
  ]);

  return (
    <html lang="nb" className={`${display.variable} ${body.variable}`}>
      <body>
        <SiteHeader siteTitle={settings?.title} items={navItems} />
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </body>
    </html>
  );
}
