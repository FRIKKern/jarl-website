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
          <nav className={styles.links}>
            {settings.socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={styles.link}
                rel="noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
