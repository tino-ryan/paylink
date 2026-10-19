// src/app/admin/page.tsx
// Overview: is PayLink being used, and does anything need my attention?
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRand, startOfMonthSAST } from "@/lib/utils";
import { formatSAPhone } from "@/lib/validation";
import { Card, CardTitle, PageHeader } from "@/components/ui/Surface";
import { UnlockButton } from "./_components/unlock-button";

const DAY_MS = 24 * 60 * 60 * 1000;

const formatWhen = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });

const ACTION_LABELS: Record<string, string> = {
  verify: "Verified",
  unverify: "Removed verification",
  suspend: "Suspended",
  unsuspend: "Lifted suspension",
  unlock: "Unlocked PIN",
  reset_pin: "Reset PIN",
};

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-1 font-heading text-[28px] text-ink tabular-nums">{value}</p>
      {note && <p className="mt-0.5 text-sm text-muted">{note}</p>}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const db = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const nowIso = new Date().toISOString();

  const [
    providers,
    newProviders,
    verified,
    suspended,
    requests,
    recentRequests,
    paidRows,
    locked,
    signups,
    log,
  ] = await Promise.all([
    db.from("providers").select("id", { count: "exact", head: true }),
    db.from("providers").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    db.from("providers").select("id", { count: "exact", head: true }).not("verified_at", "is", null),
    db.from("providers").select("id", { count: "exact", head: true }).not("suspended_at", "is", null),
    db.from("payment_requests").select("id", { count: "exact", head: true }),
    db.from("payment_requests").select("provider_id").gte("created_at", weekAgo),
    db.from("payment_requests").select("amount_cents, paid_at").eq("status", "paid"),
    db.from("pin_attempts").select("phone, locked_until").gt("locked_until", nowIso),
    db
      .from("providers")
      .select("id, full_name, trade, phone, created_at, verified_at")
      .order("created_at", { ascending: false })
      .limit(8),
    db
      .from("admin_actions")
      .select("id, admin_phone, action, created_at, provider_id, providers ( full_name )")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const firstError = [providers, newProviders, verified, suspended, requests, recentRequests, paidRows, locked, signups, log]
    .map((r) => r.error)
    .find(Boolean);
  if (firstError) throw new Error(firstError.message);

  const paid = (paidRows.data ?? []) as { amount_cents: number; paid_at: string | null }[];
  const monthStart = startOfMonthSAST();
  const paidAllTime = paid.reduce((sum, r) => sum + r.amount_cents, 0);
  const paidThisMonth = paid
    .filter((r) => r.paid_at !== null && r.paid_at >= monthStart)
    .reduce((sum, r) => sum + r.amount_cents, 0);
  const activeThisWeek = new Set(
    ((recentRequests.data ?? []) as { provider_id: string }[]).map((r) => r.provider_id),
  ).size;
  const totalRequests = requests.count ?? 0;
  const paidRate = totalRequests > 0 ? Math.round((paid.length / totalRequests) * 100) : 0;

  const lockedRows = (locked.data ?? []) as { phone: string; locked_until: string }[];
  const signupRows = (signups.data ?? []) as {
    id: string;
    full_name: string;
    trade: string;
    phone: string | null;
    created_at: string;
    verified_at: string | null;
  }[];
  const logRows = (log.data ?? []) as unknown as {
    id: string;
    admin_phone: string;
    action: string;
    created_at: string;
    provider_id: string | null;
    providers: { full_name: string } | null;
  }[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" />

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Providers"
          value={String(providers.count ?? 0)}
          note={`${newProviders.count ?? 0} new this week`}
        />
        <Stat
          label="Active this week"
          value={String(activeThisWeek)}
          note="Sent at least one request"
        />
        <Stat
          label="Paid this month"
          value={formatRand(paidThisMonth)}
          note={`${formatRand(paidAllTime)} all time`}
        />
        <Stat
          label="Requests paid"
          value={`${paidRate}%`}
          note={`${paid.length} of ${totalRequests}`}
        />
        <Stat label="Verified" value={String(verified.count ?? 0)} />
        <Stat label="Suspended" value={String(suspended.count ?? 0)} />
      </section>

      {lockedRows.length > 0 && (
        <Card>
          <CardTitle description="Locked after 5 wrong PINs. They unlock by themselves after 15 minutes.">
            Locked out now
          </CardTitle>
          <ul className="divide-y divide-line-soft">
            {lockedRows.map((row) => (
              <li key={row.phone} className="flex items-center justify-between gap-3 py-2.5">
                <span className="text-[15px] font-semibold text-ink tabular-nums">
                  {formatSAPhone(row.phone)}
                  <span className="ml-2 text-sm font-normal text-muted">
                    until {formatWhen(row.locked_until)}
                  </span>
                </span>
                <UnlockButton phone={row.phone} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Newest providers</CardTitle>
        {signupRows.length === 0 ? (
          <p className="text-[15px] text-muted">No sign-ups yet.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {signupRows.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/providers/${p.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:bg-cream"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-ink">
                      {p.full_name}
                      {p.verified_at && <span className="ml-1.5 text-sm text-paid">✓ verified</span>}
                    </span>
                    <span className="block text-sm text-muted">
                      {p.trade}
                      {p.phone && `, ${formatSAPhone(p.phone)}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">{formatWhen(p.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/providers" className="mt-3 inline-block text-[15px] font-semibold text-jade-600">
          All providers
        </Link>
      </Card>

      <Card>
        <CardTitle>Admin activity</CardTitle>
        {logRows.length === 0 ? (
          <p className="text-[15px] text-muted">Nothing yet.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {logRows.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-3 py-2.5 text-[15px]">
                <span className="min-w-0 text-ink">
                  <span className="font-semibold">{ACTION_LABELS[row.action] ?? row.action}</span>
                  {row.providers?.full_name && <> · {row.providers.full_name}</>}
                  <span className="block text-sm text-muted">by {formatSAPhone(row.admin_phone)}</span>
                </span>
                <span className="shrink-0 text-sm text-muted">{formatWhen(row.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
