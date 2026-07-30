import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperBySlug, getPapers, getSiteSettings } from "@/content/loaders";
import { PaperRenderer } from "@/components/PaperRenderer";
import { JsonLd } from "@/components/JsonLd";
import { routeMetadata } from "@/lib/metadata";
import { paperSchema } from "@/lib/structured-data";
import styles from "./page.module.css";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const papers = await getPapers();
  return papers.map((p) => ({ slug: p._id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [paper, settings] = await Promise.all([
    getPaperBySlug(slug),
    getSiteSettings(),
  ]);
  return routeMetadata({
    title: paper?.title,
    description: paper?.description,
    path: `/papers/${slug}`,
    siteName: settings?.title,
    type: "article",
    publishedTime: paper?._createdAt,
    modifiedTime: paper?._updatedAt,
  });
}

export default async function PaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [paper, settings] = await Promise.all([
    getPaperBySlug(slug),
    getSiteSettings(),
  ]);
  if (!paper) notFound();

  return (
    <article className={styles.shell}>
      <JsonLd data={paperSchema(paper, settings)} />
      <PaperRenderer blocks={paper.blocks} />
    </article>
  );
}
