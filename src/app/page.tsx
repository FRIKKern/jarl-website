import type { Metadata } from "next";
import {
  getFeaturedProjects,
  getNavigation,
  getNotes,
  getPageBySlug,
  getSiteSettings,
} from "@/content/loaders";
import { normalizeSections } from "@/content/sections";
import { Band } from "@/components/Band";
import { Sections } from "@/components/Sections";
import { Prose } from "@/components/Prose";
import { ArrowLink } from "@/components/ArrowLink";
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

  const sections = normalizeSections(page?.sections);
  const projectsNav = navItems.find((i) => i.href === "/prosjekter");
  const notesNav = navItems.find((i) => i.href === "/notater");
  const hasIngress = Boolean(page?.intro || page?.body);

  return (
    <>
      <JsonLd data={personSchema(settings)} />

      {/* The hero is huge navy serif ON the greige — tinholt's subpage
          grammar. One continuous sheet from here to the footer; the only
          navy band on the page is the footer itself. Every section below
          takes the full-width hairline seam. */}
      <Band surface="paper" rule space="hero">
        <div className={styles.hero}>
          {settings?.tagline ? (
            <p className={styles.eyebrow}>{settings.tagline}</p>
          ) : null}
          <h1 className={styles.heroTitle}>{page?.title}</h1>
          {page?.ctaLabel && page?.ctaHref ? (
            <p className={styles.heroCta}>
              <ArrowLink href={page.ctaHref}>{page.ctaLabel}</ArrowLink>
            </p>
          ) : null}
        </div>
      </Band>

      {hasIngress ? (
        <Band surface="paper" rule>
          <div className={styles.ingress}>
            {page?.intro ? (
              <p className={styles.ingressLead}>{page.intro}</p>
            ) : null}
            <Prose text={page?.body} />
          </div>
        </Band>
      ) : null}

      <Sections sections={sections} after="paper" />

      {projects.length > 0 ? (
        <Band surface="paper" rule labelledBy="utvalgte-prosjekter">
          {projectsNav ? (
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionHeading} id="utvalgte-prosjekter">
                <ArrowLink href={projectsNav.href} variant="heading">
                  {projectsNav.label}
                </ArrowLink>
              </h2>
            </div>
          ) : null}
          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        </Band>
      ) : null}

      {notes.length > 0 ? (
        <Band surface="paper" rule labelledBy="siste-notater">
          {notesNav ? (
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionHeading} id="siste-notater">
                <ArrowLink href={notesNav.href} variant="heading">
                  {notesNav.label}
                </ArrowLink>
              </h2>
            </div>
          ) : null}
          <NoteList notes={notes.slice(0, 3)} />
        </Band>
      ) : null}
    </>
  );
}
