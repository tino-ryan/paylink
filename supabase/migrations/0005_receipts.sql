-- supabase/migrations/0005_receipts.sql
--
-- Receipts: each provider gets their own running receipt numbers
-- (REC-0001, REC-0002 …), handed out by the database the moment a job is
-- marked paid, so two phones can never produce the same number.
-- Run after 0004. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------

alter table public.providers
  add column if not exists receipt_seq integer not null default 0;

alter table public.payment_requests
  add column if not exists receipt_number integer,
  add column if not exists paid_method text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'payment_requests_paid_method_check') then
    alter table public.payment_requests
      add constraint payment_requests_paid_method_check
      check (paid_method in ('eft', 'cashsend', 'cash', 'card', 'other'));
  end if;
end $$;

create unique index if not exists payment_requests_provider_receipt_key
  on public.payment_requests (provider_id, receipt_number)
  where receipt_number is not null;

-- ---------------------------------------------------------------------------
-- 2. Number the jobs that are already paid (oldest first), before the
--    trigger exists, so the trigger doesn't interfere.
-- ---------------------------------------------------------------------------

drop trigger if exists assign_receipt_number on public.payment_requests;

with numbered as (
  select id,
         row_number() over (partition by provider_id order by coalesce(paid_at, created_at), id) as n
  from public.payment_requests
  where status = 'paid'
)
update public.payment_requests p
set receipt_number = numbered.n
from numbered
where p.id = numbered.id and p.receipt_number is null;

update public.providers pr
set receipt_seq = greatest(
  pr.receipt_seq,
  coalesce((select max(receipt_number) from public.payment_requests where provider_id = pr.id), 0)
);

-- ---------------------------------------------------------------------------
-- 3. From now on: the next number is taken when a job becomes paid.
--    Receipt numbers never change or get reused afterwards.
-- ---------------------------------------------------------------------------

create or replace function public.assign_receipt_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and old.receipt_number is not null then
    new.receipt_number := old.receipt_number; -- locked once issued
    return new;
  end if;

  if new.status = 'paid'
     and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    update public.providers
       set receipt_seq = receipt_seq + 1
     where id = new.provider_id
     returning receipt_seq into new.receipt_number;
    if new.paid_at is null then
      new.paid_at := now();
    end if;
  else
    new.receipt_number := null; -- only the trigger hands out numbers
  end if;

  return new;
end;
$$;

create trigger assign_receipt_number
  before insert or update on public.payment_requests
  for each row execute function public.assign_receipt_number();
