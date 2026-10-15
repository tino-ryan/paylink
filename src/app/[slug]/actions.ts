// src/app/[slug]/actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isValidSlug } from "@/lib/public-data";
import {
  generateCashSendReference,
  generateShortCode,
  MAX_AMOUNT_CENTS,
  MIN_AMOUNT_CENTS,
  parseRandInput,
  UNIQUE_VIOLATION,
} from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

/** Max requests customers can create on one provider's profile per hour. */
const CUSTOMER_REQUESTS_PER_HOUR = 30;
const MAX_DESCRIPTION_LENGTH = 100;
const SHORT_CODE_ATTEMPTS = 3;

/**
 * A customer on /sipho-plumbing enters what they're paying for and how much.
 * Runs on the server so the browser never needs insert access to the table.
 */
export async function createCustomerRequest(
  slug: string,
  description: string,
  amountInput: string,
): Promise<ActionResult<{ shortCode: string }>> {
  const cleanDescription = description.trim();

  if (!isValidSlug(slug)) {
    return { ok: false, error: "This PayLink address isn't valid." };
  }
  if (!cleanDescription) {
    return { ok: false, error: "Please describe what you're paying for." };
  }
  if (cleanDescription.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`,
    };
  }

  const amountCents = parseRandInput(amountInput);
  if (amountCents === null || amountCents < MIN_AMOUNT_CENTS) {
    return { ok: false, error: "Please enter an amount of at least R 1.00." };
  }
  if (amountCents > MAX_AMOUNT_CENTS) {
    return { ok: false, error: "That amount is too large for a payment link." };
  }

  const admin = createAdminClient();

  const { data: provider, error: providerError } = await admin
    .from("providers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle<{ id: string }>();

  if (providerError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  if (!provider) {
    return { ok: false, error: "This PayLink address doesn't exist." };
  }

  // Basic spam guard: cap customer-created requests per provider per hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await admin
    .from("payment_requests")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id)
    .eq("created_by", "customer")
    .gte("created_at", oneHourAgo);

  if (countError) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  if ((count ?? 0) >= CUSTOMER_REQUESTS_PER_HOUR) {
    return {
      ok: false,
      error:
        "Too many payments started here in the last hour. Ask the provider to send you a link instead.",
    };
  }

  // Retry if the random short code collides with an existing one.
  for (let attempt = 0; attempt < SHORT_CODE_ATTEMPTS; attempt++) {
    const shortCode = generateShortCode();
    const { error: insertError } = await admin.from("payment_requests").insert({
      provider_id: provider.id,
      description: cleanDescription,
      amount_cents: amountCents,
      short_code: shortCode,
      cashsend_reference: generateCashSendReference(cleanDescription, shortCode),
      created_by: "customer",
    });

    if (!insertError) {
      return { ok: true, data: { shortCode } };
    }
    if (insertError.code !== UNIQUE_VIOLATION) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
  }

  return { ok: false, error: "Something went wrong. Please try again." };
}
