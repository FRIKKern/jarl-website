import type { SiteSettings } from "@/content/types";
import { Band } from "./Band";
import styles from "./SiteFooter.module.css";

/** The page closes on the inverted ground — the same band primitive every
    section uses, so the footer is not a special case.

    It takes the seam. In light the ink band against cream is already a hard
    edge, but in dark the footer (0.148 L) sits only 6 points under the page
    (0.208 L) and the closing gesture all but disappears — so the band draws
    the same hairline it draws anywhere two like grounds meet. */
export function SiteFooter({ settings }: { settings: SiteSettings | null }) {
  return (
    <Band as="footer" surface="ink" space="tight" rule>
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
    </Band>
  );
}
