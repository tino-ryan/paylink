// src/app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startOfMonthSAST } from "@/lib/utils";
import { LinkButton } from "@/components/ui/Button";
import { Card, Money, MoneyHero, Notice, SectionTitle } from "@/components/ui/Surface";
import { JobList, type JobListItem } from "@/components/dashboard/JobRow";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PushToggle } from "@/components/pwa/PushToggle";

const JOB_COLUMNS =
  "id, description, amount_cents, status, short_code, expires_at, created_at, customer_reported_paid_at";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: providerRow, error: providerError } = await supabase
    .from("providers")
    .select("id, full_name, payout_changed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (providerError) throw new Error(providerError.message);
  if (!providerRow) redirect("/onboarding");
  const {
    id: providerId,
    full_name: providerName,
    payout_changed_at: payoutChangedAt,
  } = providerRow as {
    id: string;
    full_name: string;
    payout_changed_at: string | null;
  };

  // Warn for a week after payment details change, in case it wasn't them.
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const recentPayoutChange =
    payoutChangedAt !== null && Date.now() - new Date(payoutChangedAt).getTime() < WEEK_MS;
  const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  const firstName = providerName.split(/\s+/)[0] ?? "";

  const nowIso = new Date().toISOString();

  // Independent queries, run in parallel.
  const [recentResult, reportedResult, paidResult, owedResult] = await Promise.all([
    supabase
      .from("payment_requests")
      .select(JOB_COLUMNS)
      .eq("provider_id", providerId)
      .order("created_at", { ascending: false })
      .limit(20),
    // Customer says they've paid, provider hasn't confirmed: needs action.
    supabase
      .from("payment_requests")
      .select(JOB_COLUMNS)
      .eq("provider_id", providerId)
      .in("status", ["pending", "expired"])
      .not("customer_reported_paid_at", "is", null)
      .order("customer_reported_paid_at", { ascending: false })
      .limit(10),
    // Confirmed paid since the 1st, South African time.
    supabase
      .from("payment_requests")
      .select("amount_cents")
      .eq("provider_id", providerId)
      .eq("status", "paid")
      .gte("paid_at", startOfMonthSAST()),
    // Still owed: pending and not yet expired.
    supabase
      .from("payment_requests")
      .select("amount_cents")
      .eq("provider_id", providerId)
      .eq("status", "pending")
      .gt("expires_at", nowIso),
  ]);

  for (const result of [recentResult, reportedResult, paidResult, owedResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const reported = (reportedResult.data ?? []) as JobListItem[];
  const reportedIds = new Set(reported.map((job) => job.id));
  const recent = ((recentResult.data ?? []) as JobListItem[]).filter(
    (job) => !reportedIds.has(job.id),
  );
  const sum = (rows: unknown[] | null) =>
    ((rows ?? []) as { amount_cents: number }[]).reduce((total, r) => total + r.amount_cents, 0);
  const paidThisMonthCents = sum(paidResult.data);
  const owedCents = sum(owedResult.data);
  const owedCount = (owedResult.data ?? []).length;
  const hasAnyJobs = reported.length > 0 || recent.length > 0;

  const monthName = new Date().toLocaleDateString("en-ZA", {
    month: "long",
    timeZone: "Africa/Johannesburg",
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-[30px] text-ink">Sawubona, {firstName}</h1>

      {recentPayoutChange && payoutChangedAt && (
        <Notice tone="warning">
          Your payment details were changed on{" "}
          {new Date(payoutChangedAt).toLocaleString("en-ZA", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Africa/Johannesburg",
          })}
          . Not you?{" "}
          {supportNumber ? (
            <a
              href={`https://wa.me/${supportNumber}?text=${encodeURIComponent("Hi PayLink, my payment details were changed and it wasn't me.")}`}
              className="underline underline-offset-2"
            >
              WhatsApp us now
            </a>
          ) : (
            "Change your PIN in Settings now."
          )}
        </Notice>
      )}

      <section
        aria-label={`Paid in ${monthName}`}
        className="relative flex flex-col gap-4 overflow-hidden rounded-[26px] bg-jade p-5 text-white"
      >
        <div aria-hidden="true" className="brand-pattern absolute -top-4 -right-4 h-[150px] w-[180px]" />
        <div className="relative flex flex-col gap-1">
          <p className="text-sm font-semibold text-mint">Paid in {monthName}</p>
          <MoneyHero cents={paidThisMonthCents} size={44} centsClassName="text-mint" />
        </div>
        <div className="relative flex items-center justify-between gap-2.5 rounded-2xl bg-white/10 px-3.5 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${owedCount > 0 ? "bg-waiting-dot" : "bg-mint/50"}`}
            />
            {owedCount > 0
              ? `Waiting · ${owedCount} ${owedCount === 1 ? "job" : "jobs"}`
              : "Nothing waiting"}
          </span>
          <Money cents={owedCents} size="sm" className="text-white" />
        </div>
      </section>

      <div className="grid gap-2">
        <LinkButton href="/dashboard/charge" variant="accent" size="lg" fullWidth>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM20 20h.01" />
          </svg>
          Charge a customer here
        </LinkButton>
        <LinkButton href="/dashboard/new" variant="secondary" size="lg" fullWidth>
          Send a payment link
        </LinkButton>
      </div>

      <InstallPrompt />
      <PushToggle hideWhenDone />

      {reported.length > 0 && (
        <section aria-labelledby="check-heading" className="flex flex-col gap-2.5 pt-1">
          <SectionTitle id="check-heading">Check your bank</SectionTitle>
          <p className="text-[15px] leading-normal text-muted">
            These customers say they&apos;ve paid. Confirm once you see the money.
          </p>
          <JobList jobs={reported} />
        </section>
      )}

      <section aria-labelledby="recent-heading" className="flex flex-col gap-2.5 pt-1">
        <SectionTitle id="recent-heading">Your jobs</SectionTitle>
        {hasAnyJobs ? (
          recent.length > 0 ? (
            <JobList jobs={recent} />
          ) : (
            <p className="text-[15px] text-muted">Nothing else yet.</p>
          )
        ) : (
          <Card className="flex flex-col items-center gap-2 py-8 text-center">
            <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
              <path d="M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9" fill="none" stroke="var(--color-mint)" strokeWidth="8.5" strokeLinecap="round" />
              <circle cx="32" cy="32" r="7" fill="var(--color-apricot)" />
            </svg>
            <p className="font-display text-lg font-bold text-ink">No jobs yet</p>
            <p className="max-w-xs text-[15px] leading-normal text-muted">
              Create a payment request after your next job and send it by WhatsApp.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
