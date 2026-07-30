import { getProjectBySlug, getSiteSettings } from "@/content/loaders";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

type Props = { params: Promise<{ slug: string }> };

export async function generateImageMetadata({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  return [
    {
      id: "card",
      alt: project?.title ?? "",
      size: OG_SIZE,
      contentType: OG_CONTENT_TYPE,
    },
  ];
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const [project, settings] = await Promise.all([
    getProjectBySlug(slug),
    getSiteSettings(),
  ]);
  return renderOgImage({
    kicker: project?.overline ?? settings?.title,
    title: project?.title,
    footer: project?.summary ?? settings?.tagline,
    /* the same seed the project card draws from, so the social image and
       the page show the same figure */
    artworkSeed: project?.slug ?? slug,
  });
}
