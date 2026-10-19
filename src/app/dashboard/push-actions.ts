// src/app/dashboard/push-actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfigured, sendPushToProvider } from "@/lib/push";
import type { ActionResult } from "@/lib/types";

/** The serialised PushSubscription the browser hands us. */
export interface BrowserPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

const BASE64URL = /^[A-Za-z0-9_-]+=*$/;

function isValidSubscription(sub: BrowserPushSubscription): boolean {
  if (typeof sub?.endpoint !== "string" || sub.endpoint.length > 1000) return false;
  try {
    if (new URL(sub.endpoint).protocol !== "https:") return false;
  } catch {
    return false;
  }
  const { p256dh, auth } = sub.keys ?? {};
  return (
    typeof p256dh === "string" &&
    typeof auth === "string" &&
    p256dh.length > 0 &&
    p256dh.length <= 200 &&
    auth.length > 0 &&
    auth.length <= 100 &&
    BASE64URL.test(p256dh) &&
    BASE64URL.test(auth)
  );
}

/** Signed-in provider's id, or null. Uses the user's own session (RLS). */
async function currentProviderId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function savePushSubscription(
  subscription: BrowserPushSubscription,
  userAgent: string,
): Promise<ActionResult> {
  if (!isPushConfigured()) {
    return { ok: false, error: "Payment alerts aren't set up on the server yet." };
  }
  if (!isValidSubscription(subscription)) {
    return { ok: false, error: "This phone gave us an invalid alert setup. Try again." };
  }

  const providerId = await currentProviderId();
  if (!providerId) return { ok: false, error: "Please sign in again." };

  // Upsert on endpoint: if this phone was linked to another account before,
  // it now belongs to whoever is signed in.
  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    {
      provider_id: providerId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent.slice(0, 300),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { ok: false, error: "Couldn't turn on alerts. Check your signal and try again." };
  }
  return { ok: true, data: undefined };
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const providerId = await currentProviderId();
  if (!providerId) return { ok: false, error: "Please sign in again." };

  // Only delete it if it belongs to this provider.
  const admin = createAdminClient();
  const { error } = await admin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("provider_id", providerId);

  if (error) {
    return { ok: false, error: "Couldn't turn off alerts. Try again." };
  }
  return { ok: true, data: undefined };
}

export async function sendTestPush(): Promise<ActionResult<{ sent: number }>> {
  const providerId = await currentProviderId();
  if (!providerId) return { ok: false, error: "Please sign in again." };

  const result = await sendPushToProvider(providerId, {
    title: "Payment alerts are on ✅",
    body: "This is how PayLink will tell you when a customer pays.",
    url: "/dashboard",
    tag: "test",
  });

  if (result.sent === 0) {
    return {
      ok: false,
      error: "No phone received it. Turn alerts off and on again, then retry.",
    };
  }
  return { ok: true, data: { sent: result.sent } };
}
