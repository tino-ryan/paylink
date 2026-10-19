// src/components/pwa/PushToggle.tsx
"use client";

import { buttonClasses } from "@/components/ui/Button";
import { useEffect, useState } from "react";
import {
  removePushSubscription,
  savePushSubscription,
  sendTestPush,
} from "@/app/dashboard/push-actions";

type State =
  | "loading"
  | "unsupported"
  | "ios-install" // iPhone in Safari: push needs the home-screen app
  | "denied"
  | "off"
  | "on";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function isStandalone(): boolean {
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

/** navigator.serviceWorker.ready, but gives up after 8s instead of hanging. */
function serviceWorkerReady(): Promise<ServiceWorkerRegistration> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("service worker not ready")), 8000),
    ),
  ]);
}

function toServerShape(sub: PushSubscription) {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
  };
}

export interface PushToggleProps {
  /** Show the "Send test alert" button when alerts are on. */
  showTest?: boolean;
  /** Dashboard mode: render nothing once alerts are on, or if unsupported. */
  hideWhenDone?: boolean;
}

export function PushToggle({ showTest = false, hideWhenDone = false }: PushToggleProps) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const supported =
        window.isSecureContext &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        if (!cancelled) setState(isIOS() && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }

      const registration = await serviceWorkerReady();
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        // Re-save quietly so the server copy stays in sync (e.g. after the
        // row was cleaned up). Failure is harmless: the toggle still shows on.
        await savePushSubscription(toServerShape(existing), navigator.userAgent).catch(
          () => undefined,
        );
      }
      if (!cancelled) setState(existing ? "on" : "off");
    }

    check().catch(() => {
      if (!cancelled) setState("unsupported");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setMessage({ kind: "error", text: "Payment alerts aren't set up on the server yet." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }

      const registration = await serviceWorkerReady();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const result = await savePushSubscription(
        toServerShape(subscription),
        navigator.userAgent,
      );
      if (!result.ok) {
        await subscription.unsubscribe().catch(() => undefined);
        setMessage({ kind: "error", text: result.error });
        return;
      }
      setState("on");
    } catch {
      setMessage({
        kind: "error",
        text: "Couldn't turn on alerts. Check your signal and try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      const registration = await serviceWorkerReady();
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setMessage({ kind: "error", text: "Couldn't turn off alerts. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await sendTestPush();
      setMessage(
        result.ok
          ? { kind: "ok", text: "Test alert sent. It should appear in a few seconds." }
          : { kind: "error", text: result.error },
      );
    } catch {
      setMessage({ kind: "error", text: "Couldn't send the test. Check your signal." });
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;
  if (hideWhenDone && !message && (state === "on" || state === "unsupported")) return null;

  return (
    <div className="space-y-3 rounded-[22px] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-mist text-jade">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2 2 0 0 0 4 0" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold text-ink">Payment alerts</p>
          <p className="mt-0.5 text-sm text-muted">
            {state === "on" && "On — your phone will buzz when a customer says they've paid."}
            {state === "off" && "Get a notification the moment a customer says they've paid."}
            {state === "ios-install" &&
              "On iPhone, add PayLink to your home screen first, then open it from there to turn on alerts."}
            {state === "denied" &&
              "Notifications are blocked for PayLink. Allow them in your phone's settings for this site, then come back."}
            {state === "unsupported" &&
              "This browser can't show alerts. Try Chrome on Android, or the home-screen app on iPhone."}
          </p>
        </div>
      </div>

      {(state === "off" || state === "on") && (
        <div className="flex gap-2">
          {state === "off" ? (
            <button
              onClick={turnOn}
              disabled={busy}
              className={`flex-1 ${buttonClasses({ variant: "primary" })}`}
            >
              {busy ? "Turning on…" : "Turn on alerts"}
            </button>
          ) : (
            <>
              {showTest && (
                <button
                  onClick={test}
                  disabled={busy}
                  className={`flex-1 ${buttonClasses({ variant: "secondary" })}`}
                >
                  Send test alert
                </button>
              )}
              <button
                onClick={turnOff}
                disabled={busy}
                className={`${showTest ? "flex-1" : "w-full"} ${buttonClasses({ variant: "ghost" })}`}
              >
                Turn off
              </button>
            </>
          )}
        </div>
      )}

      {message && (
        <p
          className={`rounded-[14px] px-3.5 py-2.5 text-sm font-semibold ${
            message.kind === "ok" ? "bg-paid-soft text-paid" : "bg-failed-soft text-failed"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
