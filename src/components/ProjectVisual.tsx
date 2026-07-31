import type { Project } from "@/content/types";
import { Artwork } from "./Artwork";
import styles from "./ProjectVisual.module.css";

/**
 * The one place that decides what a project *looks* like.
 *
 * A project that has a real, captured image of itself shows that image. A
 * project that has none falls back to `<Artwork seed>` — the deterministic
 * generative drawing. That fallback is not decoration standing in for a
 * photograph: it is the honest signal that no shot of this thing exists yet.
 * The moment a real capture lands on the document, the drawing steps aside.
 *
 * Plain `<img>`, not `next/image`: the sources are served by the Barkpark
 * instance through the same-origin `/media` proxy (next.config.ts), already
 * immutable-cached, and the site runs no image optimizer.
 */
export function ProjectVisual({ project }: { project: Project }) {
  const image = project.image;

  if (!image?.src) {
    return <Artwork seed={project.slug ?? project._id} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.photo}
      src={image.src}
      alt={image.alt ?? ""}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
    />
  );
}

/** True when the project carries a real capture, not the generative drawing. */
export function hasProjectPhoto(project: Project): boolean {
  return Boolean(project.image?.src);
}
