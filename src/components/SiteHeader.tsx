import Link from "next/link";
import type { NavItem } from "@/content/types";
import { SiteNav } from "./SiteNav";
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
        <SiteNav items={items} label={siteTitle} />
      </div>
    </header>
  );
}
