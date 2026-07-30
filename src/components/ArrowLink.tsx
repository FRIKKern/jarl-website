import Link from "next/link";
import styles from "./ArrowLink.module.css";

/**
 * THE arrow-gap primitive. Defined once; every arrow affordance on the site
 * is this component, and nothing else copies its rule.
 *
 * The gap between label and arrow is a custom property, so the open state can
 * be driven by the link's own hover/focus or by any ancestor that sets
 * `--arrow-gap: var(--arrow-gap-open)` — no second selector, no second
 * definition of what hovering means. The generative figure reads its
 * presence from `--figure-ink` under exactly the same contract.
 *
 * Without an `href` it renders a span, for the case where an enclosing
 * element is already the link.
 */
export function ArrowLink({
  href,
  variant = "text",
  children,
}: {
  href?: string;
  variant?: "text" | "solid" | "heading";
  children: React.ReactNode;
}) {
  const inner = (
    <>
      <span>{children}</span>
      <Arrow />
    </>
  );

  if (!href) {
    return (
      <span className={styles.link} data-variant={variant}>
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
