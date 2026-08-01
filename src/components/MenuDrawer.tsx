"use client";

/**
 * The menu drawer — tinholt's second navigation surface.
 *
 * «Meny» sits in the masthead's right group on every viewport. The drawer
 * slides DOWN from under the header on a max-height ride (--dur-drawer /
 * --ease-drawer, tinholt's measured .9s cubic-bezier(.4,0,.2,1)) while an
 * obfuscator veils the page behind it. The panel paints var(--color-bg), so
 * it mirrors the page's ground for free: greige on a light page, navy on a
 * mork page — the page-level theme reaches it like everything else.
 *
 * Inside, the colophon's grammar restated as stacked hairline rows: the
 * serif primary nav, the small two-column secondary (the social links), and
 * the contact row. All content arrives as props from the CMS; the two
 * labels ride the chrome fallbacks (src/content/chrome.ts).
 *
 * Accessibility: the trigger carries aria-expanded/aria-controls and turns
 * into «Lukk» while open; Esc closes and returns focus; Tab is trapped
 * across trigger + panel; a route change closes it; reduced motion collapses
 * the ride to nothing via the global media rule.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { NavItem, SocialLink } from "@/content/types";
import styles from "./MenuDrawer.module.css";

export function MenuDrawer({
  items,
  socialLinks,
  email,
  menuLabel,
  closeLabel,
}: {
  items: NavItem[];
  socialLinks: SocialLink[];
  email?: string;
  menuLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  /* choosing a destination closes the drawer — the new page opens on its
     own ground. On the links themselves (not a pathname effect): it also
     covers clicking the page one already stands on. */
  const closeOnNavigate = useCallback(() => close(false), [close]);

  /* Esc closes from anywhere; Tab cycles within trigger + panel */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;
      const root = rootRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll<HTMLElement>("a[href], button");
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  /* the page behind the veil neither scrolls nor answers */
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        {open ? closeLabel : menuLabel}
      </button>

      <div
        className={styles.veil}
        data-open={open ? "" : undefined}
        aria-hidden="true"
        onClick={() => close(true)}
      />

      <div
        id={panelId}
        className={styles.drawer}
        data-open={open ? "" : undefined}
        /* closed = inert: nothing inside is focusable or clickable while
           the panel is ridden shut */
        inert={!open}
      >
        <div className={styles.inner}>
          {items.length > 0 ? (
            <ul className={styles.primary}>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={styles.primaryLink}
                    onClick={closeOnNavigate}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          {socialLinks.length > 0 ? (
            <ul className={styles.secondary}>
              {socialLinks.map((link) => (
                <li key={link.href} className={styles.secondaryCell}>
                  <a href={link.href} className={styles.secondaryLink} rel="noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {email ? (
            <p className={styles.contact}>
              <a href={`mailto:${email}`} className={styles.contactLink}>
                {email}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
