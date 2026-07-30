import styles from "./RouteSkeleton.module.css";

/**
 * Placeholder for a route that is still fetching from the CMS. It is purely
 * decorative — invented copy would be worse than silence — so it is hidden
 * from assistive technology and the page is simply announced when it lands.
 */
export function RouteSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className={styles.shell} aria-hidden="true">
      <div className={styles.header}>
        <span className={`${styles.bar} ${styles.title}`} />
        <span className={`${styles.bar} ${styles.intro}`} />
      </div>
      <div className={styles.body}>
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className={`${styles.bar} ${styles.row}`} />
        ))}
      </div>
    </div>
  );
}
