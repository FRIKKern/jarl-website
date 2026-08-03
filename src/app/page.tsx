import type { Metadata } from "next";
import {
  getFeaturedProjects,
  getPageBySlug,
  getSiteSettings,
} from "@/content/loaders";
import { normalizeSections, pageTheme } from "@/content/sections";
import { Band } from "@/components/Band";
import { MuralHero } from "@/components/MuralHero";
import { Sections } from "@/components/Sections";
import { Prose } from "@/components/Prose";
import { ArrowLink } from "@/components/ArrowLink";
import { metaSegments } from "@/lib/text";
import { ProjectCard } from "@/components/ProjectCard";
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
  const [page, settings, projects] = await Promise.all([
    getPageBySlug("hjem"),
    getSiteSettings(),
    getFeaturedProjects(),
  ]);

  const sections = normalizeSections(page?.sections);

  /* The home strip is tinholt's dramaturgy: the hero room → CTA cards →
     the mid-page capture board → the featured board → the CLOSING capture →
     colophon. The featured board is data-driven and renders below, so the
     authored sections split around it: everything up to the LAST capture
     media band plays before the board, and that closing room (plus anything
     the author placed after it) ends the strip. Last, not first — the strip
     may now carry a capture board mid-overture, the way tinholt's home
     does. */
  let captureAt = -1;
  for (let i = sections.length - 1; i >= 0; i--) {
    const s = sections[i];
    if (s.kind === "mediaBand" && s.image?.src) {
      captureAt = i;
      break;
    }
  }
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

      {/* The hero room — tinholt's opening, in jarl's own media: the inset
          mural band directly under the masthead, the CMS declaration ON it
          in the eggshell serif at the mega cut, the *emphasis* italic
          intact. The seed is the site's own figure — the identity drawing
          that used to hang mid-page, promoted to the door. */}
      {declaration ? (
        <MuralHero seed="jarl" title={declaration} scale="mega" />
      ) : null}

      {/* tinholt puts content right below its video: the piped small-caps
          meta row and the one hero button land here, on the ground, in a
          tight band under the room. No hairline — the frame edge above is
          the seam. */}
      {meta.length > 0 || (page?.ctaLabel && page?.ctaHref) ? (
        <Band space="tight">
          <div className={styles.hero}>
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
      ) : null}

      {page?.body ? (
        <Band rule>
          <div className={styles.ingress}>
            <Prose text={page.body} />
          </div>
        </Band>
      ) : null}

      <Sections sections={overture} />

      {/* The featured board. It draws from `featured`, which crosses BOTH
          shelves — a client platform and my own tools stand side by side
          here — so its head is a statement and not a door: an arrow link
          would have to promise one shelf while the cards below it deliver
          two. The two doors are the CTA cards higher up the strip, and
          every card is its own way in. */}
      {projects.length > 0 ? (
        <Band
          rule
          labelledBy={page?.featuredTitle ? "utvalgte-prosjekter" : undefined}
        >
          {page?.featuredTitle ? (
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionHeadingPlain} id="utvalgte-prosjekter">
                {page.featuredTitle}
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

      <Sections sections={finale} />
    </div>
  );
}
