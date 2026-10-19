-- supabase/migrations/0006_admin.sql
--
-- Admin tools: suspend providers, and a log of every admin action.
-- Run after 0005. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Suspension. A suspended provider can't sign in, and their payment links
--    and profile page stop working (customers see "link not found").
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists suspended_at timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Admin action log. Server-only: no policies, so browsers can't read it.
-- ---------------------------------------------------------------------------

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_phone text not null,
  action text not null,           -- verify, unverify, suspend, unsuspend, unlock, reset_pin
  provider_id uuid references public.providers(id) on delete set null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_created_idx on public.admin_actions (created_at desc);
alter table public.admin_actions enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Providers can't lift their own suspension. Same guard as 0004, plus
--    suspended_at.
-- ---------------------------------------------------------------------------

create or replace function public.guard_provider_columns()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'authenticated' then
    return new; -- service role, SQL editor, migrations
  end if;

  if tg_op = 'INSERT' then
    new.verified_at := null;
    new.payout_changed_at := null;
    new.suspended_at := null;
    return new;
  end if;

  new.verified_at := old.verified_at;
  new.payout_changed_at := old.payout_changed_at;
  new.suspended_at := old.suspended_at;

  if new.slug is distinct from old.slug or new.user_id is distinct from old.user_id then
    raise exception 'Your PayLink address can''t be changed' using errcode = 'P0001';
  end if;

  if (new.payout_method, new.bank_name, new.account_number, new.account_type,
      new.cashsend_phone, new.cashsend_bank)
     is distinct from
     (old.payout_method, old.bank_name, old.account_number, old.account_type,
      old.cashsend_phone, old.cashsend_bank) then
    raise exception 'Payment details can only be changed with your PIN' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
