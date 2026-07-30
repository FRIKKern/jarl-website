/**
 * schema.org nodes built strictly from CMS documents.
 *
 * Nothing here invents a value: if a field is absent in Barkpark it is absent
 * from the graph.
 */

import type { Note, Paper, Project, SiteSettings } from "@/content/types";
import { SITE_URL, absoluteUrl } from "./site";
import { excerpt } from "./text";

const CONTEXT = "https://schema.org";
const LANGUAGE = "nb-NO";

type Node = Record<string, unknown>;

/** Drop keys whose value is undefined, empty string or empty array. */
function compact(node: Node): Node {
  return Object.fromEntries(
    Object.entries(node).filter(([, v]) =>
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== "",
    ),
  );
}

function person(settings: SiteSettings | null): Node {
  return compact({
    "@type": "Person",
    name: settings?.title,
    description: settings?.tagline,
    email: settings?.email,
    url: SITE_URL,
    sameAs: (settings?.socialLinks ?? []).map((link) => link.href),
  });
}

/** Person node for the home page. */
export function personSchema(settings: SiteSettings | null): Node {
  return { "@context": CONTEXT, ...person(settings) };
}

/** BlogPosting node for a note. */
export function notePostingSchema(
  note: Note,
  settings: SiteSettings | null,
): Node {
  const url = absoluteUrl(`/notater/${note.slug ?? note._id}`);
  return compact({
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: note.title,
    description: excerpt(note.body),
    datePublished: note.publishedAt ?? note._createdAt,
    dateModified: note._updatedAt,
    inLanguage: LANGUAGE,
    url,
    mainEntityOfPage: url,
    author: person(settings),
    publisher: person(settings),
  });
}

/** CreativeWork node for a project. */
export function projectSchema(
  project: Project,
  settings: SiteSettings | null,
): Node {
  return compact({
    "@context": CONTEXT,
    "@type": "CreativeWork",
    name: project.title,
    headline: project.overline,
    description: project.summary,
    keywords: (project.tags ?? []).join(", "),
    inLanguage: LANGUAGE,
    url: absoluteUrl(`/prosjekter/${project.slug ?? project._id}`),
    sameAs: project.url ? [project.url] : [],
    dateModified: project._updatedAt,
    creator: person(settings),
  });
}

/** CreativeWork node for a Bulldocs paper. */
export function paperSchema(
  paper: Paper,
  settings: SiteSettings | null,
): Node {
  return compact({
    "@context": CONTEXT,
    "@type": "CreativeWork",
    name: paper.title,
    description: paper.description,
    inLanguage: LANGUAGE,
    url: absoluteUrl(`/papers/${paper._id}`),
    datePublished: paper._createdAt,
    dateModified: paper._updatedAt,
    author: person(settings),
  });
}
