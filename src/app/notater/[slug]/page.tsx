import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNoteBySlug, getNotes, getSiteSettings } from "@/content/loaders";
import { Band } from "@/components/Band";
import { Prose } from "@/components/Prose";
import { JsonLd } from "@/components/JsonLd";
import { routeMetadata } from "@/lib/metadata";
import { notePostingSchema } from "@/lib/structured-data";
import { excerpt } from "@/lib/text";
import styles from "../../article.module.css";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const notes = await getNotes();
  return notes.filter((n) => n.slug).map((n) => ({ slug: n.slug as string }));
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "long" }).format(
    new Date(iso),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [note, settings] = await Promise.all([
    getNoteBySlug(slug),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: note?.title,
    description: excerpt(note?.body),
    path: `/notater/${slug}`,
    siteName: settings?.title,
    type: "article",
    publishedTime: note?.publishedAt ?? note?._createdAt,
    modifiedTime: note?._updatedAt,
  });
}

export default async function NotatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [note, settings] = await Promise.all([
    getNoteBySlug(slug),
    getSiteSettings(),
  ]);
  if (!note) notFound();

  return (
    <article>
      <JsonLd data={notePostingSchema(note, settings)} />
      <Band surface="paper" rule space="tight">
        <header className={styles.header}>
          <h1 className={styles.displayTitle}>{note.title}</h1>
          {note.publishedAt ? (
            <p className={styles.meta}>
              <time dateTime={note.publishedAt}>
                {formatDate(note.publishedAt)}
              </time>
            </p>
          ) : null}
        </header>
      </Band>
      <Band surface="paper" rule>
        <Prose text={note.body} />
      </Band>
    </article>
  );
}
