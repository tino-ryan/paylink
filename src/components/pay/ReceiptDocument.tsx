// src/components/pay/ReceiptDocument.tsx
// The printed / "Save as PDF" version of a receipt. Hidden on screen.
//
// Phones show a card; paper wants a document. So on A4 this is laid out like a
// normal business receipt: business name top-left, RECEIPT and number top-right,
// a details grid, one line item, a total, and a short footer. Everything sits
// at the top of the page and fits on one page.
import { LogoMark } from "@/components/brand/Logo";
import { formatRand, formatReceiptNumber, PAID_METHOD_LABELS } from "@/lib/utils";
import { siteUrl } from "@/lib/site";
import type { PublicPayoutDetails, PublicRequest } from "@/lib/types";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

export interface ReceiptDocumentProps {
  provider: PublicPayoutDetails;
  request: PublicRequest;
}

export function ReceiptDocument({ provider, request }: ReceiptDocumentProps) {
  const receiptNo = request.receipt_number
    ? formatReceiptNumber(request.receipt_number)
    : request.short_code;
  const verified = provider.verified_at !== null;
  const link = `${siteUrl().replace(/^https?:\/\//, "")}/receipt/${request.short_code}`;

  const details: { label: string; value: string }[] = [
    { label: "Receipt number", value: receiptNo },
    ...(request.customer_name ? [{ label: "Received from", value: request.customer_name }] : []),
    ...(request.paid_at
      ? [{ label: "Date paid", value: `${formatDate(request.paid_at)}, ${formatTime(request.paid_at)}` }]
      : []),
    { label: "Payment reference", value: request.cashsend_reference ?? request.short_code },
    ...(request.paid_method
      ? [{ label: "Payment method", value: PAID_METHOD_LABELS[request.paid_method] }]
      : []),
  ];

  return (
    <article
      aria-hidden="true"
      className="receipt-doc hidden text-[10.5pt] leading-[1.45] text-ink print:block"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-8 border-b-2 border-ink pb-5">
        <div className="min-w-0">
          <p className="font-heading text-[22pt] leading-tight">{provider.full_name}</p>
          <p className="mt-1 text-muted">
            {provider.trade}
            {verified && " · Verified by PayLink"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-heading text-[22pt] leading-tight tracking-[0.08em] text-jade">RECEIPT</p>
          <p className="mt-1 font-semibold tabular-nums">{receiptNo}</p>
        </div>
      </header>

      {/* Details grid + paid stamp */}
      <section className="flex items-start justify-between gap-8 py-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
          {details.map((d) => (
            <div key={d.label} className="contents">
              <dt className="text-muted">{d.label}</dt>
              <dd className="font-semibold tabular-nums">{d.value}</dd>
            </div>
          ))}
        </dl>
        <div className="shrink-0 -rotate-6 rounded-lg border-[2.5pt] border-paid px-4 py-1.5 text-center text-paid">
          <p className="font-heading text-[18pt] leading-none tracking-[0.12em]">PAID</p>
          {request.paid_at && (
            <p className="mt-1 text-[8pt] font-bold tracking-wide">{formatDate(request.paid_at).toUpperCase()}</p>
          )}
        </div>
      </section>

      {/* Line item */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-line text-left text-[9pt] tracking-[0.06em] text-muted uppercase">
            <th className="py-2 font-semibold">Description</th>
            <th className="w-[30%] py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-3 pr-6">{request.description}</td>
            <td className="py-3 text-right tabular-nums">{formatRand(request.amount_cents)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4 pr-6 text-right font-semibold">Total paid</td>
            <td className="pt-4 text-right font-heading text-[16pt] tabular-nums">
              {formatRand(request.amount_cents)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <footer className="mt-12 flex items-end justify-between gap-8 border-t border-line pt-4 text-[8.5pt] text-muted">
        <p className="max-w-[60%]">
          Paid directly to {provider.full_name}. PayLink is not a bank and never holds customers&apos;
          money. For questions about this payment, contact {provider.full_name.split(" ")[0]}.
        </p>
        <div className="flex shrink-0 items-center gap-2 text-right">
          <span>
            Verify online
            <br />
            <span className="font-semibold text-ink">{link}</span>
          </span>
          <LogoMark size={26} />
        </div>
      </footer>
    </article>
  );
}
