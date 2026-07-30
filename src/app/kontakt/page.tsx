import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug, getSiteSettings } from "@/content/loaders";
import { Prose } from "@/components/Prose";
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

  return (
    <article className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{page.title}</h1>
        {page.intro ? <p className={styles.intro}>{page.intro}</p> : null}
      </header>
      <Prose text={page.body} />
      {settings?.email ? (
        <a href={`mailto:${settings.email}`} className={styles.contactEmail}>
          {settings.email}
        </a>
      ) : null}
    </article>
  );
}
