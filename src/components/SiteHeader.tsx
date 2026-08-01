import Link from "next/link";
import type { NavItem } from "@/content/types";
import { SiteNav } from "./SiteNav";
import styles from "./SiteHeader.module.css";

/**
 * The symmetric masthead — tinholt's identity move. The wordmark stands
 * dead-center; the nav splits around it, half to each side, so the header
 * reads as a broadsheet nameplate rather than a logo-left toolbar.
 *
 * The home destination is the wordmark itself, so the "/" item is folded
 * out of the link groups rather than duplicated beside them. The split is
 * positional, not named: first half left, second half right, so the CMS
 * still owns the labels and the order.
 */
export function SiteHeader({
  siteTitle,
  items,
}: {
  siteTitle?: string;
  items: NavItem[];
}) {
  const links = items.filter((item) => item.href !== "/");
  const mid = Math.ceil(links.length / 2);

  return (
    <header className={styles.header}>
      <nav className={styles.inner} aria-label={siteTitle}>
        <SiteNav items={links.slice(0, mid)} side="left" />
        <Link href="/" className={styles.wordmark}>
          {siteTitle}
        </Link>
        <SiteNav items={links.slice(mid)} side="right" />
      </nav>
    </header>
  );
}
