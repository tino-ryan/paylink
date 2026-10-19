// src/app/admin/providers/page.tsx
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRand } from "@/lib/utils";
import { formatSAPhone } from "@/lib/validation";
import { Avatar, PageHeader } from "@/components/ui/Surface";
import { buttonClasses } from "@/components/ui/Button";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

interface ProviderRow {
  id: string;
  full_name: string;
  trade: string;
  slug: string;
  phone: string | null;
  created_at: string;
  verified_at: string | null;
  suspended_at: string | null;
}

const LIMIT = 200;

export default async function AdminProvidersPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  // Keep only characters that are safe inside a PostgREST filter.
  const search = q.replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 60);
  const digits = search.replace(/\D/g, "");

  const db = createAdminClient();
  let query = db
    .from("providers")
    .select("id, full_name, trade, slug, phone, created_at, verified_at, suspended_at")
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  if (search) {
    const filters = [`full_name.ilike.%${search}%`, `slug.ilike.%${search}%`, `trade.ilike.%${search}%`];
    if (digits.length >= 3) filters.push(`phone.ilike.%${digits}%`);
    query = query.or(filters.join(","));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const providers = (data ?? []) as ProviderRow[];

  // Job counts and paid totals for the providers on this page.
  const totals = new Map<string, { jobs: number; paidCents: number }>();
  if (providers.length > 0) {
    const { data: jobs, error: jobsError } = await db
      .from("payment_requests")
      .select("provider_id, status, amount_cents")
      .in(
        "provider_id",
        providers.map((p) => p.id),
      );
    if (jobsError) throw new Error(jobsError.message);
    for (const job of (jobs ?? []) as { provider_id: string; status: string; amount_cents: number }[]) {
      const entry = totals.get(job.provider_id) ?? { jobs: 0, paidCents: 0 };
      entry.jobs += 1;
      if (job.status === "paid") entry.paidCents += job.amount_cents;
      totals.set(job.provider_id, entry);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Providers"
        description={search ? `${providers.length} matching “${search}”` : `${providers.length} newest first`}
      />

      <form className="flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Search providers
        </label>
        <input
          id="q"
          name="q"
          defaultValue={search}
          placeholder="Name, number, link or trade"
          className="min-h-12 min-w-0 flex-1 rounded-2xl border-2 border-line bg-white px-4 text-[16px] text-ink focus:border-jade focus:outline-none"
        />
        <button type="submit" className={buttonClasses({ variant: "primary" })}>
          Search
        </button>
      </form>

      {providers.length === 0 ? (
        <p className="rounded-[22px] bg-white p-5 text-[15px] text-muted">No providers found.</p>
      ) : (
        <ul className="divide-y divide-line-soft overflow-hidden rounded-[22px] bg-white">
          {providers.map((p) => {
            const t = totals.get(p.id) ?? { jobs: 0, paidCents: 0 };
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/providers/${p.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-cream focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-jade-600"
                >
                  <Avatar name={p.full_name} size="sm" verified={p.verified_at !== null} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-semibold text-ink">{p.full_name}</span>
                      {p.suspended_at && (
                        <span className="shrink-0 rounded-full bg-failed-soft px-2 py-0.5 text-xs font-bold text-failed">
                          Suspended
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {p.trade}
                      {p.phone && `, ${formatSAPhone(p.phone)}`}, /{p.slug}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[15px] font-semibold text-ink tabular-nums">
                      {formatRand(t.paidCents)}
                    </span>
                    <span className="block text-sm text-muted">
                      {t.jobs} {t.jobs === 1 ? "job" : "jobs"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {providers.length === LIMIT && (
        <p className="text-sm text-muted">Showing the first {LIMIT}. Search to narrow it down.</p>
      )}
    </div>
  );
}
