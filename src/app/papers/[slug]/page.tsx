import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Block } from "@barkpark/react";
import "@barkpark/react/paper-surface.css";
import "@/app/paper-media.css";
import { getPaperBySlug, getPapers, getSiteSettings } from "@/content/loaders";
import { Band } from "@/components/Band";
import { PortableDocSurface } from "@/components/PortableDocSurface";
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

  /* The wire (charter D5): top-level `blocks`, falling back to `body.blocks`
     — byte-equal on the live instance; `body_html` is deliberately ignored. */
  const blocks = (paper.blocks ?? paper.body?.blocks ?? []) as Block[];

  return (
    <article>
      <JsonLd data={paperSchema(paper, settings)} />
      <Band surface="paper" rule>
        {/* The canonical engine owns the markup and the Reader-Owned spacing
            law; the jarl drakt is token overrides scoped to .bp-paper-surface
            in globals.css. The band only decides where the column starts. */}
        <div className={styles.shell}>
          <PortableDocSurface blocks={blocks} />
        </div>
      </Band>
    </article>
  );
}
