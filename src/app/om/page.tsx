import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getSiteSettings } from "@/content/loaders";
import { normalizeSections, pageTheme } from "@/content/sections";
import { Band } from "@/components/Band";
import { MuralHero } from "@/components/MuralHero";
import { Sections } from "@/components/Sections";
import { Prose } from "@/components/Prose";
import { routeMetadata } from "@/lib/metadata";
import styles from "../article.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("om"),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: page?.title,
    description: page?.seoDescription,
    path: "/om",
    siteName: settings?.title,
  });
}

export default async function OmPage() {
  const page = await getPageBySlug("om");
  if (!page) notFound();

  const sections = normalizeSections(page.sections);

  return (
    <article data-page-theme={pageTheme(page)}>
      {/* Om opens on the hero room too — the same grammar as the front
          door, with its own seed, the title and the italic lede standing
          on the field at the ordinary page-title step. The person page
          had 3954px of unbroken light and no media at all; now it opens
          the way tinholt's om-oss does. */}
      <MuralHero
        seed={page.slug ?? "om"}
        title={page.title ?? ""}
        lede={page.intro}
      />
      {page.body ? (
        <Band rule>
          <div className={styles.centerCol}>
            <Prose text={page.body} />
          </div>
        </Band>
      ) : null}
      <Sections sections={sections} />
    </article>
  );
}
