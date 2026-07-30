/** Typed loaders — the only way pages read content. Zero hardcoded content. */

import { getDocument, queryDocuments } from "./client";
import type {
  Navigation,
  NavItem,
  Note,
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

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await queryDocuments<Project>("project");
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getNotes(): Promise<Note[]> {
  const notes = await queryDocuments<Note>("note");
  return notes
    .slice()
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const notes = await queryDocuments<Note>("note");
  return notes.find((n) => n.slug === slug) ?? null;
}

export async function getPapers(): Promise<Paper[]> {
  return queryDocuments<Paper>("paper");
}

/** Papers are addressed by their document id, which doubles as the slug. */
export async function getPaperBySlug(slug: string): Promise<Paper | null> {
  return getDocument<Paper>("paper", slug);
}
