// src/lib/push.ts
//
// Server-only: sends Web Push notifications to a provider's devices.
// Uses the service-role client to read subscriptions, so never import this
// from a "use client" file.
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PushPayload {
  title: string;
  body: string;
  /** Same-site path to open when tapped, e.g. "/dashboard/requests/ABC123". */
  url: string;
  /** Notifications with the same tag replace each other instead of stacking. */
  tag?: string;
}

export interface PushResult {
  sent: number;
  removed: number;
  failed: number;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidConfigured = false;

/** Returns false (and sends nothing) if VAPID keys aren't set yet. */
function configureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function isPushConfigured(): boolean {
  return configureVapid();
}

function statusCodeOf(error: unknown): number | null {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const code = (error as { statusCode: unknown }).statusCode;
    return typeof code === "number" ? code : null;
  }
  return null;
}

/**
 * Send one notification to every device the provider has turned alerts on for.
 *
 * Never throws: an alert failing must not break the action that triggered it
 * (e.g. the customer's "I've sent the money"). Subscriptions the push service
 * reports as gone (404/410: app uninstalled, alerts turned off) are deleted.
 */
export async function sendPushToProvider(
  providerId: string,
  payload: PushPayload,
): Promise<PushResult> {
  try {
    return await deliver(providerId, payload);
  } catch {
    // e.g. missing env vars or the database unreachable. Report, don't throw.
    return { sent: 0, removed: 0, failed: 1 };
  }
}

async function deliver(providerId: string, payload: PushPayload): Promise<PushResult> {
  const result: PushResult = { sent: 0, removed: 0, failed: 0 };
  if (!configureVapid()) return result;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("provider_id", providerId);

  if (error || !data || data.length === 0) return result;

  const subscriptions = data as SubscriptionRow[];
  const body = JSON.stringify(payload);
  const goneIds: string[] = [];
  const okIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          {
            TTL: 60 * 60 * 24, // keep trying for a day if the phone is off (load shedding)
            urgency: "high",
            timeout: 10_000,
          },
        );
        okIds.push(sub.id);
      } catch (sendError) {
        const status = statusCodeOf(sendError);
        if (status === 404 || status === 410) {
          goneIds.push(sub.id);
        } else {
          result.failed += 1;
        }
      }
    }),
  );

  result.sent = okIds.length;
  result.removed = goneIds.length;

  // Bookkeeping is best effort; a failure here doesn't affect delivery.
  if (goneIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", goneIds);
  }
  if (okIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .update({ last_success_at: new Date().toISOString() })
      .in("id", okIds);
  }

  return result;
}
