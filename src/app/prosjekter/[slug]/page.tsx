import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProjectBySlug,
  getProjects,
  getSiteSettings,
} from "@/content/loaders";
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

  return (
    <article className={styles.shell}>
      <JsonLd data={projectSchema(project, settings)} />
      <header className={styles.header}>
        {project.overline ? (
          <p className={styles.overline}>{project.overline}</p>
        ) : null}
        <h1 className={styles.title}>{project.title}</h1>
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
      <Prose text={project.body} />
      {project.url ? (
        <p className={styles.external}>
          <a href={project.url} rel="noreferrer">
            {project.url}
          </a>
        </p>
      ) : null}
    </article>
  );
}
