import { getPageBySlug, getSiteSettings } from "@/content/loaders";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

/** Site-wide social card. Nested routes inherit it unless they ship their own. */
export async function generateImageMetadata() {
  const [page, settings] = await Promise.all([
    getPageBySlug("hjem"),
    getSiteSettings(),
  ]);
  return [
    {
      id: "card",
      alt: page?.title ?? settings?.title ?? "",
      size: OG_SIZE,
      contentType: OG_CONTENT_TYPE,
    },
  ];
}

export default async function Image() {
  const [page, settings] = await Promise.all([
    getPageBySlug("hjem"),
    getSiteSettings(),
  ]);
  return renderOgImage({
    kicker: settings?.title,
    title: page?.title,
    footer: settings?.tagline,
  });
}
