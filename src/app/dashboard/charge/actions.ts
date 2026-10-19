// src/app/dashboard/charge/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  effectiveStatus,
  generateCashSendReference,
  generateShortCode,
  MAX_AMOUNT_CENTS,
  MIN_AMOUNT_CENTS,
  UNIQUE_VIOLATION,
} from "@/lib/utils";
import type { ActionResult, PaidMethod, RequestStatus } from "@/lib/types";

const SHORT_CODE_ATTEMPTS = 3;
const MAX_DESCRIPTION = 100;
const SHORT_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

/** The signed-in provider's id. All queries below run under their RLS session. */
async function providerSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("providers").select("id").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { supabase, providerId: (data as { id: string }).id };
}

/** Create a payment request for a customer standing in front of you. */
export async function createCharge(
  amountCents: number,
  description: string,
): Promise<ActionResult<{ shortCode: string }>> {
  if (!Number.isInteger(amountCents) || amountCents < MIN_AMOUNT_CENTS) {
    return { ok: false, error: "Enter an amount of at least R 1.00." };
  }
  if (amountCents > MAX_AMOUNT_CENTS) {
    return { ok: false, error: "That's more than a payment link allows." };
  }
  const cleanDescription = description.trim().slice(0, MAX_DESCRIPTION) || "Payment";

  const session = await providerSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  for (let attempt = 0; attempt < SHORT_CODE_ATTEMPTS; attempt++) {
    const shortCode = generateShortCode();
    const { error } = await session.supabase.from("payment_requests").insert({
      provider_id: session.providerId,
      description: cleanDescription,
      amount_cents: amountCents,
      short_code: shortCode,
      cashsend_reference: generateCashSendReference(cleanDescription, shortCode),
    });
    if (!error) return { ok: true, data: { shortCode } };
    if (error.code !== UNIQUE_VIOLATION) break;
  }
  return { ok: false, error: "Couldn't create the QR code. Check your signal and try again." };
}

export interface ChargeStatus {
  status: RequestStatus;
  customerReported: boolean;
  /** Set once paid, for the WhatsApp receipt. */
  receipt: PaidCharge | null;
}

/** Polled every few seconds by the Charge screen. */
export async function getChargeStatus(code: string): Promise<ActionResult<ChargeStatus>> {
  if (!SHORT_CODE_PATTERN.test(code)) return { ok: false, error: "Unknown sale." };
  const session = await providerSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  const { data, error } = await session.supabase
    .from("payment_requests")
    .select("status, expires_at, customer_reported_paid_at, receipt_number, paid_at, paid_method")
    .eq("short_code", code)
    .maybeSingle();

  if (error || !data) return { ok: false, error: "Couldn't check the payment." };
  const row = data as {
    status: RequestStatus;
    expires_at: string;
    customer_reported_paid_at: string | null;
    receipt_number: number | null;
    paid_at: string | null;
    paid_method: PaidMethod | null;
  };
  const status = effectiveStatus(row);
  return {
    ok: true,
    data: {
      status,
      customerReported: status !== "paid" && row.customer_reported_paid_at !== null,
      receipt:
        status === "paid"
          ? { receiptNumber: row.receipt_number, paidAt: row.paid_at, paidMethod: row.paid_method }
          : null,
    },
  };
}

const PAID_METHODS: PaidMethod[] = ["eft", "cashsend", "cash", "card", "other"];

export interface PaidCharge {
  receiptNumber: number | null;
  paidAt: string | null;
  paidMethod: PaidMethod | null;
}

export async function markChargePaid(
  code: string,
  method?: PaidMethod,
): Promise<ActionResult<PaidCharge>> {
  if (!SHORT_CODE_PATTERN.test(code)) return { ok: false, error: "Unknown sale." };
  const session = await providerSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  // The database trigger assigns the receipt number during this update, so
  // reading the row back gives us the number for the WhatsApp receipt.
  const { data, error } = await session.supabase
    .from("payment_requests")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_method: method && PAID_METHODS.includes(method) ? method : null,
    })
    .eq("short_code", code)
    .in("status", ["pending", "expired"])
    .select("receipt_number, paid_at, paid_method")
    .maybeSingle();
  if (error) return { ok: false, error: "Couldn't save that. Check your signal and try again." };

  if (data) {
    const row = data as { receipt_number: number | null; paid_at: string | null; paid_method: PaidMethod | null };
    return { ok: true, data: { receiptNumber: row.receipt_number, paidAt: row.paid_at, paidMethod: row.paid_method } };
  }

  // Nothing updated: it was already paid (e.g. a double tap). Read it instead.
  const { data: existing, error: readError } = await session.supabase
    .from("payment_requests")
    .select("status, receipt_number, paid_at, paid_method")
    .eq("short_code", code)
    .maybeSingle();
  if (readError || !existing) return { ok: false, error: "Couldn't find that sale." };
  const row = existing as {
    status: RequestStatus;
    receipt_number: number | null;
    paid_at: string | null;
    paid_method: PaidMethod | null;
  };
  if (row.status !== "paid") return { ok: false, error: "Couldn't save that. Try again." };
  return { ok: true, data: { receiptNumber: row.receipt_number, paidAt: row.paid_at, paidMethod: row.paid_method } };
}

/** Customer walked away or the amount was wrong: close the link so it can't be paid. */
export async function cancelCharge(code: string): Promise<ActionResult> {
  if (!SHORT_CODE_PATTERN.test(code)) return { ok: false, error: "Unknown sale." };
  const session = await providerSession();
  if (!session) return { ok: false, error: "Please sign in again." };

  const { error } = await session.supabase
    .from("payment_requests")
    .update({ status: "expired", expires_at: new Date().toISOString() })
    .eq("short_code", code)
    .eq("status", "pending");
  if (error) return { ok: false, error: "Couldn't cancel. Check your signal and try again." };
  return { ok: true, data: undefined };
}
