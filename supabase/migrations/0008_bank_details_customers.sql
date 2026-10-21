-- 0008_bank_details_customers.sql
--
-- 1. Full bank details: account holder name and branch code.
-- 2. CashSend no longer asks which bank the provider uses (any cellphone can
--    receive CashSend; the customer's bank sends it).
-- 3. Optional customer name and WhatsApp number on a job, saved by the
--    provider when sending a link or a receipt. Only that provider can see
--    them (existing owner-only RLS on payment_requests).
--
-- Run after 0007. Safe to run more than once.

-- ---------------------------------------------------------------------------
-- 1. Bank details
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists account_holder text,
  add column if not exists branch_code text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'providers_branch_code_format') then
    alter table public.providers
      add constraint providers_branch_code_format
      check (branch_code is null or branch_code ~ '^[0-9]{6}$');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'providers_account_holder_length') then
    alter table public.providers
      add constraint providers_account_holder_length
      check (account_holder is null or char_length(account_holder) between 2 and 80);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. CashSend bank is optional now
-- ---------------------------------------------------------------------------

alter table public.providers alter column cashsend_bank drop not null;

-- ---------------------------------------------------------------------------
-- 3. Customer on a job
-- ---------------------------------------------------------------------------

alter table public.payment_requests
  add column if not exists customer_name text,
  add column if not exists customer_phone text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payment_requests_customer_name_length') then
    alter table public.payment_requests
      add constraint payment_requests_customer_name_length
      check (customer_name is null or char_length(customer_name) between 1 and 80);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payment_requests_customer_phone_format') then
    alter table public.payment_requests
      add constraint payment_requests_customer_phone_format
      check (customer_phone is null or customer_phone ~ '^0[6-8][0-9]{8}$');
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. The new bank columns get the same protection as the rest of the payout
--    details: only changeable through Settings with the PIN (server side).
--    Same as 0006, plus account_holder and branch_code.
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
      new.account_holder, new.branch_code, new.cashsend_phone, new.cashsend_bank)
     is distinct from
     (old.payout_method, old.bank_name, old.account_number, old.account_type,
      old.account_holder, old.branch_code, old.cashsend_phone, old.cashsend_bank) then
    raise exception 'Payment details can only be changed with your PIN' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
