// src/app/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { phoneToAuthEmail, pinToPassword, signInWithPin } from "@/lib/auth/pin";
import { normalizeSAPhone, validateNewPin, validatePin } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export interface SignedIn {
  /** Where to go next. */
  next: "/dashboard" | "/onboarding";
  /** Normalised number, remembered on the device for next time. */
  phone: string;
  /** First name for "Welcome back, Sipho", if they've finished setup. */
  firstName: string | null;
}

async function whereNext(phone: string): Promise<SignedIn> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { next: "/onboarding", phone, firstName: null };

  const { data } = await supabase
    .from("providers")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const fullName = (data as { full_name: string } | null)?.full_name ?? null;
  return {
    next: fullName ? "/dashboard" : "/onboarding",
    phone,
    firstName: fullName ? fullName.split(" ")[0] : null,
  };
}

export async function signIn(phoneInput: string, pin: string): Promise<ActionResult<SignedIn>> {
  const phone = normalizeSAPhone(phoneInput);
  if (!phone) {
    return { ok: false, error: "Enter a South African cellphone number, like 071 234 5678." };
  }
  const pinError = validatePin(pin);
  if (pinError) return { ok: false, error: pinError };

  const result = await signInWithPin(phone, pin);
  if (!result.ok) return result;
  return { ok: true, data: await whereNext(phone) };
}

export async function createAccount(
  phoneInput: string,
  pin: string,
  pinConfirm: string,
): Promise<ActionResult<SignedIn>> {
  const phone = normalizeSAPhone(phoneInput);
  if (!phone) {
    return { ok: false, error: "Enter a South African cellphone number, like 071 234 5678." };
  }
  const pinError = validateNewPin(pin);
  if (pinError) return { ok: false, error: pinError };
  if (pin !== pinConfirm) return { ok: false, error: "The two PINs don't match. Try again." };

  // Accounts are created by the server (public sign-up is switched off in
  // Supabase), so every account follows these PIN rules.
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: phoneToAuthEmail(phone),
    password: pinToPassword(phone, pin),
    email_confirm: true,
    user_metadata: { phone },
  });

  if (error) {
    const exists = error.status === 422 || /already/i.test(error.message);
    return {
      ok: false,
      error: exists
        ? "That number already has a PayLink account. Sign in instead."
        : "Couldn't create your account. Check your signal and try again.",
    };
  }

  const signedIn = await signInWithPin(phone, pin);
  if (!signedIn.ok) return signedIn;
  return { ok: true, data: { next: "/onboarding", phone, firstName: null } };
}
