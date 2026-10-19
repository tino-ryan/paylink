// src/app/pay/[code]/opengraph-image.tsx
// The card WhatsApp shows when a payment link is shared: provider, job,
// amount and the PayLink mark on jade (Brand Kit "WhatsApp link preview").
// Only shows what the payment page already shows to anyone with the link.
import { ImageResponse } from "next/og";
import { getPaymentPage } from "@/lib/public-data";
import { formatRand } from "@/lib/utils";

export const alt = "PayLink payment request";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const JADE = "#0E4D3C";
const MINT = "#DCEBE4";
const APRICOT = "#EE9259";
const APRICOT_SOFT = "#FCE6D6";
const CORNERS = "M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9";

function Mark({ px }: { px: number }) {
  return (
    <svg width={px} height={px} viewBox="0 0 64 64">
      <path d={CORNERS} fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="32" r="7" fill={APRICOT} />
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  // Never fail the share: fall back to a plain brand card.
  let page: Awaited<ReturnType<typeof getPaymentPage>> = null;
  try {
    page = await getPaymentPage(code.toUpperCase());
  } catch {
    page = null;
  }

  const name = page?.provider.full_name ?? "PayLink";
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";
  const amount = page ? formatRand(page.request.amount_cents) : null; // "R 1 250.00"
  const [rands, cents] = amount ? amount.replace(/^R /, "").split(".") : ["", ""];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "stretch",
          padding: "64px 72px",
          background: JADE,
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div
              style={{
                width: 104,
                height: 104,
                borderRadius: 999,
                background: APRICOT_SOFT,
                color: JADE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                fontWeight: 800,
              }}
            >
              {initials}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 58, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {name.length > 26 ? `${name.slice(0, 25)}…` : name}
              </span>
              {page && (
                <span style={{ fontSize: 30, color: MINT }}>
                  {page.request.description.length > 40
                    ? `${page.request.description.slice(0, 39)}…`
                    : page.request.description}
                </span>
              )}
            </div>
          </div>

          {amount ? (
            <div style={{ display: "flex", alignItems: "flex-start", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.9 }}>
              <span style={{ fontSize: 68, marginTop: 14, marginRight: 10 }}>R</span>
              <span style={{ fontSize: 150 }}>{rands}</span>
              <span style={{ fontSize: 68, marginTop: 14, color: MINT }}>.{cents}</span>
            </div>
          ) : (
            <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: "-0.04em" }}>Get paid instantly.</span>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.045em" }}>paylink</span>
            <span style={{ width: 2, height: 34, background: "rgba(255,255,255,0.25)" }} />
            <span style={{ fontSize: 28, color: MINT }}>Tap to pay. No app needed.</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark px={280} />
        </div>
      </div>
    ),
    size,
  );
}
