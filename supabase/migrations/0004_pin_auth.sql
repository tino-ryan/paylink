-- supabase/migrations/0004_pin_auth.sql
--
-- Phone number + PIN sign-in, without SMS.
-- Run after 0003. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Wrong-PIN lockout. Only server code (service role) reads or writes it.
-- ---------------------------------------------------------------------------

create table if not exists public.pin_attempts (
  phone text primary key,                 -- "0712345678"
  failed_count integer not null default 0,
  last_failed_at timestamptz,
  locked_until timestamptz
);

alter table public.pin_attempts enable row level security;
-- No policies on purpose: browsers can't see or reset lockouts.

-- ---------------------------------------------------------------------------
-- 2. Provider columns for trust and safety
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists verified_at timestamptz,        -- set by you after a manual check
  add column if not exists payout_changed_at timestamptz;  -- shown as a warning on the dashboard

-- ---------------------------------------------------------------------------
-- 3. Guard: what a signed-in browser may change on its own provider row
-- ---------------------------------------------------------------------------
-- The owner-update RLS policy lets a browser update its row directly. This
-- trigger narrows that:
--   * verified_at and payout_changed_at: only the server can set them
--   * payment details (bank, CashSend): only the server, after a PIN check
--   * slug and user_id: never change after setup
-- Server code uses the service role and passes straight through.

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
    return new;
  end if;

  new.verified_at := old.verified_at;
  new.payout_changed_at := old.payout_changed_at;

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

drop trigger if exists guard_provider_columns on public.providers;
create trigger guard_provider_columns
  before insert or update on public.providers
  for each row execute function public.guard_provider_columns();

-- ---------------------------------------------------------------------------
-- How to verify a provider by hand (after checking them on WhatsApp/SMS):
--   update public.providers set verified_at = now() where slug = 'sipho-plumbing';
-- How to unlock someone locked out by wrong PINs:
--   delete from public.pin_attempts where phone = '0712345678';
-- ---------------------------------------------------------------------------
