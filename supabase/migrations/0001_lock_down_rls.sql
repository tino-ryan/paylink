-- supabase/migrations/0001_lock_down_rls.sql
--
-- Run once in Supabase Dashboard → SQL Editor (or `supabase db push`).
-- Safe to re-run.
--
-- What this does:
--   1. Adds the columns the app now relies on (paid_at, customer_reported_paid_at, created_by).
--   2. Changes new links to expire after 7 days instead of 24 hours.
--   3. Removes EVERY existing policy on the three tables and replaces them with
--      owner-only policies. Anonymous visitors (customers) get NO direct table
--      access. The public pages read and write through server code that uses
--      the service-role key and returns only the fields a customer needs.

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------

alter table public.payment_requests
  add column if not exists paid_at timestamptz,
  add column if not exists customer_reported_paid_at timestamptz,
  add column if not exists created_by text not null default 'provider';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payment_requests_created_by_check'
  ) then
    alter table public.payment_requests
      add constraint payment_requests_created_by_check
      check (created_by in ('provider', 'customer'));
  end if;
end $$;

-- Back-fill paid_at for requests already marked paid, so "Paid this month" isn't empty.
update public.payment_requests
set paid_at = created_at
where status = 'paid' and paid_at is null;

-- ---------------------------------------------------------------------------
-- 2. Expiry: 7 days. Informal customers often pay a few days later.
-- ---------------------------------------------------------------------------

alter table public.payment_requests
  alter column expires_at set default (now() + interval '7 days');

-- ---------------------------------------------------------------------------
-- 3. Indexes the dashboard queries use
-- ---------------------------------------------------------------------------

create index if not exists payment_requests_provider_created_idx
  on public.payment_requests (provider_id, created_at desc);

create index if not exists payment_requests_provider_paid_idx
  on public.payment_requests (provider_id, paid_at)
  where status = 'paid';

create index if not exists providers_user_id_idx
  on public.providers (user_id);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security: owner-only
-- ---------------------------------------------------------------------------

alter table public.providers        enable row level security;
alter table public.payment_requests enable row level security;
alter table public.transactions     enable row level security;

-- Drop whatever policies exist today (names unknown), so no permissive
-- anonymous policy survives.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('providers', 'payment_requests', 'transactions')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- providers: a signed-in user sees and edits only their own row.
create policy providers_select_own on public.providers
  for select to authenticated
  using (user_id = auth.uid());

create policy providers_insert_own on public.providers
  for insert to authenticated
  with check (user_id = auth.uid());

create policy providers_update_own on public.providers
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- payment_requests: only the owning provider.
create policy payment_requests_select_own on public.payment_requests
  for select to authenticated
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

create policy payment_requests_insert_own on public.payment_requests
  for insert to authenticated
  with check (
    provider_id in (select id from public.providers where user_id = auth.uid())
    and created_by = 'provider'
  );

create policy payment_requests_update_own on public.payment_requests
  for update to authenticated
  using (provider_id in (select id from public.providers where user_id = auth.uid()))
  with check (provider_id in (select id from public.providers where user_id = auth.uid()));

-- transactions: read-only for the owner. Writes come from webhooks (service role).
create policy transactions_select_own on public.transactions
  for select to authenticated
  using (
    payment_request_id in (
      select pr.id
      from public.payment_requests pr
      join public.providers p on p.id = pr.provider_id
      where p.user_id = auth.uid()
    )
  );

-- No policies for the `anon` role on purpose. The service role bypasses RLS,
-- and only server code (src/lib/public-data.ts, server actions) uses it.
