// src/app/opengraph-image.tsx
// The preview card when someone shares the PayLink website on WhatsApp,
// Facebook or LinkedIn. Payment links keep their own card (pay/[code]).
import { ImageResponse } from "next/og";

export const alt = "PayLink: send a link, get paid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const JADE = "#0E4D3C";
const MINT = "#DCEBE4";
const APRICOT = "#EE9259";
const CORNERS = "M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "64px 72px",
          background: JADE,
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 700 }}>
          <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.045em" }}>paylink</span>
          <span style={{ fontSize: 84, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>
            Send a link. Get paid.
          </span>
          <span style={{ fontSize: 32, color: MINT }}>
            Payment links and QR codes. No card machine, no app.
          </span>
        </div>
        <svg width={300} height={300} viewBox="0 0 64 64">
          <path d={CORNERS} fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
          <circle cx="32" cy="32" r="7" fill={APRICOT} />
        </svg>
      </div>
    ),
    size,
  );
}
