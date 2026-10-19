// src/app/receipt/[code]/image/route.tsx
// GET /receipt/ABC123/image → the receipt as a PNG (1080 × 1440).
// Providers share it as a picture; customers can save it to their gallery.
// Add ?download=1 to make the browser save it instead of showing it.
import { ImageResponse } from "next/og";
import { getPaymentPage } from "@/lib/public-data";
import { receiptLabel } from "@/lib/receipt";
import { ReceiptPortrait } from "@/lib/receipt-card";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const page = await getPaymentPage(code.toUpperCase());
  if (!page || page.request.status !== "paid") {
    return Response.json({ error: "Receipt not found", code: "not_found" }, { status: 404 });
  }

  const label = receiptLabel({ receiptNumber: page.request.receipt_number, code: page.request.short_code });
  const download = new URL(request.url).searchParams.get("download") === "1";

  return new ImageResponse(<ReceiptPortrait data={page} />, {
    width: 1080,
    height: 1440,
    headers: {
      // A paid receipt doesn't change, but keep it short in case a provider
      // is suspended (their receipts then stop rendering).
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      ...(download ? { "Content-Disposition": `attachment; filename="receipt-${label}.png"` } : {}),
    },
  });
}
