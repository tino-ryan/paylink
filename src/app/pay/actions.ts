// src/app/pay/actions.ts
"use server";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidShortCode } from "@/lib/public-data";
import { sendPushToProvider } from "@/lib/push";
import { formatRand } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/**
 * Customer taps "I've sent the money".
 *
 * This does NOT mark the request paid — a customer's word isn't proof of
 * payment. It records customer_reported_paid_at so the provider sees
 * "Customer says paid — check your bank" and confirms it themselves.
 *
 * Safe to call more than once: only the first report is stored, and only on
 * a request that is still pending and not expired.
 */
export async function reportPaymentSent(
  code: string,
): Promise<ActionResult<{ alreadyReported: boolean }>> {
  if (!isValidShortCode(code)) {
    return { ok: false, error: "This payment link isn't valid." };
  }

  const admin = createAdminClient();

  const { data: updated, error } = await admin
    .from("payment_requests")
    .update({ customer_reported_paid_at: new Date().toISOString() })
    .eq("short_code", code)
    .eq("status", "pending")
    .is("customer_reported_paid_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("short_code, provider_id, description, amount_cents");

  if (error) {
    return {
      ok: false,
      error: "We couldn't save that. Check your signal and try again.",
    };
  }

  if (updated && updated.length > 0) {
    const row = updated[0] as {
      short_code: string;
      provider_id: string;
      description: string;
      amount_cents: number;
    };

    // Alert the provider's phone after the response is sent, so the customer
    // isn't kept waiting. sendPushToProvider never throws.
    after(async () => {
      await sendPushToProvider(row.provider_id, {
        title: "💰 Customer says they've paid",
        body: `${formatRand(row.amount_cents)} for ${row.description}. Check your bank, then mark it paid.`,
        url: `/dashboard/requests/${row.short_code}`,
        tag: `request-${row.short_code}`,
      });
    });

    return { ok: true, data: { alreadyReported: false } };
  }

  // Nothing updated: either already reported, already paid, or expired.
  const { data: current, error: readError } = await admin
    .from("payment_requests")
    .select("status, customer_reported_paid_at, expires_at")
    .eq("short_code", code)
    .maybeSingle<{
      status: string;
      customer_reported_paid_at: string | null;
      expires_at: string;
    }>();

  if (readError || !current) {
    return { ok: false, error: "This payment link isn't valid." };
  }
  if (current.status === "paid") {
    return { ok: true, data: { alreadyReported: true } };
  }
  if (current.customer_reported_paid_at) {
    return { ok: true, data: { alreadyReported: true } };
  }
  return {
    ok: false,
    error: "This link has expired. Ask for a new payment link.",
  };
}
