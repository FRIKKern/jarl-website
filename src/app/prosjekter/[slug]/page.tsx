import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Block } from "@barkpark/react";
import "@barkpark/react/paper-surface.css";
import "@/app/paper-media.css";
import {
  getProjectBySlug,
  getProjects,
  getProjectStory,
  getSiteSettings,
} from "@/content/loaders";
import { normalizeSections } from "@/content/sections";
import { Band } from "@/components/Band";
import { Sections } from "@/components/Sections";
import { ProjectVisual, hasProjectPhoto } from "@/components/ProjectVisual";
import { ArrowLink } from "@/components/ArrowLink";
import { PortableDocSurface } from "@/components/PortableDocSurface";
import { Prose } from "@/components/Prose";
import { JsonLd } from "@/components/JsonLd";
import { routeMetadata } from "@/lib/metadata";
import { projectSchema } from "@/lib/structured-data";
import styles from "../../article.module.css";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug as string }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: project?.title,
    description: project?.summary,
    path: `/prosjekter/${slug}`,
    siteName: settings?.title,
    type: "article",
    publishedTime: project?._createdAt,
    modifiedTime: project?._updatedAt,
  });
}

export default async function ProsjektPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
  ]);
  if (!project) notFound();

  /* The ruling: «Prosjektene er ment til å skrives med Bulldocs». The
     narrative is the linked story paper (project.story → type "paper" — the
     only Studio-editable blocks doc), rendered by the canonical engine. The
     plain-text `body` is the legacy narrative and renders ONLY when no story
     exists — a project mid-migration never narrates twice. */
  const story = await getProjectStory(project);
  const storyBlocks = (story?.blocks ?? story?.body?.blocks ?? []) as Block[];
  const hasStory = storyBlocks.length > 0;

  const sections = normalizeSections(project.sections);
  const hasBody = !hasStory && Boolean(project.body);

  return (
    <article>
      <JsonLd data={projectSchema(project, settings)} />

      {/* The project's own hero: the words on one side, its figure on the
          other. The figure is a real capture of the thing when one exists,
          and the slug-generated drawing when none does — see ProjectVisual. */}
      <Band surface="ink" space="hero">
        <div className={styles.projectHeader}>
          <header className={styles.header}>
            {project.overline ? (
              <p className={styles.overline}>{project.overline}</p>
            ) : null}
            <h1 className={styles.displayTitle}>{project.title}</h1>
            {project.summary ? (
              <p className={styles.intro}>{project.summary}</p>
            ) : null}
            {project.tags?.length ? (
              <ul className={styles.tags}>
                {project.tags.map((tag) => (
                  <li key={tag} className={styles.tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            ) : null}
          </header>
          <div
            className={
              hasProjectPhoto(project)
                ? `${styles.projectFigure} ${styles.projectFigurePhoto}`
                : styles.projectFigure
            }
          >
            <ProjectVisual project={project} />
            {project.image?.caption ? (
              <p className={styles.figureKilde}>{project.image.caption}</p>
            ) : null}
          </div>
        </div>
      </Band>

      {hasStory ? (
        <Band surface="paper">
          {/* The canonical engine owns the markup and the Reader-Owned
              spacing law inside .bp-paper-surface; the jarl drakt is the
              token overrides scoped to it in globals.css. The band decides
              where the story column starts; the doctrine in globals.css
              (--measure / --figure) decides where every block stops. The
              old .storyShell wrapper capped itself at --site-width (1120px)
              inside a band column that is 1072px wide — a cap that could
              never bind, measured and deleted. */}
          <PortableDocSurface blocks={storyBlocks} />
        </Band>
      ) : null}

      {hasBody ? (
        <Band surface="paper">
          <Prose text={project.body} />
        </Band>
      ) : null}

      {/* The ruling's second half: the story paper CARRIES the figures as
          canonical blocks (stat-grid/duel/lineage + the kilde stamp), so a
          project with a story never also renders its legacy CMS sections —
          the same figure painted twice is worse than either alone. The
          sections stay on the doc as the fallback for a dangling story. */}
      {hasStory ? null : (
        <Sections sections={sections} after={hasBody ? "paper" : "ink"} />
      )}

      {project.url ? (
        <Band surface="paper" rule space="tight">
          <p className={styles.external}>
            <ArrowLink href={project.url}>{project.url}</ArrowLink>
          </p>
        </Band>
      ) : null}
    </article>
  );
}
