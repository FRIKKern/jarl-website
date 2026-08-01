import type { Metadata } from "next";
import {
  getFeaturedProjects,
  getNavigation,
  getNotes,
  getPageBySlug,
  getSiteSettings,
} from "@/content/loaders";
import { normalizeSections, pageTheme } from "@/content/sections";
import { Band } from "@/components/Band";
import { Sections } from "@/components/Sections";
import { Prose } from "@/components/Prose";
import { Emphasis } from "@/components/Emphasis";
import { ArrowLink } from "@/components/ArrowLink";
import { metaSegments } from "@/lib/text";
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

  /* The home strip is tinholt's dramaturgy: declaration → CTA cards → the
     art band → the boards → the CAPTURE board → colophon. The listing
     boards (projects, notes) are data-driven and render below, so the
     authored sections split around them: everything up to the first capture
     media band plays before the boards, the capture room (and anything the
     author placed after it) closes the strip. */
  const captureAt = sections.findIndex(
    (s) => s.kind === "mediaBand" && s.image?.src,
  );
  const overture = captureAt === -1 ? sections : sections.slice(0, captureAt);
  const finale = captureAt === -1 ? [] : sections.slice(captureAt);

  /* The hero declaration is COMPOSED from the CMS, never authored here:
     the page title flows straight into its intro as one centered serif
     statement. The only glue this code adds is a full stop when the title
     does not close its own sentence. */
  const title = page?.title?.trim();
  const intro = page?.intro?.trim();
  const declaration = [
    title && !/[.!?…]$/.test(title) ? `${title}.` : title,
    intro,
  ]
    .filter(Boolean)
    .join(" ");
  const meta = metaSegments(settings?.tagline);

  return (
    <div data-page-theme={pageTheme(page)}>
      <JsonLd data={personSchema(settings)} />

      {/* The centered declaration — tinholt's ceremony. One multi-line serif
          statement on the page's central axis, italic inflection authored in
          the CMS (*emphasis* convention), the kicker folded into a piped
          small-caps meta row beneath it, the button centered under that.
          One continuous greige sheet from here to the footer. */}
      <Band rule space="hero">
        <div className={styles.hero}>
          {declaration ? (
            <h1 className={`${styles.heroTitle} jarl-reveal-1`}>
              <Emphasis text={declaration} />
            </h1>
          ) : null}
          {meta.length > 0 ? (
            <p className={`${styles.heroMeta} jarl-reveal-2`}>
              {meta.map((segment) => (
                <span key={segment} className={styles.heroMetaSegment}>
                  {segment}
                </span>
              ))}
            </p>
          ) : null}
          {page?.ctaLabel && page?.ctaHref ? (
            <p className={`${styles.heroCta} jarl-reveal-3`}>
              <ArrowLink href={page.ctaHref}>{page.ctaLabel}</ArrowLink>
            </p>
          ) : null}
        </div>
      </Band>

      {page?.body ? (
        <Band rule>
          <div className={styles.ingress}>
            <Prose text={page.body} />
          </div>
        </Band>
      ) : null}

      <Sections sections={overture} />

      {projects.length > 0 ? (
        <Band rule labelledBy="utvalgte-prosjekter">
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
        <Band rule labelledBy="siste-notater">
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

      <Sections sections={finale} />
    </div>
  );
}
