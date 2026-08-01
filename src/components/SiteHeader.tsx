import Link from "next/link";
import type { NavItem, SiteSettings } from "@/content/types";
import type { Chrome } from "@/content/chrome";
import { SiteNav } from "./SiteNav";
import { MenuDrawer } from "./MenuDrawer";
import styles from "./SiteHeader.module.css";

/**
 * The symmetric masthead — tinholt's identity move. The wordmark stands
 * dead-center; the nav splits around it, half to each side, so the header
 * reads as a broadsheet nameplate rather than a logo-left toolbar. The
 * right group additionally carries «Meny», the drawer's trigger, on every
 * viewport — tinholt keeps the menu even where the links all fit.
 *
 * The masthead sits ON the page's ground (rule 8): it paints the same
 * --color-* the page-level theme laid down, takes the first band's hairline
 * as its underline, scrolls away, and is never sticky and never over media.
 *
 * The home destination is the wordmark itself, so the "/" item is folded
 * out of the link groups rather than duplicated beside them. The split is
 * positional, not named: first half left, second half right, so the CMS
 * still owns the labels and the order.
 */
export function SiteHeader({
  settings,
  items,
  chrome,
}: {
  settings: SiteSettings | null;
  items: NavItem[];
  chrome: Chrome;
}) {
  const links = items.filter((item) => item.href !== "/");
  const mid = Math.ceil(links.length / 2);

  return (
    <header className={styles.header}>
      <nav className={styles.inner} aria-label={settings?.title}>
        <SiteNav items={links.slice(0, mid)} side="left" />
        <Link href="/" className={styles.wordmark}>
          {settings?.title}
        </Link>
        <div className={styles.right}>
          <SiteNav items={links.slice(mid)} side="right" />
          <MenuDrawer
            items={items}
            socialLinks={settings?.socialLinks ?? []}
            email={settings?.email}
            menuLabel={chrome.menu}
            closeLabel={chrome.menuClose}
          />
        </div>
      </nav>
    </header>
  );
}
