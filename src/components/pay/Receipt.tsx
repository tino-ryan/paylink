// src/components/pay/Receipt.tsx
// What a customer sees on their payment link once the provider confirms it:
// a proper receipt they can screenshot, print or save as PDF. On paper the
// card is swapped for ReceiptDocument, a normal A4 receipt layout.
import { formatRand, formatReceiptNumber, PAID_METHOD_LABELS } from "@/lib/utils";
import type { PublicPayoutDetails, PublicRequest } from "@/lib/types";
import { ReceiptDocument } from "@/components/pay/ReceiptDocument";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { buttonClasses } from "@/components/ui/Button";
import { PublicShell } from "@/components/ui/PublicShell";
import { Avatar, MoneyHero } from "@/components/ui/Surface";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

export interface ReceiptProps {
  provider: PublicPayoutDetails;
  request: PublicRequest;
}

export function Receipt({ provider, request }: ReceiptProps) {
  const receiptNo = request.receipt_number
    ? formatReceiptNumber(request.receipt_number)
    : request.short_code;
  const firstName = provider.full_name.split(" ")[0];

  const rows: { label: string; value: string }[] = [
    { label: "Receipt no.", value: receiptNo },
    ...(request.paid_at ? [{ label: "Paid on", value: formatDateTime(request.paid_at) }] : []),
    { label: "For", value: request.description },
    ...(request.paid_method
      ? [{ label: "Paid by", value: PAID_METHOD_LABELS[request.paid_method] }]
      : []),
    { label: "Reference", value: request.cashsend_reference ?? request.short_code },
  ];

  return (
    <PublicShell footer={false}>
      <article
        aria-label={`Receipt ${receiptNo}`}
        className="overflow-hidden rounded-4xl bg-white print:hidden"
      >
        <header className="flex items-center gap-3.5 px-5 pt-6 pb-5">
          <Avatar name={provider.full_name} size="lg" verified={provider.verified_at !== null} />
          <div className="min-w-0">
            <p className="truncate font-heading text-[24px] text-ink">{provider.full_name}</p>
            <p className="text-sm font-medium text-muted">
              {provider.trade}
              {provider.verified_at !== null && " · Verified by PayLink"}
            </p>
          </div>
        </header>

        <div className="flex flex-col items-center gap-2 bg-paid-soft px-5 py-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-bold text-paid">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Paid
          </span>
          <MoneyHero cents={request.amount_cents} size={52} className="text-ink" />
          <p className="sr-only">{formatRand(request.amount_cents)}</p>
        </div>

        {/* Torn-paper edge between the amount and the details. */}
        <div
          aria-hidden="true"
          className="h-3 bg-[radial-gradient(circle_at_8px_0,var(--color-paid-soft)_6px,transparent_6.5px)] bg-size-[16px_12px] bg-repeat-x"
        />

        <dl className="divide-y divide-line-soft px-5 pb-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-3">
              <dt className="shrink-0 text-[15px] text-muted">{row.label}</dt>
              <dd className="text-right text-[15px] font-semibold text-ink tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="px-5 pt-2 pb-6 text-sm leading-normal text-muted">
          Paid directly to {provider.full_name}. PayLink never holds your money. Questions about
          this payment? Contact {firstName}.
        </p>
      </article>

      <div className="flex flex-col gap-2 print:hidden">
        <PrintButton />
        <a
          href={`/receipt/${request.short_code}/image?download=1`}
          download={`receipt-${receiptNo}.png`}
          className={buttonClasses({ variant: "ghost", size: "lg", fullWidth: true })}
        >
          Save as a picture
        </a>
        <p className="text-center text-sm text-muted">
          This page stays here as your receipt. Bookmark it or keep the WhatsApp message.
        </p>
      </div>

      {/* What "Save as PDF" and printing produce: a one-page A4 document. */}
      <ReceiptDocument provider={provider} request={request} />
    </PublicShell>
  );
}
