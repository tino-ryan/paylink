// src/lib/auth/session.ts
//
// Server-only. Who's signed in, and their provider row, looked up ONCE per
// request. The dashboard layout and the page both need these; React's cache()
// makes the second call free instead of another round trip to Supabase.
//
// getClaims() checks the session token's signature. With Supabase's newer
// signing keys that happens locally (no network); with older projects it
// falls back to asking Supabase, which is still correct, just slower.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Provider } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string | null;
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  const claims = data.claims as { sub?: string; email?: string };
  if (!claims.sub) return null;
  return { id: claims.sub, email: claims.email ?? null };
});

/** The signed-in provider's full row (RLS: only their own), or null. */
export const getMyProvider = cache(async (): Promise<Provider | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Provider | null) ?? null;
});
