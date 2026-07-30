import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPaperBySlug, getPapers } from "@/content/loaders";
import { PaperRenderer } from "@/components/PaperRenderer";
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
  const paper = await getPaperBySlug(slug);
  return { title: paper?.title, description: paper?.description };
}

export default async function PaperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const paper = await getPaperBySlug(slug);
  if (!paper) notFound();

  return (
    <article className={styles.shell}>
      <PaperRenderer blocks={paper.blocks} />
    </article>
  );
}
