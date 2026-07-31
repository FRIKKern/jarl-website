import type { NextConfig } from "next";

/** The Barkpark instance that serves this site's content AND its media. */
const BARKPARK_URL = (
  process.env.BARKPARK_URL ?? "https://jarl.barkpark.cloud"
).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * `/media/*` is the Barkpark media library, proxied onto this origin.
   *
   * Images would work as absolute cross-origin URLs — an `<img>` needs no
   * permission. The asciicast player does: `hydratePortableDoc` mounts
   * asciinema-player, which `fetch()`es the `.cast` file, and the instance
   * serves `/media/files/*` with no `Access-Control-Allow-Origin` header.
   * Cross-origin that fetch is blocked and the terminal recording never
   * plays. Proxied, it is same-origin and simply works.
   *
   * The second reason is the better one: with this in place a paper's media
   * URLs are root-relative, so the same document renders correctly in Studio,
   * on jarl.no, and on any other surface pointed at the same instance. The
   * document stops carrying a hostname it has no business knowing.
   */
  async rewrites() {
    return [
      { source: "/media/:path*", destination: `${BARKPARK_URL}/media/:path*` },
    ];
  },
};

export default nextConfig;
