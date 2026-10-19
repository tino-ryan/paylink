-- supabase/migrations/0002_push_subscriptions.sql
--
-- One row per phone/browser that turned on payment alerts.
-- Run after 0001. Safe to re-run.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  endpoint text not null unique,          -- the browser's push URL; identifies the device
  p256dh text not null,                   -- encryption key from the browser
  auth text not null,                     -- auth secret from the browser
  user_agent text,                        -- helps the provider recognise "my Samsung"
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create index if not exists push_subscriptions_provider_idx
  on public.push_subscriptions (provider_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;

-- Providers can see and remove their own devices.
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated
  using (provider_id in (select id from public.providers where user_id = auth.uid()));

-- No insert/update policy: saving a subscription goes through a server action
-- that checks who is signed in, then writes with the service role. That also
-- handles one phone switching between two PayLink accounts, which a
-- user-level upsert would be blocked from doing.
