// src/app/receipt/[code]/page.tsx
// The customer's receipt. Same data as /pay/[code] once paid, but its own URL
// so the link WhatsApp previews is a receipt, not the old payment request.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPaymentPage } from "@/lib/public-data";
import { receiptLabel } from "@/lib/receipt";
import { Receipt } from "@/components/pay/Receipt";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const page = await getPaymentPage(code.toUpperCase());
  if (!page || page.request.status !== "paid") return { title: "Receipt", robots: { index: false } };
  const label = receiptLabel({ receiptNumber: page.request.receipt_number, code: page.request.short_code });
  return {
    title: `Receipt ${label} from ${page.provider.full_name}`,
    description: `${page.request.description}. Paid to ${page.provider.full_name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function ReceiptPage({ params }: Props) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const page = await getPaymentPage(upper);
  if (!page) notFound();
  // Not paid yet: the payment page explains what's going on.
  if (page.request.status !== "paid") redirect(`/pay/${upper}`);

  return <Receipt provider={page.provider} request={page.request} />;
}
