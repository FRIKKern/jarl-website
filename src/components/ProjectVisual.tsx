import type { Project } from "@/content/types";
import { focusPosition } from "@/lib/focus";
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
 * TWO VARIANTS, one truth each:
 *  - `card` (default) — the image-led plate: cropped to the ONE card ratio
 *    (see ProjectVisual.module.css), with the authored `focus` deciding
 *    which part of the capture survives the crop;
 *  - `full` — the project hero's evidence view: the capture at its own
 *    intrinsic ratio, uncropped, so `focus` has nothing to decide.
 *
 * Plain `<img>`, not `next/image`: the sources are served by the Barkpark
 * instance through the same-origin `/media` proxy (next.config.ts), already
 * immutable-cached, and the site runs no image optimizer.
 */
export function ProjectVisual({
  project,
  variant = "card",
}: {
  project: Project;
  variant?: "card" | "full";
}) {
  const image = project.image;

  if (!image?.src) {
    return (
      <Artwork
        seed={project.slug ?? project._id}
        box={variant === "card" ? "card" : "panel"}
      />
    );
  }

  const focus = variant === "card" ? focusPosition(image.focus) : undefined;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={variant === "card" ? styles.photoCard : styles.photo}
      src={image.src}
      alt={image.alt ?? ""}
      width={image.width}
      height={image.height}
      loading="lazy"
      decoding="async"
      style={focus ? { objectPosition: focus } : undefined}
    />
  );
}

/** True when the project carries a real capture, not the generative drawing. */
export function hasProjectPhoto(project: Project): boolean {
  return Boolean(project.image?.src);
}
