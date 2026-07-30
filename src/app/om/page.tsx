import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/content/loaders";
import { Prose } from "@/components/Prose";
import styles from "../article.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("om");
  return { title: page?.title, description: page?.seoDescription };
}

export default async function OmPage() {
  const page = await getPageBySlug("om");
  if (!page) notFound();

  return (
    <article className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{page.title}</h1>
        {page.intro ? <p className={styles.intro}>{page.intro}</p> : null}
      </header>
      <Prose text={page.body} />
    </article>
  );
}
