// src/lib/types.ts

export type PayoutMethod = "bank" | "cashsend" | "ewallet";
export type AccountType = "cheque" | "savings";
export type RequestStatus = "pending" | "paid" | "expired";
export type PaymentMethod = "card" | "instant_eft" | "cashsend" | "manual_eft";
export type RequestCreatedBy = "provider" | "customer";

export interface Provider {
  id: string;
  user_id: string;
  full_name: string;
  trade: string;
  slug: string;
  phone: string | null;
  payout_method: PayoutMethod;
  bank_name: string | null;
  account_number: string | null;
  account_type: AccountType | null;
  cashsend_phone: string | null;
  cashsend_bank: string | null;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  provider_id: string;
  description: string;
  amount_cents: number;
  status: RequestStatus;
  short_code: string;
  cashsend_reference: string | null;
  expires_at: string;
  created_at: string;
  paid_at: string | null;
  customer_reported_paid_at: string | null;
  created_by: RequestCreatedBy;
}

export interface Transaction {
  id: string;
  payment_request_id: string;
  ozow_transaction_id: string | null;
  payment_method: PaymentMethod | null;
  amount_cents: number;
  status: string;
  customer_email: string | null;
  paid_at: string;
}

// ---- Public (customer-facing) shapes ----
// These are the ONLY provider fields a customer's browser ever receives.

export type PublicPayoutDetails = Pick<
  Provider,
  | "full_name"
  | "trade"
  | "payout_method"
  | "bank_name"
  | "account_number"
  | "account_type"
  | "cashsend_phone"
  | "cashsend_bank"
>;

export type PublicRequest = Pick<
  PaymentRequest,
  | "short_code"
  | "description"
  | "amount_cents"
  | "status"
  | "cashsend_reference"
  | "expires_at"
  | "customer_reported_paid_at"
>;

export interface PaymentPageData {
  request: PublicRequest;
  provider: PublicPayoutDetails;
}

/** What the public profile page (/[slug]) needs. No payout details. */
export type PublicProfile = Pick<Provider, "full_name" | "trade" | "slug">;

/** Result shape for server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };
