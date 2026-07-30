import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperBySlug, getPapers, getSiteSettings } from "@/content/loaders";
import { Band } from "@/components/Band";
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
    <article>
      <JsonLd data={paperSchema(paper, settings)} />
      <Band surface="paper" rule>
        {/* The mechanical spacing law lives inside PaperRenderer: no renderer
            margins, one empty paragraph block = exactly one blank row. The
            band only decides where the column starts. */}
        <div className={styles.shell}>
          <PaperRenderer blocks={paper.blocks} />
        </div>
      </Band>
    </article>
  );
}
