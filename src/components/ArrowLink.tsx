import Link from "next/link";
import styles from "./ArrowLink.module.css";

/**
 * THE arrow-gap primitive. Defined once; every arrow affordance on the site
 * is this component, and nothing else copies its rule.
 *
 * The gap between label and arrow is a custom property, so the open state can
 * be driven either by the link's own hover/focus OR by an ancestor — a card
 * sets `--arrow-gap: var(--arrow-gap-open)` on hover and the arrow inside it
 * opens with no second selector and no second definition.
 *
 * `static` renders a span instead of a link, for the case where an enclosing
 * element is already the link (a whole-card ::after target).
 */
export function ArrowLink({
  href,
  variant = "text",
  static: isStatic = false,
  children,
}: {
  href?: string;
  variant?: "text" | "solid" | "quiet";
  static?: boolean;
  children: React.ReactNode;
}) {
  const inner = (
    <>
      <span>{children}</span>
      <Arrow />
    </>
  );

  if (isStatic || !href) {
    return (
      <span className={styles.link} data-variant={variant} aria-hidden={isStatic}>
        {inner}
      </span>
    );
  }

  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a className={styles.link} data-variant={variant} href={href} rel="noreferrer">
        {inner}
      </a>
    );
  }

  return (
    <Link className={styles.link} data-variant={variant} href={href}>
      {inner}
    </Link>
  );
}

/** Drawn, not typed: a plotter stroke rather than a font glyph, so it lines
    up with the baseline at every size and inherits the ink exactly. */
function Arrow() {
  return (
    <svg
      className={styles.arrow}
      viewBox="0 0 22 10"
      width="22"
      height="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M0 5h20" />
      <path d="M16 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
