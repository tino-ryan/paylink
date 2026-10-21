// src/lib/receipt-card.tsx
// The receipt drawn as an image (next/og). Used for the downloadable /
// shareable picture (portrait) and the WhatsApp link preview (landscape).
// next/og rules: every element with more than one child needs display:flex.
import type { PaymentPageData } from "@/lib/types";
import { formatRand, PAID_METHOD_LABELS } from "@/lib/utils";
import { formatReceiptDate, receiptLabel } from "@/lib/receipt";

const JADE = "#0E4D3C";
const MINT = "#DCEBE4";
const APRICOT = "#EE9259";
const APRICOT_SOFT = "#FCE6D6";
const INK = "#11201A";
const MUTED = "#4A5A52";
const LINE = "#EEEAE0";
const PAID = "#11663A";
const PAID_SOFT = "#DDF3E4";
const CREAM = "#F7F3EA";
const CORNERS = "M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9";

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "P";

function Mark({ px, stroke = "#FFFFFF" }: { px: number; stroke?: string }) {
  return (
    <svg width={px} height={px} viewBox="0 0 64 64">
      <path d={CORNERS} fill="none" stroke={stroke} strokeWidth="7" strokeLinecap="round" />
      <circle cx="32" cy="32" r="7" fill={APRICOT} />
    </svg>
  );
}

function rowsFor({ request }: PaymentPageData) {
  return [
    { label: "Receipt no.", value: receiptLabel({ receiptNumber: request.receipt_number, code: request.short_code }) },
    ...(request.paid_at ? [{ label: "Paid on", value: formatReceiptDate(request.paid_at) }] : []),
    ...(request.customer_name ? [{ label: "Received from", value: truncate(request.customer_name, 30) }] : []),
    { label: "For", value: truncate(request.description, 34) },
    ...(request.paid_method ? [{ label: "Paid by", value: PAID_METHOD_LABELS[request.paid_method] }] : []),
    { label: "Reference", value: request.cashsend_reference ?? request.short_code },
  ];
}

function Amount({ cents, size }: { cents: number; size: number }) {
  const [rands, c] = formatRand(cents).replace(/^R /, "").split(".");
  return (
    <div style={{ display: "flex", alignItems: "flex-start", fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 1, color: INK }}>
      <span style={{ fontSize: size * 0.45, marginTop: size * 0.09, marginRight: size * 0.08 }}>R</span>
      <span style={{ fontSize: size }}>{rands}</span>
      <span style={{ fontSize: size * 0.45, marginTop: size * 0.09, color: MUTED }}>.{c}</span>
    </div>
  );
}

function PaidBadge({ scale }: { scale: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10 * scale,
        background: "#FFFFFF",
        color: PAID,
        borderRadius: 999,
        padding: `${8 * scale}px ${20 * scale}px`,
        fontSize: 28 * scale,
        fontWeight: 800,
      }}
    >
      <svg width={26 * scale} height={26 * scale} viewBox="0 0 24 24">
        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={PAID} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Paid
    </div>
  );
}

/** 1080 × 1440: the picture providers share and customers save. */
export function ReceiptPortrait({ data }: { data: PaymentPageData }) {
  const { provider, request } = data;
  const verified = provider.verified_at !== null;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: CREAM, padding: 56, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, background: "#FFFFFF", borderRadius: 48, overflow: "hidden" }}>
        {/* Provider */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "52px 56px 40px" }}>
          <div style={{ width: 112, height: 112, borderRadius: 999, background: APRICOT_SOFT, color: JADE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, fontWeight: 800 }}>
            {initialsOf(provider.full_name)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", color: INK }}>
              {truncate(provider.full_name, 24)}
            </span>
            <span style={{ fontSize: 28, color: MUTED }}>
              {verified ? `${provider.trade} · Verified by PayLink` : provider.trade}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, background: PAID_SOFT, padding: "48px 56px 52px" }}>
          <PaidBadge scale={1} />
          <Amount cents={request.amount_cents} size={150} />
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", padding: "24px 56px 0" }}>
          {rowsFor(data).map((row, i) => (
            <div
              key={row.label}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 32, padding: "26px 0", borderTop: i === 0 ? "none" : `2px solid ${LINE}` }}
            >
              <span style={{ fontSize: 32, color: MUTED }}>{row.label}</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: INK }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", padding: "0 56px 48px", fontSize: 26, lineHeight: 1.4, color: MUTED }}>
          {`Paid directly to ${truncate(provider.full_name, 30)}. PayLink never holds your money.`}
        </div>
      </div>

      {/* Brand strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, paddingTop: 36 }}>
        <Mark px={52} stroke={JADE} />
        <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.045em", color: JADE }}>paylink</span>
      </div>
    </div>
  );
}

/** 1200 × 630: what WhatsApp shows under the receipt link. */
export function ReceiptLandscape({ data }: { data: PaymentPageData | null }) {
  if (!data) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "64px 72px", background: JADE, color: "#FFFFFF", fontFamily: "sans-serif" }}>
        <span style={{ fontSize: 80, fontWeight: 800, letterSpacing: "-0.04em" }}>Your receipt</span>
        <Mark px={260} />
      </div>
    );
  }
  const { provider, request } = data;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: JADE, padding: 48, gap: 48, fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, color: "#FFFFFF", padding: "16px 0 16px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 34, color: MINT }}>
            {`Receipt ${receiptLabel({ receiptNumber: request.receipt_number, code: request.short_code })}`}
          </span>
          <span style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            {truncate(provider.full_name, 22)}
          </span>
          <span style={{ fontSize: 32, color: MINT }}>{truncate(request.description, 32)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Mark px={56} />
          <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.045em" }}>paylink</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, width: 500, background: PAID_SOFT, borderRadius: 40 }}>
        <PaidBadge scale={1.2} />
        <Amount cents={request.amount_cents} size={110} />
        {request.paid_at && <span style={{ fontSize: 28, color: MUTED }}>{formatReceiptDate(request.paid_at)}</span>}
      </div>
    </div>
  );
}
