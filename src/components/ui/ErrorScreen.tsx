// src/components/ui/ErrorScreen.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonClasses } from "./Button";
import { StatusFrame } from "./PublicShell";

export interface ErrorScreenProps {
  title: string;
  message: string;
  /** Next.js retry: re-fetches the failed segment. */
  onRetry: () => void;
  /** Server error id, shown small so a provider can quote it to support. */
  digest?: string;
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shared body for error.tsx files. Shows an offline-specific message when the
 * phone has no connection, since that's the most common cause here.
 */
export function ErrorScreen({
  title,
  message,
  onRetry,
  digest,
  homeHref,
  homeLabel = "Go back",
}: ErrorScreenProps) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    const timer = setTimeout(update, 0); // read after mount, not during render
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <section role="alert" className="flex flex-col items-center gap-3.5 pt-4 text-center">
      <StatusFrame icon={offline ? "expired" : "failed"} />
      <h1 className="font-heading text-[30px] text-ink">{offline ? "You're offline" : title}</h1>
      <p className="mx-auto max-w-xs text-base leading-normal text-muted">
        {offline
          ? "Check your signal or Wi-Fi. This page will work again once you're connected."
          : message}
      </p>
      <div className="mt-4 flex w-full flex-col gap-2.5">
        <Button size="lg" fullWidth onClick={onRetry}>
          Try again
        </Button>
        {homeHref && (
          <Link href={homeHref} className={buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })}>
            {homeLabel}
          </Link>
        )}
      </div>
      {digest && !offline && <p className="mt-2 text-sm text-muted">Error code {digest}</p>}
    </section>
  );
}
