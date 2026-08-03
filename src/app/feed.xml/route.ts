import { getPapers, getSiteSettings } from "@/content/loaders";
import { FEED_LANGUAGE, SITE_URL, absoluteUrl } from "@/lib/site";
import { escapeXml } from "@/lib/text";

export const revalidate = 60;

interface FeedItem {
  title?: string;
  link: string;
  description?: string;
  date?: string;
}

function item({ title, link, description, date }: FeedItem): string {
  const published = date ? new Date(date) : null;
  return [
    "    <item>",
    title ? `      <title>${escapeXml(title)}</title>` : "",
    `      <link>${escapeXml(link)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
    published && !Number.isNaN(published.valueOf())
      ? `      <pubDate>${published.toUTCString()}</pubDate>`
      : "",
    description
      ? `      <description>${escapeXml(description)}</description>`
      : "",
    "    </item>",
  ]
    .filter(Boolean)
    .join("\n");
}

/** RSS 2.0 over the papers, newest first, absolute URLs throughout.
    Papers are the site's only serial long-form store, so they are the feed. */
export async function GET(): Promise<Response> {
  const [settings, papers] = await Promise.all([getSiteSettings(), getPapers()]);

  const entries: (FeedItem & { sortKey: string })[] = papers
    .map((paper) => ({
      title: paper.title,
      link: absoluteUrl(`/papers/${paper._id}`),
      description: paper.description,
      date: paper._createdAt,
      sortKey: paper._createdAt ?? "",
    }))
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const latest = entries[0]?.date;
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    settings?.title ? `    <title>${escapeXml(settings.title)}</title>` : "",
    `    <link>${SITE_URL}</link>`,
    settings?.tagline
      ? `    <description>${escapeXml(settings.tagline)}</description>`
      : "",
    `    <language>${FEED_LANGUAGE}</language>`,
    latest ? `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>` : "",
    `    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml"/>`,
    ...entries.map(item),
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": `public, max-age=0, s-maxage=${revalidate}, stale-while-revalidate`,
    },
  });
}
