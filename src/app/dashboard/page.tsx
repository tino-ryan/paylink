// src/app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { effectiveStatus, formatRand, startOfMonthSAST } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import type { PaymentRequest } from "@/lib/types";

type RequestListItem = Pick<
  PaymentRequest,
  | "id"
  | "description"
  | "amount_cents"
  | "status"
  | "short_code"
  | "expires_at"
  | "created_at"
  | "customer_reported_paid_at"
>;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle<{ id: string }>();

  if (providerError) throw new Error(providerError.message);
  if (!provider) redirect("/onboarding");

  const nowIso = new Date().toISOString();

  // Three independent queries, run in parallel.
  const [recentResult, paidResult, waitingResult] = await Promise.all([
    supabase
      .from("payment_requests")
      .select(
        "id, description, amount_cents, status, short_code, expires_at, created_at, customer_reported_paid_at",
      )
      .eq("provider_id", provider.id)
      .order("created_at", { ascending: false })
      .limit(20),
    // Paid this month = confirmed paid since the 1st, South African time.
    supabase
      .from("payment_requests")
      .select("amount_cents")
      .eq("provider_id", provider.id)
      .eq("status", "paid")
      .gte("paid_at", startOfMonthSAST()),
    // Waiting = pending and not yet expired.
    supabase
      .from("payment_requests")
      .select("amount_cents")
      .eq("provider_id", provider.id)
      .eq("status", "pending")
      .gt("expires_at", nowIso),
  ]);

  if (recentResult.error) throw new Error(recentResult.error.message);
  if (paidResult.error) throw new Error(paidResult.error.message);
  if (waitingResult.error) throw new Error(waitingResult.error.message);

  const requests = (recentResult.data ?? []) as RequestListItem[];
  const paidRows = (paidResult.data ?? []) as { amount_cents: number }[];
  const paidThisMonthCents = paidRows.reduce(
    (sum, r) => sum + r.amount_cents,
    0,
  );
  const waiting = (waitingResult.data ?? []) as { amount_cents: number }[];
  const waitingCents = waiting.reduce((sum, r) => sum + r.amount_cents, 0);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <Link
        href="/dashboard/new"
        className="flex items-center justify-center w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl hover:bg-emerald-700 transition-colors text-base"
      >
        + New payment request
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Paid this month</p>
          <p className="text-xl font-bold text-emerald-600">
            {formatRand(paidThisMonthCents)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 mb-1">Still owed</p>
          <p className="text-xl font-bold text-gray-900">
            {formatRand(waitingCents)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {waiting.length} {waiting.length === 1 ? "job" : "jobs"}
          </p>
        </div>
      </div>

      <Link
        href="/dashboard/card"
        className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 hover:border-emerald-300 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-lg">
            🪪
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Your PayLink card</p>
            <p className="text-xs text-gray-400">Print or save — share with customers</p>
          </div>
        </div>
        <span className="text-gray-300 text-sm">→</span>
      </Link>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Your jobs
        </h2>

        {requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-400 text-sm">No payment requests yet.</p>
            <Link
              href="/dashboard/new"
              className="text-emerald-600 text-sm font-medium mt-2 inline-block"
            >
              Create your first one →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <Link
                key={req.id}
                href={`/dashboard/requests/${req.short_code}`}
                className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between hover:border-emerald-300 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {req.description}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(req.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      timeZone: "Africa/Johannesburg",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <span className="font-semibold text-gray-900">
                    {formatRand(req.amount_cents)}
                  </span>
                  <StatusBadge
                    status={effectiveStatus(req)}
                    customerReported={
                      req.status !== "paid" && req.customer_reported_paid_at !== null
                    }
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
