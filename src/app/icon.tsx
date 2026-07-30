import { ImageResponse } from "next/og";
import { monogramDataUri } from "@/lib/monogram";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon — the Jarl mark on its ink tile. */
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <img
          src={monogramDataUri(size.width)}
          width={size.width}
          height={size.height}
          alt=""
        />
      </div>
    ),
    size,
  );
}
