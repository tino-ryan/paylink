-- 0007_cancelled.sql
-- Record when a provider cancels a payment request, so it shows as
-- "Cancelled" instead of "Expired". Cancelling still sets status = 'expired'
-- (so nothing else changes: the link stops working exactly as before).
-- Safe to run more than once.

alter table public.payment_requests
  add column if not exists cancelled_at timestamptz;
