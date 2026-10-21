// src/lib/public-data.ts
//
// Server-only reads for customer-facing pages (/pay/[code] and /[slug]).
//
// Why this exists: customers aren't signed in, and RLS gives anonymous visitors
// no access to any table. These helpers use the service-role client, look up
// exactly ONE row by its public key (short code or slug), and return only the
// fields the page needs. Nobody can list providers or see another provider's
// details through them.
import { createAdminClient } from "@/lib/supabase/admin";
import { effectiveStatus } from "@/lib/utils";
import type {
  AccountType,
  PaidMethod,
  PaymentPageData,
  PayoutMethod,
  PublicProfile,
  RequestStatus,
} from "@/lib/types";

const SHORT_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const SLUG_PATTERN = /^[a-z0-9-]{3,60}$/;

export const isValidShortCode = (code: string): boolean =>
  SHORT_CODE_PATTERN.test(code);

export const isValidSlug = (slug: string): boolean => SLUG_PATTERN.test(slug);

interface RequestRow {
  short_code: string;
  description: string;
  amount_cents: number;
  status: RequestStatus;
  cashsend_reference: string | null;
  expires_at: string;
  customer_reported_paid_at: string | null;
  cancelled_at: string | null;
  customer_name: string | null;
  paid_at: string | null;
  receipt_number: number | null;
  paid_method: PaidMethod | null;
  providers: {
    full_name: string;
    trade: string;
    payout_method: PayoutMethod;
    bank_name: string | null;
    account_number: string | null;
    account_type: AccountType | null;
    cashsend_phone: string | null;
    account_holder: string | null;
    branch_code: string | null;
    phone: string | null;
    verified_at: string | null;
    suspended_at: string | null;
  } | null;
}

/**
 * Everything the customer payment page needs, or null if the code doesn't exist.
 * Throws on database errors so the page shows the error boundary instead of a
 * misleading "not found".
 */
export async function getPaymentPage(
  code: string,
): Promise<PaymentPageData | null> {
  if (!isValidShortCode(code)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payment_requests")
    .select(
      `short_code, description, amount_cents, status, cashsend_reference,
       expires_at, customer_reported_paid_at, cancelled_at, customer_name, paid_at, receipt_number, paid_method,
       providers ( full_name, trade, payout_method, bank_name, account_number,
                   account_type, account_holder, branch_code, cashsend_phone, phone,
                   verified_at, suspended_at )`,
    )
    .eq("short_code", code)
    .maybeSingle<RequestRow>();

  if (error) {
    throw new Error(`getPaymentPage failed: ${error.message}`);
  }
  if (!data || !data.providers) return null;
  // Suspended by PayLink (e.g. fraud): their links stop working.
  if (data.providers.suspended_at !== null) return null;

  const status = effectiveStatus(data);

  // Record the expiry so the provider's dashboard and the database agree.
  // Best effort: the page is correct either way because of effectiveStatus.
  if (status === "expired" && data.status === "pending") {
    await admin
      .from("payment_requests")
      .update({ status: "expired" })
      .eq("short_code", code)
      .eq("status", "pending");
  }

  return {
    request: {
      short_code: data.short_code,
      description: data.description,
      amount_cents: data.amount_cents,
      status,
      cashsend_reference: data.cashsend_reference,
      expires_at: data.expires_at,
      customer_reported_paid_at: data.customer_reported_paid_at,
      cancelled_at: data.cancelled_at,
      // Shown on the customer's own receipt. The phone number is never exposed.
      customer_name: data.customer_name,
      paid_at: data.paid_at,
      receipt_number: data.receipt_number,
      paid_method: data.paid_method,
    },
    // Only the fields the payment page shows (suspended_at stays server-side).
    provider: {
      full_name: data.providers.full_name,
      trade: data.providers.trade,
      payout_method: data.providers.payout_method,
      bank_name: data.providers.bank_name,
      account_number: data.providers.account_number,
      account_type: data.providers.account_type,
      cashsend_phone: data.providers.cashsend_phone,
      account_holder: data.providers.account_holder,
      branch_code: data.providers.branch_code,
      // For proof of payment and CashSend PINs; falls back to the CashSend number.
      whatsapp: data.providers.phone ?? data.providers.cashsend_phone,
      verified_at: data.providers.verified_at,
    },
  };
}

/** Name and trade for the public profile page. No payout details. */
export async function getPublicProfile(
  slug: string,
): Promise<PublicProfile | null> {
  if (!isValidSlug(slug)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("providers")
    .select("full_name, trade, slug, verified_at")
    .eq("slug", slug)
    .is("suspended_at", null)
    .maybeSingle<PublicProfile>();

  if (error) {
    throw new Error(`getPublicProfile failed: ${error.message}`);
  }
  return data;
}
