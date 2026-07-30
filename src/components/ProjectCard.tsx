import Link from "next/link";
import type { Project } from "@/content/types";
import styles from "./ProjectCard.module.css";

/**
 * `headingLevel` keeps the document outline honest: level 2 on the projects
 * index (directly under its h1), level 3 on the home page (under a section h2).
 */
export function ProjectCard({
  project,
  headingLevel = 3,
}: {
  project: Project;
  headingLevel?: 2 | 3;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";

  return (
    <article className={styles.card}>
      {project.overline ? (
        <p className={styles.overline}>{project.overline}</p>
      ) : null}
      <Heading className={styles.title}>
        <Link
          href={`/prosjekter/${project.slug ?? project._id}`}
          className={styles.titleLink}
        >
          {project.title}
        </Link>
      </Heading>
      {project.summary ? (
        <p className={styles.summary}>{project.summary}</p>
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
    </article>
  );
}
