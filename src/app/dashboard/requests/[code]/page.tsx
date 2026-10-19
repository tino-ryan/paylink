// src/app/dashboard/requests/[code]/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { effectiveStatus, formatRand, formatReceiptNumber, PAID_METHOD_LABELS } from "@/lib/utils";
import { ReceiptSender } from "@/components/dashboard/ReceiptSender";
import { receiptUrl } from "@/lib/receipt";
import { SharePanel } from "@/components/dashboard/SharePanel";
import { MarkPaidButton } from "@/components/dashboard/MarkPaidButton";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { BackLink, Card, CardTitle, MoneyHero, Notice } from "@/components/ui/Surface";
import type { PaymentRequest } from "@/lib/types";

interface Props {
  params: Promise<{ code: string }>;
}

type RequestDetail = Pick<
  PaymentRequest,
  | "description"
  | "amount_cents"
  | "status"
  | "short_code"
  | "expires_at"
  | "created_at"
  | "paid_at"
  | "customer_reported_paid_at"
  | "created_by"
  | "receipt_number"
  | "paid_method"
>;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

export default async function RequestPage({ params }: Props) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS only returns this user's rows, so another provider's code → 404.
  const { data, error } = await supabase
    .from("payment_requests")
    .select(
      "description, amount_cents, status, short_code, expires_at, created_at, paid_at, customer_reported_paid_at, created_by, receipt_number, paid_method",
    )
    .eq("short_code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) notFound();

  const { data: providerData, error: providerError } = await supabase
    .from("providers")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (providerError) throw new Error(providerError.message);
  const providerName = (providerData as { full_name: string } | null)?.full_name ?? "";

  const request = data as RequestDetail;
  const status = effectiveStatus(request);
  const customerReported = status !== "paid" && request.customer_reported_paid_at !== null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set in .env.local");
  const payUrl = `${appUrl}/pay/${request.short_code}`;

  const timeline: { label: string; at: string }[] = [
    {
      label: request.created_by === "customer" ? "Started by customer" : "Created",
      at: request.created_at,
    },
    ...(request.customer_reported_paid_at
      ? [{ label: "Customer said they paid", at: request.customer_reported_paid_at }]
      : []),
    ...(request.paid_at
      ? [
          {
            label: request.paid_method
              ? `Paid by ${PAID_METHOD_LABELS[request.paid_method].toLowerCase()}`
              : "You marked it paid",
            at: request.paid_at,
          },
        ]
      : []),
    ...(status === "expired" ? [{ label: "Link expired", at: request.expires_at }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <BackLink href="/dashboard" label="Your jobs" />
        <StatusBadge status={status} customerReported={customerReported} long />
      </div>

      <header className="flex flex-col gap-1.5">
        <h1 className="font-heading text-[30px] text-ink">
          {status === "pending" && !customerReported ? "Your link is ready" : request.description}
        </h1>
        <p className="text-base text-muted">
          {status === "pending" && !customerReported && <>{request.description} · </>}
          Ref <span className="font-semibold text-ink">{request.short_code}</span>
          {status === "pending" && <>, works until {formatDateTime(request.expires_at)}</>}
        </p>
        <MoneyHero cents={request.amount_cents} size={52} className="mt-1 text-ink" centsClassName="text-muted" />
      </header>

      {customerReported && request.customer_reported_paid_at && (
        <Notice tone="info">
          Your customer says they sent the money on{" "}
          {formatDateTime(request.customer_reported_paid_at)}. Check your bank or CashSend SMS
          before you mark it paid.
        </Notice>
      )}

      {status === "pending" && (
        <SharePanel
          payUrl={payUrl}
          description={request.description}
          amountCents={request.amount_cents}
        />
      )}

      {status === "paid" && (
        <Card>
          <CardTitle
            description={`Type your customer's number and WhatsApp opens on their chat with the receipt${
              request.receipt_number ? ` (${formatReceiptNumber(request.receipt_number)})` : ""
            } ready to send.`}
          >
            Send their receipt
          </CardTitle>
          <ReceiptSender
            url={receiptUrl(appUrl, request.short_code)}
            info={{
              code: request.short_code,
              receiptNumber: request.receipt_number,
              description: request.description,
              amountCents: request.amount_cents,
              paidAt: request.paid_at,
              paidMethod: request.paid_method,
              providerName,
            }}
          />
        </Card>
      )}

      {status !== "paid" && (
        <Card>
          <CardTitle description="Got it by EFT, CashSend or cash? Confirm it here.">
            Payment received?
          </CardTitle>
          <MarkPaidButton code={request.short_code} amountLabel={formatRand(request.amount_cents)} />
        </Card>
      )}

      {status === "expired" && !customerReported && (
        <Notice tone="warning">
          This link has expired, so your customer can&apos;t pay with it any more. Create a new
          request if they still owe you.
        </Notice>
      )}

      <Card>
        <CardTitle>History</CardTitle>
        <ol className="flex flex-col">
          {timeline.map((event, i) => {
            const last = i === timeline.length - 1;
            return (
              <li key={event.label} className="flex gap-3">
                <div className="flex shrink-0 flex-col items-center pt-1.5">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 rounded-full ${last ? "bg-apricot" : "bg-jade"}`}
                  />
                  {!last && <span aria-hidden="true" className="w-0.5 flex-1 bg-mint" />}
                </div>
                <div className={`flex flex-1 items-baseline justify-between gap-3 text-[15px] ${last ? "" : "pb-4"}`}>
                  <span className="font-semibold text-ink">{event.label}</span>
                  <span className="shrink-0 text-sm text-muted tabular-nums">{formatDateTime(event.at)}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
