// src/lib/auth/pin.ts
//
// Server-only. Phone number + 6-digit PIN sign-in on top of Supabase's
// email/password auth, with no SMS cost.
//
// How it works:
//   * Each phone number maps to a placeholder login email that can never
//     receive mail: 0712345678@phone.paylink.invalid (".invalid" is reserved).
//   * The PIN is never the Supabase password. The password is
//     HMAC-SHA256(PIN_PEPPER, phone:pin). Only this server knows PIN_PEPPER,
//     so nobody can guess PINs by calling Supabase directly with the public
//     key — every attempt has to come through here, where the lockout applies.
//
// Changing PIN_PEPPER logs everyone out permanently. Set it once, keep it safe.
import { createHmac } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const AUTH_EMAIL_DOMAIN = "phone.paylink.invalid";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
/** Failures older than this don't count towards a lockout. */
const FAILURE_WINDOW_MINUTES = 60;

export const phoneToAuthEmail = (phone: string): string => `${phone}@${AUTH_EMAIL_DOMAIN}`;

/** "0712345678@phone.paylink.invalid" → "0712345678", or null for other emails. */
export const authEmailToPhone = (email: string | undefined | null): string | null => {
  const match = email?.match(/^(0\d{9})@phone\.paylink\.invalid$/);
  return match ? match[1] : null;
};

function pepper(): string {
  const value = process.env.PIN_PEPPER;
  if (!value || value.length < 32) {
    throw new Error("PIN_PEPPER is missing or shorter than 32 characters in .env.local");
  }
  return value;
}

export const pinToPassword = (phone: string, pin: string): string =>
  createHmac("sha256", pepper()).update(`${phone}:${pin}`).digest("base64url");

// ---- Lockout ----

interface AttemptRow {
  failed_count: number;
  last_failed_at: string | null;
  locked_until: string | null;
}

/** Minutes left on a lockout, or 0 if not locked. */
async function minutesLocked(phone: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pin_attempts")
    .select("failed_count, last_failed_at, locked_until")
    .eq("phone", phone)
    .maybeSingle();
  const row = data as AttemptRow | null;
  if (!row?.locked_until) return 0;
  const ms = new Date(row.locked_until).getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

/** Records a wrong PIN. Returns true if this attempt triggered a lockout. */
async function recordFailure(phone: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("pin_attempts")
    .select("failed_count, last_failed_at, locked_until")
    .eq("phone", phone)
    .maybeSingle();
  const row = data as AttemptRow | null;

  const windowStart = Date.now() - FAILURE_WINDOW_MINUTES * 60000;
  const recent = row?.last_failed_at && new Date(row.last_failed_at).getTime() > windowStart;
  const count = (recent ? row.failed_count : 0) + 1;
  const lock = count >= MAX_FAILED_ATTEMPTS;

  await admin.from("pin_attempts").upsert({
    phone,
    failed_count: lock ? 0 : count,
    last_failed_at: new Date().toISOString(),
    locked_until: lock ? new Date(Date.now() + LOCK_MINUTES * 60000).toISOString() : null,
  });
  return lock;
}

async function clearFailures(phone: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("pin_attempts").delete().eq("phone", phone);
}

const lockedMessage = (minutes: number) =>
  `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or WhatsApp us for help.`;

export type PinCheck = { ok: true } | { ok: false; error: string };

/**
 * Check a phone + PIN and, if right, sign in (sets the session cookies).
 * Used for sign-in, and to re-confirm the PIN before sensitive changes.
 * Messages never reveal whether the number has an account.
 */
export async function signInWithPin(phone: string, pin: string): Promise<PinCheck> {
  const locked = await minutesLocked(phone);
  if (locked > 0) return { ok: false, error: lockedMessage(locked) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: phoneToAuthEmail(phone),
    password: pinToPassword(phone, pin),
  });

  if (error) {
    // 400 = wrong credentials. Anything else is a connection or server problem
    // and shouldn't count against the user.
    if (error.status !== 400) {
      return { ok: false, error: "Couldn't reach PayLink. Check your signal and try again." };
    }
    const nowLocked = await recordFailure(phone);
    return {
      ok: false,
      error: nowLocked ? lockedMessage(LOCK_MINUTES) : "That phone number and PIN don't match.",
    };
  }

  await clearFailures(phone);
  return { ok: true };
}
