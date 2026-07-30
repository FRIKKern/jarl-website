import { getPaperBySlug, getSiteSettings } from "@/content/loaders";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

type Props = { params: Promise<{ slug: string }> };

export async function generateImageMetadata({ params }: Props) {
  const { slug } = await params;
  const paper = await getPaperBySlug(slug);
  return [
    {
      id: "card",
      alt: paper?.title ?? "",
      size: OG_SIZE,
      contentType: OG_CONTENT_TYPE,
    },
  ];
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const [paper, settings] = await Promise.all([
    getPaperBySlug(slug),
    getSiteSettings(),
  ]);
  return renderOgImage({
    kicker: settings?.title,
    title: paper?.title,
    footer: paper?.description ?? settings?.tagline,
  });
}
