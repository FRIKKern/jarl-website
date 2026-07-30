import { ImageResponse } from "next/og";
import { monogramDataUri } from "@/lib/monogram";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon — square edges, because iOS applies its own mask. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <img
          src={monogramDataUri(size.width, { radius: 0 })}
          width={size.width}
          height={size.height}
          alt=""
        />
      </div>
    ),
    size,
  );
}
