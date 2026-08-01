import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getSiteSettings } from "@/content/loaders";
import { normalizeSections } from "@/content/sections";
import { Band } from "@/components/Band";
import { Sections } from "@/components/Sections";
import { Prose } from "@/components/Prose";
import { Emphasis } from "@/components/Emphasis";
import { routeMetadata } from "@/lib/metadata";
import styles from "../article.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("kontakt"),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: page?.title,
    description: page?.seoDescription,
    path: "/kontakt",
    siteName: settings?.title,
  });
}

export default async function KontaktPage() {
  const [page, settings] = await Promise.all([
    getPageBySlug("kontakt"),
    getSiteSettings(),
  ]);
  if (!page) notFound();

  const sections = normalizeSections(page.sections);

  return (
    <article>
      <Band surface="paper" rule space="tight">
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
      <Band surface="paper" rule>
        <div className={styles.centerCol}>
          <Prose text={page.body} />
          {settings?.email ? (
            <a href={`mailto:${settings.email}`} className={styles.contactEmail}>
              {settings.email}
            </a>
          ) : null}
        </div>
      </Band>
      <Sections sections={sections} after="paper" />
    </article>
  );
}
