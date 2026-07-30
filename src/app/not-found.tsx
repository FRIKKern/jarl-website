import Link from "next/link";
import {
  getNavigation,
  getPageBySlug,
  getSiteSettings,
} from "@/content/loaders";
import { getChrome } from "@/content/chrome";
import { Band } from "@/components/Band";
import { Prose } from "@/components/Prose";
import styles from "./article.module.css";

/**
 * 404 in the site's own language.
 *
 * If a `page` document with the slug `404` exists in Studio it owns the copy
 * entirely; otherwise the chrome fallbacks stand in. The navigation is always
 * offered as the way back, straight from the CMS.
 */
export default async function NotFound() {
  const [page, settings, navItems] = await Promise.all([
    getPageBySlug("404"),
    getSiteSettings(),
    getNavigation(),
  ]);
  const chrome = getChrome(settings);

  return (
    <Band surface="ink" space="hero">
      <header className={styles.header}>
        <p className={styles.overline}>404</p>
        <h1 className={styles.displayTitle}>
          {page?.title ?? chrome.notFoundTitle}
        </h1>
        <p className={styles.intro}>{page?.intro ?? chrome.notFoundIntro}</p>
      </header>
      {page?.body ? <Prose text={page.body} /> : null}
      {navItems.length > 0 ? (
        <ul className={styles.linkList}>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Band>
  );
}
