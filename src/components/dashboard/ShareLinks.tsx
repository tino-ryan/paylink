// src/components/dashboard/ShareLinks.tsx
// WhatsApp share + copy link, used for both job links and the profile link.
"use client";

import { useEffect, useRef, useState } from "react";
import { buttonClasses } from "@/components/ui/Button";

const CHAT_ICON = "M4 19l1.5-4A8 8 0 1 1 9 18.5z";
const COPY_ICON = "M9 9h11v11H9zM5 15V6a2 2 0 0 1 2-2h8";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7.5";

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export interface ShareLinksProps {
  url: string;
  /** Text sent with the link on WhatsApp. The URL is appended. */
  message: string;
}

export function ShareLinks({ url, message }: ShareLinksProps) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`;
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  const copied = state === "copied";

  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses({ variant: "whatsapp", size: "lg", fullWidth: true })}
      >
        <Icon d={CHAT_ICON} />
        Send on WhatsApp
      </a>
      <button
        type="button"
        onClick={copy}
        className={`${buttonClasses({ variant: "secondary", size: "lg", fullWidth: true })} ${
          copied ? "border-jade-600! bg-mist!" : ""
        }`}
      >
        <Icon d={copied ? CHECK_ICON : COPY_ICON} />
        <span aria-live="polite">
          {copied ? "Link copied" : state === "failed" ? "Couldn't copy. Hold the link to copy" : "Copy link"}
        </span>
      </button>
      {state === "failed" && (
        <p className="break-all rounded-2xl bg-white px-4 py-3 text-center text-[15px] font-semibold text-ink select-all">
          {url}
        </p>
      )}
    </div>
  );
}
