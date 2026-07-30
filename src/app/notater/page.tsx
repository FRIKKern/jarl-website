import type { Metadata } from "next";
import { getNavigation, getNotes, getSiteSettings } from "@/content/loaders";
import { NoteList } from "@/components/NoteList";
import { routeMetadata } from "@/lib/metadata";
import styles from "../article.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [navItems, settings] = await Promise.all([
    getNavigation(),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: navItems.find((i) => i.href === "/notater")?.label,
    description: settings?.tagline,
    path: "/notater",
    siteName: settings?.title,
  });
}

export default async function NotaterPage() {
  const [navItems, notes] = await Promise.all([getNavigation(), getNotes()]);
  const nav = navItems.find((i) => i.href === "/notater");

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <h1 className={styles.title}>{nav?.label}</h1>
      </header>
      <NoteList notes={notes} />
    </div>
  );
}
