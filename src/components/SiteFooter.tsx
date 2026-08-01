import Link from "next/link";
import type { NavItem, SiteSettings } from "@/content/types";
import { Band } from "./Band";
import styles from "./SiteFooter.module.css";

/** The footer as colophon — the page's closing ceremony on the inverted
    ground, tinholt-style: stacked centered serif nav, a hairline-divided
    contact row, and the wordmark said LARGE at the very bottom with the
    colophon line under it. Same band primitive as every section, so the
    footer is still not a special case.

    It takes the seam. In light the ink band against cream is already a hard
    edge, but in dark the footer sits only a few points under the page and
    the closing gesture all but disappears — so the band draws the same
    hairline it draws anywhere two like grounds meet.

    The home destination is the wordmark, exactly like the masthead, so the
    "/" item folds out of the stacked nav rather than doubling. A list, not
    a <nav>: a second unlabelled navigation landmark next to the header's
    only muddies the landmark map. */
export function SiteFooter({
  settings,
  items,
}: {
  settings: SiteSettings | null;
  items: NavItem[];
}) {
  const links = items.filter((item) => item.href !== "/");

  return (
    <Band as="footer" surface="ink" rule>
      <div className={styles.colophon}>
        {links.length > 0 ? (
          <ul className={styles.navStack}>
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {settings?.email || settings?.socialLinks?.length ? (
          <div className={styles.metaRow}>
            {settings?.email ? (
              <a href={`mailto:${settings.email}`} className={styles.email}>
                {settings.email}
              </a>
            ) : null}
            {settings?.socialLinks?.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={styles.metaLink}
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        ) : null}

        <div className={styles.mark}>
          <Link href="/" className={styles.wordmark}>
            {settings?.title}
          </Link>
          {settings?.footerText ? (
            <p className={styles.colophonLine}>{settings.footerText}</p>
          ) : null}
        </div>
      </div>
    </Band>
  );
}
