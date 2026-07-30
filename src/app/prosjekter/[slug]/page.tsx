import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProjectBySlug,
  getProjects,
  getSiteSettings,
} from "@/content/loaders";
import { normalizeSections } from "@/content/sections";
import { Band } from "@/components/Band";
import { Sections } from "@/components/Sections";
import { Artwork } from "@/components/Artwork";
import { ArrowLink } from "@/components/ArrowLink";
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

  const sections = normalizeSections(project.sections);
  const seed = project.slug ?? project._id;
  const hasBody = Boolean(project.body);

  return (
    <article>
      <JsonLd data={projectSchema(project, settings)} />

      {/* The project's own hero: the words on one side, its figure on the
          other. The figure is generated from the slug — see lib/artwork.ts. */}
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
          <div className={styles.projectFigure}>
            <Artwork seed={seed} />
          </div>
        </div>
      </Band>

      {hasBody ? (
        <Band surface="paper">
          <Prose text={project.body} />
        </Band>
      ) : null}

      <Sections sections={sections} after={hasBody ? "paper" : "ink"} />

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
