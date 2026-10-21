// src/app/dashboard/customer-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeSAPhone } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const SHORT_CODE_PATTERN = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
const CUSTOMER_NAME_MAX = 80;

/**
 * Save (or clear) the customer's name and WhatsApp number on one job.
 * Optional for the provider; RLS means they can only touch their own jobs.
 * The number is never shown to anyone else; the name appears on the
 * customer's own receipt.
 */
export async function saveJobCustomer(
  code: string,
  nameInput: string,
  phoneInput: string,
): Promise<ActionResult> {
  if (!SHORT_CODE_PATTERN.test(code)) return { ok: false, error: "Unknown job." };

  const name = nameInput.trim().replace(/\s+/g, " ");
  if (name.length > CUSTOMER_NAME_MAX) {
    return { ok: false, error: `Keep the name to ${CUSTOMER_NAME_MAX} letters or fewer.` };
  }
  const phone = phoneInput.trim() ? normalizeSAPhone(phoneInput) : null;
  if (phoneInput.trim() && !phone) {
    return { ok: false, error: "That doesn't look like a SA cellphone number. Try 071 234 5678." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_requests")
    .update({ customer_name: name || null, customer_phone: phone })
    .eq("short_code", code)
    .select("short_code");

  if (error) return { ok: false, error: "Couldn't save the customer. Check your signal and try again." };
  if (!data || data.length === 0) return { ok: false, error: "Unknown job." };

  revalidatePath("/dashboard", "layout");
  return { ok: true, data: undefined };
}
