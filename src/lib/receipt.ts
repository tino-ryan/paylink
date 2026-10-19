// src/lib/receipt.ts
// Everything needed to send a customer their receipt: the details, the link,
// and a WhatsApp message that reads like a proper receipt on its own.
import { formatRand, formatReceiptNumber, PAID_METHOD_LABELS } from "@/lib/utils";
import type { PaidMethod } from "@/lib/types";

export interface ReceiptInfo {
  code: string;
  receiptNumber: number | null;
  description: string;
  amountCents: number;
  paidAt: string | null;
  paidMethod: PaidMethod | null;
  providerName: string;
}

/** The customer-facing receipt page. Separate from /pay/[code] so WhatsApp
 *  shows a fresh "receipt" preview, not the cached payment-request one. */
export const receiptUrl = (appUrl: string, code: string) =>
  `${appUrl.replace(/\/$/, "")}/receipt/${code}`;

export const receiptLabel = (info: Pick<ReceiptInfo, "receiptNumber" | "code">) =>
  info.receiptNumber ? formatReceiptNumber(info.receiptNumber) : info.code;

export const formatReceiptDate = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

/** "0712345678" → "27712345678", the format wa.me needs. */
export const toWhatsAppNumber = (localPhone: string) => `27${localPhone.slice(1)}`;

/**
 * WhatsApp message. Uses WhatsApp's *bold* so it's readable even if the
 * customer never opens the link.
 */
export function receiptMessage(info: ReceiptInfo, url: string): string {
  const lines = [
    `*Receipt ${receiptLabel(info)}* ✅`,
    `From: ${info.providerName}`,
    `For: ${info.description}`,
    `Amount: *${formatRand(info.amountCents)}*`,
    ...(info.paidAt ? [`Paid: ${formatReceiptDate(info.paidAt)}`] : []),
    ...(info.paidMethod ? [`Paid by: ${PAID_METHOD_LABELS[info.paidMethod]}`] : []),
    "",
    "Thank you for your payment!",
    "",
    "View, save or print your receipt:",
    url,
  ];
  return lines.join("\n");
}
