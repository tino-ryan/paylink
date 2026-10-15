// src/app/dashboard/requests/[code]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { effectiveStatus, formatRand } from "@/lib/utils";
import { SharePanel } from "@/components/dashboard/SharePanel";
import { MarkPaidButton } from "@/components/dashboard/MarkPaidButton";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
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
  | "paid_at"
  | "customer_reported_paid_at"
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

  // RLS only returns rows owned by this user, so another provider's code
  // simply comes back empty → 404.
  const { data, error } = await supabase
    .from("payment_requests")
    .select(
      "description, amount_cents, status, short_code, expires_at, paid_at, customer_reported_paid_at",
    )
    .eq("short_code", code.toUpperCase())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) notFound();

  const request = data as RequestDetail;
  const status = effectiveStatus(request);
  const customerReported =
    status !== "paid" && request.customer_reported_paid_at !== null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not set in .env.local");
  }
  const payUrl = `${appUrl}/pay/${request.short_code}`;

  return (
    <main className="bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm py-2">
            ← Back
          </Link>
          <h1 className="font-semibold text-gray-900">Payment request</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-lg">{request.description}</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatRand(request.amount_cents)}
              </p>
            </div>
            <StatusBadge status={status} customerReported={customerReported} />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {status === "paid" && request.paid_at
              ? `Paid ${formatDateTime(request.paid_at)}`
              : status === "expired"
                ? `Expired ${formatDateTime(request.expires_at)}`
                : `Link expires ${formatDateTime(request.expires_at)}`}
          </p>
        </div>

        {customerReported && request.customer_reported_paid_at && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-sm text-sky-900">
            Your customer says they sent the money on{" "}
            {formatDateTime(request.customer_reported_paid_at)}. Check your bank
            or CashSend SMS, then mark it as paid below.
          </div>
        )}

        {status === "pending" && (
          <SharePanel
            payUrl={payUrl}
            description={request.description}
            amountCents={request.amount_cents}
          />
        )}

        {status !== "paid" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Got the money via CashSend, EFT or cash?
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Mark it as paid once you&apos;ve seen the money arrive.
            </p>
            <MarkPaidButton code={request.short_code} />
          </div>
        )}
      </div>
    </main>
  );
}
