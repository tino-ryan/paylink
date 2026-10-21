// src/app/dashboard/settings/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authEmailToPhone, pinToPassword, signInWithPin } from "@/lib/auth/pin";
import { PAYOUT_KEYS, payoutToColumns, validatePayout, type PayoutDetails } from "@/lib/payout";
import { validateFullName, validateNewPin, validatePin } from "@/lib/validation";
import type { ActionResult, Provider } from "@/lib/types";

export interface SettingsInput {
  fullName: string;
  trade: string;
  payout: PayoutDetails;
  /** Required only when payment details change. */
  pin?: string;
}

export type SaveSettingsResult =
  | { ok: true; data: { payoutChanged: boolean } }
  | { ok: false; error: string; needsPin?: boolean };


async function currentUserAndProvider() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("providers").select("*").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { user, provider: data as Provider };
}

/**
 * Save profile and payment details. Changing where money goes (bank or
 * CashSend) needs the PIN, and is recorded so the dashboard can warn the
 * owner. The database also refuses payment-detail changes from the browser,
 * so this is the only way to make them.
 */
export async function saveSettings(input: SettingsInput): Promise<SaveSettingsResult> {
  const session = await currentUserAndProvider();
  if (!session) return { ok: false, error: "Please sign in again." };
  const { user, provider } = session;

  const nameError = validateFullName(input.fullName);
  if (nameError) return { ok: false, error: nameError };
  if (!input.trade.trim()) return { ok: false, error: "Choose what you do." };
  if (input.trade.trim().length > 40) return { ok: false, error: "Keep what you do to 40 letters or fewer." };
  if (Object.keys(validatePayout(input.payout)).length > 0) {
    return { ok: false, error: "Some payment details need fixing." };
  }

  const columns = payoutToColumns(input.payout);
  const payoutChanged = PAYOUT_KEYS.some((key) => (columns[key] ?? null) !== (provider[key] ?? null));

  if (payoutChanged) {
    const phone = authEmailToPhone(user.email);
    if (!phone) {
      return { ok: false, error: "Sign in with your phone number and PIN to change payment details." };
    }
    if (!input.pin) {
      return { ok: false, needsPin: true, error: "Enter your PIN to change payment details." };
    }
    const pinError = validatePin(input.pin);
    if (pinError) return { ok: false, needsPin: true, error: pinError };

    const check = await signInWithPin(phone, input.pin);
    if (!check.ok) return { ok: false, needsPin: true, error: check.error };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("providers")
    .update({
      full_name: input.fullName.trim(),
      trade: input.trade.trim(),
      ...(payoutChanged ? { ...columns, payout_changed_at: new Date().toISOString() } : {}),
    })
    .eq("id", provider.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: "Couldn't save your changes. Check your signal and try again." };
  return { ok: true, data: { payoutChanged } };
}

export async function changePin(
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const phone = authEmailToPhone(user.email);
  if (!phone) return { ok: false, error: "This account doesn't use a PIN." };

  const newError = validateNewPin(newPin);
  if (newError) return { ok: false, error: newError };
  if (newPin !== confirmPin) return { ok: false, error: "The new PINs don't match." };
  if (newPin === currentPin) return { ok: false, error: "Choose a PIN that's different from your current one." };

  const check = await signInWithPin(phone, currentPin);
  if (!check.ok) return { ok: false, error: check.error.replace("phone number and PIN don't match", "current PIN isn't right") };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password: pinToPassword(phone, newPin),
  });
  if (error) return { ok: false, error: "Couldn't change your PIN. Try again." };
  return { ok: true, data: undefined };
}
