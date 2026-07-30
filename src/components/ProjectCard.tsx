import Link from "next/link";
import type { Project } from "@/content/types";
import styles from "./ProjectCard.module.css";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={styles.card}>
      {project.overline ? (
        <p className={styles.overline}>{project.overline}</p>
      ) : null}
      <h3 className={styles.title}>
        <Link
          href={`/prosjekter/${project.slug ?? project._id}`}
          className={styles.titleLink}
        >
          {project.title}
        </Link>
      </h3>
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
