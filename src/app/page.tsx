import Link from "next/link";
import type { Metadata } from "next";
import {
  getFeaturedProjects,
  getNavigation,
  getNotes,
  getPageBySlug,
  getSiteSettings,
} from "@/content/loaders";
import { Prose } from "@/components/Prose";
import { ProjectCard } from "@/components/ProjectCard";
import { NoteList } from "@/components/NoteList";
import { JsonLd } from "@/components/JsonLd";
import { routeMetadata } from "@/lib/metadata";
import { personSchema } from "@/lib/structured-data";
import styles from "./page.module.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageBySlug("hjem"),
    getSiteSettings(),
  ]);
  return routeMetadata({
    /* no title: the home page keeps the layout's default (the site title) */
    description: page?.seoDescription,
    path: "/",
    siteName: settings?.title,
  });
}

export default async function HomePage() {
  const [page, settings, navItems, projects, notes] = await Promise.all([
    getPageBySlug("hjem"),
    getSiteSettings(),
    getNavigation(),
    getFeaturedProjects(),
    getNotes(),
  ]);

  const projectsNav = navItems.find((i) => i.href === "/prosjekter");
  const notesNav = navItems.find((i) => i.href === "/notater");

  return (
    <div className={styles.page}>
      <JsonLd data={personSchema(settings)} />

      <section className={styles.hero}>
        {settings?.tagline ? (
          <p className={styles.eyebrow}>{settings.tagline}</p>
        ) : null}
        <h1 className={styles.heroTitle}>{page?.title}</h1>
        {page?.intro ? <p className={styles.heroIntro}>{page.intro}</p> : null}
        <Prose text={page?.body} />
      </section>

      {projects.length > 0 ? (
        <section className={styles.section} aria-labelledby="utvalgte-prosjekter">
          {projectsNav ? (
            <h2 className={styles.sectionHeading} id="utvalgte-prosjekter">
              <Link href={projectsNav.href} className={styles.sectionLink}>
                {projectsNav.label}
              </Link>
            </h2>
          ) : null}
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </section>
      ) : null}

      {notes.length > 0 ? (
        <section className={styles.section} aria-labelledby="siste-notater">
          {notesNav ? (
            <h2 className={styles.sectionHeading} id="siste-notater">
              <Link href={notesNav.href} className={styles.sectionLink}>
                {notesNav.label}
              </Link>
            </h2>
          ) : null}
          <NoteList notes={notes.slice(0, 3)} />
        </section>
      ) : null}
    </div>
  );
}
