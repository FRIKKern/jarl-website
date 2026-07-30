"use client";

/**
 * The ONLY client component in the app, and only because `aria-current` needs
 * the live pathname — a server component cannot know it. Everything else in
 * the header stays on the server.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/content/types";
import styles from "./SiteHeader.module.css";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNav({ items, label }: { items: NavItem[]; label?: string }) {
  const pathname = usePathname() ?? "/";

  return (
    <nav className={styles.nav} aria-label={label}>
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.navLink}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
