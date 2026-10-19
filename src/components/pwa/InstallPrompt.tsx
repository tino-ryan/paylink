// src/components/pwa/InstallPrompt.tsx
"use client";

import { LogoTile } from "@/components/brand/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { useEffect, useState, useSyncExternalStore } from "react";

/** Chrome/Android's install event. Not in TypeScript's DOM types yet. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "paylink:install-dismissed-until";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // ask again in 2 weeks

type Mode = "hidden" | "android" | "ios";

function isStandalone(): boolean {
  const iosStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return window.matchMedia("(display-mode: standalone)").matches || iosStandalone;
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ reports itself as a Mac; touch support gives it away.
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && navigator.maxTouchPoints > 1);
}

function isSnoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(DISMISS_KEY) ?? "0");
    return until > Date.now();
  } catch {
    return false; // storage blocked (private mode): just show it
  }
}

/** Nothing to subscribe to: these values don't change while the page is open. */
const noSubscription = () => () => {};

function shouldOffer(): boolean {
  return !isStandalone() && !isSnoozed();
}

/**
 * "Add PayLink to your home screen" card. Hidden once installed, or for two
 * weeks after "Not now".
 *  - Android/Chrome: a real Install button (uses the browser's install event).
 *  - iPhone: step-by-step Share → Add to Home Screen instructions, since
 *    Safari has no install button. Also required for push on iPhone.
 */
export function InstallPrompt() {
  // Read from the browser after hydration; the server always renders nothing,
  // so server and client HTML match.
  const offerIOS = useSyncExternalStore(
    noSubscription,
    () => isIOS() && shouldOffer(),
    () => false,
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Android/Chrome: wait for the browser to say the app is installable.
  useEffect(() => {
    if (isIOS() || !shouldOffer()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault(); // keep the browser's mini-bar from popping up
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDismissed(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function snooze() {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      // Storage blocked: it'll show again next visit, which is fine.
    }
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setDismissed(true);
  }

  const mode: Mode = dismissed ? "hidden" : offerIOS ? "ios" : deferred ? "android" : "hidden";

  if (mode === "hidden") return null;

  return (
    <div className="space-y-3 rounded-[22px] bg-white p-4 shadow-[inset_0_0_0_2px_var(--color-mint)]">
      <div className="flex items-start gap-3">
        <LogoTile size={44} />
        <div className="min-w-0">
          <p className="text-base font-bold text-ink">Add PayLink to your home screen</p>
          <p className="mt-0.5 text-sm text-muted">
            Opens like a normal app, and lets us alert you when customers pay.
          </p>
        </div>
      </div>

      {mode === "ios" && (
        <ol className="space-y-1.5 rounded-2xl bg-cream p-3.5 text-sm text-ink">
          <li>
            <span className="font-bold text-jade">1.</span> Tap the Share button{" "}
            <span aria-hidden="true">⬆️</span> at the bottom of Safari
          </li>
          <li>
            <span className="font-bold text-jade">2.</span> Scroll down and tap{" "}
            <span className="font-medium">Add to Home Screen</span>
          </li>
          <li>
            <span className="font-bold text-jade">3.</span> Tap{" "}
            <span className="font-medium">Add</span>, then open PayLink from your home screen
          </li>
        </ol>
      )}

      <div className="flex gap-2">
        {mode === "android" && (
          <button
            onClick={install}
            className={`flex-1 ${buttonClasses({ variant: "primary" })}`}
          >
            Install
          </button>
        )}
        <button
          onClick={snooze}
          className={`${mode === "android" ? "flex-1" : "w-full"} ${buttonClasses({ variant: "ghost" })}`}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
