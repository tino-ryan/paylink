// src/app/onboarding/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizeSlug, validateSlug } from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

/**
 * Is this PayLink address free? Needs the service role because RLS hides
 * other providers' rows. Only answers signed-in users, and only yes/no.
 */
export async function checkSlugAvailable(
  rawSlug: string,
): Promise<ActionResult<{ available: boolean }>> {
  const slug = finalizeSlug(rawSlug);
  const formatError = validateSlug(slug);
  if (formatError) return { ok: false, error: formatError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("providers")
    .select("user_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "Couldn't check that address. Check your signal and try again." };
  }

  const takenBy = (data as { user_id: string } | null)?.user_id;
  return { ok: true, data: { available: !takenBy || takenBy === user.id } };
}
