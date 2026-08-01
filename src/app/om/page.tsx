import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getSiteSettings } from "@/content/loaders";
import { normalizeSections, pageTheme } from "@/content/sections";
import { Band } from "@/components/Band";
import { Sections } from "@/components/Sections";
import { Prose } from "@/components/Prose";
import { Emphasis } from "@/components/Emphasis";
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
      <Band rule space="tight">
        <header className={styles.header}>
          <h1 className={`${styles.displayTitle} jarl-reveal-1`}>
            <Emphasis text={page.title} />
          </h1>
          {page.intro ? (
            <p className={`${styles.intro} jarl-reveal-2`}>
              <Emphasis text={page.intro} />
            </p>
          ) : null}
        </header>
      </Band>
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
