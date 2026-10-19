// src/app/admin/actions.ts
"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdmin, logAdminAction } from "@/lib/admin";
import { authEmailToPhone, pinToPassword } from "@/lib/auth/pin";
import { isWeakPin, normalizeSAPhone } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Supabase ban length for a suspension: effectively until lifted. */
const SUSPEND_BAN = "876000h"; // 100 years

const notAllowed = { ok: false as const, error: "Not allowed." };

async function providerUser(providerId: string) {
  const db = createAdminClient();
  const { data } = await db
    .from("providers")
    .select("id, user_id, full_name")
    .eq("id", providerId)
    .maybeSingle();
  return data as { id: string; user_id: string; full_name: string } | null;
}

export async function setVerified(providerId: string, verified: boolean): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin || !UUID.test(providerId)) return notAllowed;

  const db = createAdminClient();
  const { error } = await db
    .from("providers")
    .update({ verified_at: verified ? new Date().toISOString() : null })
    .eq("id", providerId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction(admin, verified ? "verify" : "unverify", providerId);
  revalidatePath(`/admin/providers/${providerId}`);
  return { ok: true, data: undefined };
}

/**
 * Suspend: blocks sign-in (Supabase ban) and switches off their payment
 * links and profile page. Unsuspend reverses both.
 */
export async function setSuspended(
  providerId: string,
  suspended: boolean,
  reason: string,
): Promise<ActionResult> {
  const admin = await getAdmin();
  if (!admin || !UUID.test(providerId)) return notAllowed;
  if (suspended && reason.trim().length < 3) {
    return { ok: false, error: "Write a short reason, for your records." };
  }

  const provider = await providerUser(providerId);
  if (!provider) return { ok: false, error: "Provider not found." };
  if (provider.user_id === admin.userId) return { ok: false, error: "You can't suspend yourself." };

  const db = createAdminClient();
  const { error: banError } = await db.auth.admin.updateUserById(provider.user_id, {
    ban_duration: suspended ? SUSPEND_BAN : "none",
  });
  if (banError) return { ok: false, error: banError.message };

  const { error } = await db
    .from("providers")
    .update({ suspended_at: suspended ? new Date().toISOString() : null })
    .eq("id", providerId);
  if (error) return { ok: false, error: error.message };

  await logAdminAction(admin, suspended ? "suspend" : "unsuspend", providerId, {
    reason: reason.trim() || null,
  });
  revalidatePath(`/admin/providers/${providerId}`);
  return { ok: true, data: undefined };
}

/** Clear a wrong-PIN lockout. */
export async function unlockPhone(phoneInput: string): Promise<ActionResult> {
  const admin = await getAdmin();
  const phone = normalizeSAPhone(phoneInput);
  if (!admin || !phone) return notAllowed;

  const db = createAdminClient();
  const { error } = await db.from("pin_attempts").delete().eq("phone", phone);
  if (error) return { ok: false, error: error.message };

  await logAdminAction(admin, "unlock", null, { phone });
  revalidatePath("/admin");
  return { ok: true, data: undefined };
}

/**
 * Forgot PIN: set a new random PIN and show it to the admin once, to send
 * to the provider on WhatsApp after checking it's really them. They should
 * change it in Settings straight away.
 */
export async function resetPin(providerId: string): Promise<ActionResult<{ pin: string; phone: string }>> {
  const admin = await getAdmin();
  if (!admin || !UUID.test(providerId)) return notAllowed;

  const provider = await providerUser(providerId);
  if (!provider) return { ok: false, error: "Provider not found." };

  const db = createAdminClient();
  const { data: userData, error: userError } = await db.auth.admin.getUserById(provider.user_id);
  const phone = authEmailToPhone(userData?.user?.email);
  if (userError || !phone) {
    return { ok: false, error: "This account doesn't sign in with a phone number." };
  }

  let pin = "";
  do {
    pin = randomInt(0, 1_000_000).toString().padStart(6, "0");
  } while (isWeakPin(pin));

  const { error } = await db.auth.admin.updateUserById(provider.user_id, {
    password: pinToPassword(phone, pin),
  });
  if (error) return { ok: false, error: error.message };

  await db.from("pin_attempts").delete().eq("phone", phone);
  // The PIN itself is never logged.
  await logAdminAction(admin, "reset_pin", providerId);
  return { ok: true, data: { pin, phone } };
}
