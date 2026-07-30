import Link from "next/link";
import type { Project } from "@/content/types";
import { Artwork } from "./Artwork";
import { ArrowLink } from "./ArrowLink";
import styles from "./ProjectCard.module.css";

/**
 * `headingLevel` keeps the document outline honest: level 2 on the projects
 * index (directly under its h1), level 3 on the home page (under a section h2).
 */
export function ProjectCard({
  project,
  headingLevel = 3,
  readLabel,
}: {
  project: Project;
  headingLevel?: 2 | 3;
  /** CMS label for the card's arrow affordance. Without one, no arrow. */
  readLabel?: string;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const slug = project.slug ?? project._id;

  return (
    <article className={styles.card}>
      <div className={styles.figure}>
        <Artwork seed={slug} />
      </div>
      <div className={styles.body}>
        {project.overline ? (
          <p className={styles.overline}>{project.overline}</p>
        ) : null}
        <Heading className={styles.title}>
          <Link href={`/prosjekter/${slug}`} className={styles.titleLink}>
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
        {readLabel ? (
          <p className={styles.more}>
            {/* the whole card is already the link; this is only the affordance */}
            <ArrowLink variant="quiet" static>
              {readLabel}
            </ArrowLink>
          </p>
        ) : null}
      </div>
    </article>
  );
}
