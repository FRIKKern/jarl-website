/** Typed loaders — the only way pages read content. Zero hardcoded content. */

import { getDocument, queryDocuments } from "./client";
import type {
  Navigation,
  NavItem,
  Page,
  Paper,
  Project,
  SiteSettings,
} from "./types";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return getDocument<SiteSettings>("siteSettings", "siteSettings");
}

export async function getNavigation(): Promise<NavItem[]> {
  const nav = await getDocument<Navigation>("navigation", "navigation");
  return (nav?.items ?? [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/* NOTE: the query route serves full type listings; it does not apply
   arbitrary field filters, so slug matching happens here. */

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const pages = await queryDocuments<Page>("page");
  return pages.find((p) => p.slug === slug) ?? null;
}

export async function getProjects(): Promise<Project[]> {
  const projects = await queryDocuments<Project>("project");
  return projects.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

export async function getFeaturedProjects(): Promise<Project[]> {
  return (await getProjects()).filter((p) => p.featured === true);
}

/** The two shelves a project can stand on — see `Project.kategori`. */
export type Kategori = "kunde" | "egen";

/** Tolerant read of `kategori`. ONLY the exact word «kunde» claims the
    client shelf; absent, misspelt or unknown values all fall to «egen», so
    a bad value hides a post from neither index — it just files it under the
    one that means «mine». */
export function projectKategori(project: Project): Kategori {
  return project.kategori?.trim().toLowerCase() === "kunde" ? "kunde" : "egen";
}

/** One shelf, in the shared project order. */
export async function getProjectsByKategori(
  kategori: Kategori,
): Promise<Project[]> {
  return (await getProjects()).filter((p) => projectKategori(p) === kategori);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await queryDocuments<Project>("project");
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getPapers(): Promise<Paper[]> {
  return queryDocuments<Paper>("paper");
}

/** Papers are addressed by their document id, which doubles as the slug. */
export async function getPaperBySlug(slug: string): Promise<Paper | null> {
  return getDocument<Paper>("paper", slug);
}

/** Resolve a project's story reference to its paper. The ruling
    («Prosjektene er ment til å skrives med Bulldocs») makes the linked paper
    the project's narrative; a project without one simply has no story yet.
    A dangling reference resolves to null — the page then falls back exactly
    like an absent one, never a broken band. */
export async function getProjectStory(
  project: Project | null,
): Promise<Paper | null> {
  if (!project?.story) return null;
  return getPaperBySlug(project.story);
}
