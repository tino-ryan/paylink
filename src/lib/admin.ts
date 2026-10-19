// src/lib/admin.ts
//
// Server-only. Who counts as a PayLink admin, and the action log.
//
// Admins are listed by phone number in ADMIN_PHONES (comma-separated, e.g.
// "0712345678,0829876543"). There's no admin flag in the database, so nobody
// can make themselves an admin by editing a row.
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { authEmailToPhone } from "@/lib/auth/pin";
import { normalizeSAPhone } from "@/lib/validation";

function adminPhones(): Set<string> {
  return new Set(
    (process.env.ADMIN_PHONES ?? "")
      .split(",")
      .map((value) => normalizeSAPhone(value.trim()))
      .filter((value): value is string => value !== null),
  );
}

export interface AdminSession {
  userId: string;
  phone: string;
}

/** The signed-in admin, or null for everyone else (including signed-out). */
export async function getAdmin(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const phone = authEmailToPhone(user.email);
  if (!phone || !adminPhones().has(phone)) return null;
  return { userId: user.id, phone };
}

export type AdminActionName =
  | "verify"
  | "unverify"
  | "suspend"
  | "unsuspend"
  | "unlock"
  | "reset_pin";

/** Best effort: a failed log write never blocks the action itself. */
export async function logAdminAction(
  admin: AdminSession,
  action: AdminActionName,
  providerId: string | null,
  details?: Record<string, string | number | boolean | null>,
): Promise<void> {
  const db = createAdminClient();
  await db.from("admin_actions").insert({
    admin_phone: admin.phone,
    action,
    provider_id: providerId,
    details: details ?? null,
  });
}
