import { getNoteBySlug, getSiteSettings } from "@/content/loaders";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { excerpt } from "@/lib/text";

type Props = { params: Promise<{ slug: string }> };

export async function generateImageMetadata({ params }: Props) {
  const { slug } = await params;
  const note = await getNoteBySlug(slug);
  return [
    {
      id: "card",
      alt: note?.title ?? "",
      size: OG_SIZE,
      contentType: OG_CONTENT_TYPE,
    },
  ];
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const [note, settings] = await Promise.all([
    getNoteBySlug(slug),
    getSiteSettings(),
  ]);
  return renderOgImage({
    kicker: settings?.title,
    title: note?.title,
    footer: excerpt(note?.body, 110) ?? settings?.tagline,
  });
}
