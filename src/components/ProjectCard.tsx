import Link from "next/link";
import type { Project } from "@/content/types";
import { hashSeed } from "@/lib/artwork";
import { ProjectVisual, hasProjectPhoto } from "./ProjectVisual";
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
  const slug = project.slug ?? project._id;

  /* GROUND PARITY — the drawing plates alternate tone. A capture-less card
     used to stand on the faint eggshell plate no matter what, so a run of
     drawings read as one pale field; tinholt's grid alternates because
     photographs do. The drawing keeps its honest meaning («no capture
     yet») but half the plates flip to the ink ground — greige contours on
     navy — decided by the seed's own hash (a mixed bit of the FNV word the
     drawing is already made from), so a card's ground is as deterministic
     as its figure. Photographs are their own tone and never flip. */
  const inkPlate =
    !hasProjectPhoto(project) && ((hashSeed(slug) >> 5) & 1) === 1;

  return (
    <article className={styles.card}>
      <div
        className={
          hasProjectPhoto(project)
            ? `${styles.figure} ${styles.figurePhoto}`
            : styles.figure
        }
        data-surface={inkPlate ? "ink" : undefined}
      >
        <ProjectVisual project={project} />
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
      </div>
    </article>
  );
}
