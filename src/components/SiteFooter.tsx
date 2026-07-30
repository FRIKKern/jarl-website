import type { SiteSettings } from "@/content/types";
import styles from "./SiteFooter.module.css";

export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          {settings?.email ? (
            <a href={`mailto:${settings.email}`} className={styles.email}>
              {settings.email}
            </a>
          ) : null}
          {settings?.footerText ? (
            <p className={styles.text}>{settings.footerText}</p>
          ) : null}
        </div>
        {settings?.socialLinks?.length ? (
          /* A list, not a <nav>: a second unlabelled navigation landmark
             next to the header's only muddies the landmark map. */
          <ul className={styles.links}>
            {settings.socialLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={styles.link} rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </footer>
  );
}
