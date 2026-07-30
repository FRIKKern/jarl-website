import Link from "next/link";
import type { NavItem } from "@/content/types";
import styles from "./SiteHeader.module.css";

export function SiteHeader({
  siteTitle,
  items,
}: {
  siteTitle?: string;
  items: NavItem[];
}) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.wordmark}>
          {siteTitle}
        </Link>
        <nav className={styles.nav} aria-label={siteTitle}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
