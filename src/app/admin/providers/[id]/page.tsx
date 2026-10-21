// src/app/admin/providers/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";
import { authEmailToPhone } from "@/lib/auth/pin";
import { effectiveStatus, formatRand, PAID_METHOD_LABELS } from "@/lib/utils";
import { formatSAPhone } from "@/lib/validation";
import type { PaymentRequest, Provider } from "@/lib/types";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Avatar, BackLink, Card, CardTitle, Notice } from "@/components/ui/Surface";
import { ProviderActions } from "../../_components/provider-actions";

interface Props {
  params: Promise<{ id: string }>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

/** "1234567890" → "•••• 7890" (enough to match with the provider, not to copy). */
const maskAccount = (n: string | null) => (n ? `•••• ${n.slice(-4)}` : null);

type Job = Pick<
  PaymentRequest,
  | "short_code"
  | "description"
  | "amount_cents"
  | "status"
  | "expires_at"
  | "created_at"
  | "customer_reported_paid_at"
  | "paid_method"
  | "cancelled_at"
>;

export default async function AdminProviderPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const db = createAdminClient();
  const { data, error } = await db.from("providers").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) notFound();
  const provider = data as Provider;

  const [{ data: userData }, { data: jobsData, error: jobsError }] = await Promise.all([
    db.auth.admin.getUserById(provider.user_id),
    db
      .from("payment_requests")
      .select("short_code, description, amount_cents, status, expires_at, created_at, customer_reported_paid_at, paid_method, cancelled_at")
      .eq("provider_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (jobsError) throw new Error(jobsError.message);

  const signInPhone = authEmailToPhone(userData?.user?.email);
  const lastSignIn = userData?.user?.last_sign_in_at ?? null;
  const jobs = (jobsData ?? []) as Job[];
  const paidCents = jobs.filter((j) => j.status === "paid").reduce((s, j) => s + j.amount_cents, 0);

  const { data: attempt } = signInPhone
    ? await db.from("pin_attempts").select("locked_until").eq("phone", signInPhone).maybeSingle()
    : { data: null };
  const lockedUntil = (attempt as { locked_until: string | null } | null)?.locked_until ?? null;
  const locked = lockedUntil !== null && new Date(lockedUntil).getTime() > Date.now();

  const appUrl = siteUrl();

  const details: { label: string; value: string | null }[] = [
    { label: "Sign-in number", value: signInPhone ? formatSAPhone(signInPhone) : "Email account (old)" },
    { label: "Profile link", value: `${appUrl.replace(/^https?:\/\//, "")}/${provider.slug}` },
    { label: "Joined", value: formatWhen(provider.created_at) },
    { label: "Last sign-in", value: lastSignIn ? formatWhen(lastSignIn) : "Never" },
    { label: "Bank", value: provider.bank_name ? `${provider.bank_name}, ${maskAccount(provider.account_number)}` : null },
    {
      label: "CashSend",
      value: provider.cashsend_phone
        ? `${formatSAPhone(provider.cashsend_phone)} (${provider.cashsend_bank ?? "bank not set"})`
        : null,
    },
    {
      label: "Payment details changed",
      value: provider.payout_changed_at ? formatWhen(provider.payout_changed_at) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <BackLink href="/admin/providers" label="Providers" />

      <header className="flex items-center gap-4">
        <Avatar name={provider.full_name} size="lg" verified={provider.verified_at !== null} />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-[30px] text-ink">{provider.full_name}</h1>
          <p className="text-base text-muted">
            {provider.trade}, {formatRand(paidCents)} paid across {jobs.length} recent{" "}
            {jobs.length === 1 ? "job" : "jobs"}
          </p>
        </div>
      </header>

      {provider.suspended_at && (
        <Notice tone="error">
          Suspended on {formatWhen(provider.suspended_at)}. They can&apos;t sign in and their links
          don&apos;t work.
        </Notice>
      )}
      {locked && lockedUntil && (
        <Notice tone="warning">Locked out after wrong PINs until {formatWhen(lockedUntil)}.</Notice>
      )}

      <ProviderActions
        providerId={provider.id}
        providerName={provider.full_name}
        verified={provider.verified_at !== null}
        suspended={provider.suspended_at !== null}
        signInPhone={signInPhone}
        locked={locked}
      />

      <Card>
        <CardTitle>Details</CardTitle>
        <dl className="divide-y divide-line-soft">
          {details
            .filter((d) => d.value !== null)
            .map((d) => (
              <div key={d.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="shrink-0 text-[15px] text-muted">{d.label}</dt>
                <dd className="text-right text-[15px] font-semibold text-ink">{d.value}</dd>
              </div>
            ))}
        </dl>
      </Card>

      <Card>
        <CardTitle description="Latest 50. Customer links open in a new tab.">Jobs</CardTitle>
        {jobs.length === 0 ? (
          <p className="text-[15px] text-muted">No jobs yet.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {jobs.map((job) => {
              const status = effectiveStatus(job);
              return (
                <li key={job.short_code} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <Link
                      href={`/pay/${job.short_code}`}
                      target="_blank"
                      className="block truncate text-[15px] font-semibold text-ink underline-offset-2 hover:underline"
                    >
                      {job.description}
                    </Link>
                    <span className="block text-sm text-muted">
                      {formatWhen(job.created_at)}, ref {job.short_code}
                      {job.paid_method && `, ${PAID_METHOD_LABELS[job.paid_method].toLowerCase()}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[15px] font-semibold text-ink tabular-nums">
                      {formatRand(job.amount_cents)}
                    </span>
                    <StatusBadge
                      status={status}
                      customerReported={status !== "paid" && job.customer_reported_paid_at !== null}
                      cancelled={status !== "paid" && job.cancelled_at !== null}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
