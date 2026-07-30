import Link from "next/link";
import type { Note } from "@/content/types";
import styles from "./NoteList.module.css";

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "long" }).format(
    new Date(iso),
  );
}

export function NoteList({ notes }: { notes: Note[] }) {
  return (
    <ol className={styles.list}>
      {notes.map((note) => (
        <li key={note._id} className={styles.row}>
          <Link
            href={`/notater/${note.slug ?? note._id}`}
            className={styles.link}
          >
            <span className={styles.title}>{note.title}</span>
            <time className={styles.date} dateTime={note.publishedAt}>
              {formatDate(note.publishedAt)}
            </time>
          </Link>
        </li>
      ))}
    </ol>
  );
}
