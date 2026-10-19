// src/app/receipt/[code]/opengraph-image.tsx
// The card WhatsApp shows under a receipt link. Never fails the share.
import { ImageResponse } from "next/og";
import { getPaymentPage } from "@/lib/public-data";
import { ReceiptLandscape } from "@/lib/receipt-card";
import type { PaymentPageData } from "@/lib/types";

export const alt = "PayLink receipt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  let data: PaymentPageData | null = null;
  try {
    const page = await getPaymentPage(code.toUpperCase());
    data = page && page.request.status === "paid" ? page : null;
  } catch {
    data = null;
  }
  return new ImageResponse(<ReceiptLandscape data={data} />, size);
}
