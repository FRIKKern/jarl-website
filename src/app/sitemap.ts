import type { MetadataRoute } from "next";
import {
  getNotes,
  getPageBySlug,
  getPapers,
  getProjects,
} from "@/content/loaders";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 60;

/** Newest `_updatedAt` in a set of documents. */
function newest(docs: { _updatedAt?: string }[]): string | undefined {
  return docs
    .map((d) => d._updatedAt)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [home, about, contact, projects, notes, papers] = await Promise.all([
    getPageBySlug("hjem"),
    getPageBySlug("om"),
    getPageBySlug("kontakt"),
    getProjects(),
    getNotes(),
    getPapers(),
  ]);

  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: home?._updatedAt, priority: 1 },
    {
      url: absoluteUrl("/prosjekter"),
      lastModified: newest(projects),
      priority: 0.8,
    },
    {
      url: absoluteUrl("/notater"),
      lastModified: newest(notes),
      priority: 0.8,
    },
    { url: absoluteUrl("/om"), lastModified: about?._updatedAt, priority: 0.6 },
    {
      url: absoluteUrl("/kontakt"),
      lastModified: contact?._updatedAt,
      priority: 0.6,
    },
  ];

  for (const project of projects) {
    entries.push({
      url: absoluteUrl(`/prosjekter/${project.slug ?? project._id}`),
      lastModified: project._updatedAt,
      priority: 0.7,
    });
  }

  for (const note of notes) {
    entries.push({
      url: absoluteUrl(`/notater/${note.slug ?? note._id}`),
      lastModified: note._updatedAt,
      priority: 0.7,
    });
  }

  for (const paper of papers) {
    entries.push({
      url: absoluteUrl(`/papers/${paper._id}`),
      lastModified: paper._updatedAt,
      priority: 0.5,
    });
  }

  return entries;
}
