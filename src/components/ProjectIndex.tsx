import type { Metadata } from "next";
import type { Kategori } from "@/content/loaders";
import {
  getNavigation,
  getPageBySlug,
  getProjectsByKategori,
  getSiteSettings,
} from "@/content/loaders";
import { routeMetadata } from "@/lib/metadata";
import { Band } from "./Band";
import { ProjectCard } from "./ProjectCard";
import styles from "@/app/article.module.css";

/**
 * The two project shelves, rendered by ONE component — because they are one
 * thing. `project` is a single document type; the only difference between
 * /prosjekter and /kuriositeter is who asked for the work (`kategori`), so
 * the ceremony, the grid and the card are shared and only the copy differs.
 *
 * The copy is a `page` document like any other route's — kicker, title,
 * lede — so both shelves are renamed and re-framed in Studio without a code
 * change. The navigation label and the site tagline stand behind it as the
 * same last-resort fallbacks the index has always used.
 *
 * DETAIL ROUTES DO NOT SPLIT. Every post keeps its address at
 * /prosjekter/[slug] whichever shelf it stands on: the category is an
 * editorial fact about a document, not a fact about its URL, and a post that
 * changed shelf would otherwise break every link ever made to it.
 */

interface Shelf {
  /** Slug of the `page` document carrying this index's copy. */
  slug: string;
  /** The index's own path — also the nav item's href. */
  href: string;
  kategori: Kategori;
}

export const PROSJEKTER: Shelf = {
  slug: "prosjekter",
  href: "/prosjekter",
  kategori: "kunde",
};

export const KURIOSITETER: Shelf = {
  slug: "kuriositeter",
  href: "/kuriositeter",
  kategori: "egen",
};

export async function projectIndexMetadata(shelf: Shelf): Promise<Metadata> {
  const [page, navItems, settings] = await Promise.all([
    getPageBySlug(shelf.slug),
    getNavigation(),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: page?.title ?? navItems.find((i) => i.href === shelf.href)?.label,
    description: page?.seoDescription ?? page?.intro ?? settings?.tagline,
    path: shelf.href,
    siteName: settings?.title,
  });
}

export async function ProjectIndex({ shelf }: { shelf: Shelf }) {
  const [page, navItems, projects, settings] = await Promise.all([
    getPageBySlug(shelf.slug),
    getNavigation(),
    getProjectsByKategori(shelf.kategori),
    getSiteSettings(),
  ]);
  const title = page?.title ?? navItems.find((i) => i.href === shelf.href)?.label;
  const lede = page?.intro ?? settings?.tagline;

  return (
    <>
      <Band rule space="tight">
        <header className={styles.header}>
          {page?.overline ? (
            <p className={`${styles.overline} jarl-reveal-1`}>{page.overline}</p>
          ) : null}
          <h1 className={`${styles.displayTitle} jarl-reveal-1`}>{title}</h1>
          {lede ? <p className={`${styles.intro} jarl-reveal-2`}>{lede}</p> : null}
        </header>
      </Band>
      <Band rule>
        <div className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} headingLevel={2} />
          ))}
        </div>
      </Band>
    </>
  );
}
