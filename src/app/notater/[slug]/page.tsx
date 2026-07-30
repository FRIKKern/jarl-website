import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNoteBySlug, getNotes } from "@/content/loaders";
import { Prose } from "@/components/Prose";
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
  const note = await getNoteBySlug(slug);
  return { title: note?.title };
}

export default async function NotatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  if (!note) notFound();

  return (
    <article className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{note.title}</h1>
        {note.publishedAt ? (
          <p className={styles.meta}>
            <time dateTime={note.publishedAt}>
              {formatDate(note.publishedAt)}
            </time>
          </p>
        ) : null}
      </header>
      <Prose text={note.body} />
    </article>
  );
}
