// src/components/ui/CopyButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export interface CopyButtonProps {
  value: string;
  /** What's being copied, for screen readers: "account number", "link". */
  label: string;
  className?: string;
  /** Called with true while the "Copied" state shows, so a parent row can highlight. */
  onCopiedChange?: (copied: boolean) => void;
}

const COPY_ICON = "M9 9h11v11H9zM5 15V6a2 2 0 0 1 2-2h8";
const CHECK_ICON = "M5 12.5l4.5 4.5L19 7.5";

/** Jade "Copy" button that flips to a white "Copied" tick for 2 seconds. */
export function CopyButton({ value, label, className = "", onCopiedChange }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    let next: "copied" | "failed";
    try {
      await navigator.clipboard.writeText(value);
      next = "copied";
    } catch {
      next = "failed";
    }
    setState(next);
    onCopiedChange?.(next === "copied");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setState("idle");
      onCopiedChange?.(false);
    }, 2000);
  }

  const copied = state === "copied";

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className={`inline-flex min-h-12 min-w-[92px] shrink-0 items-center justify-center gap-1.5 rounded-[14px] px-3.5 text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jade-600 ${
        copied ? "bg-white text-jade" : "bg-jade text-white hover:bg-jade-800 active:bg-jade-800"
      } ${className}`}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={copied ? 3 : 2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={copied ? CHECK_ICON : COPY_ICON} />
      </svg>
      <span aria-live="polite">
        {copied ? "Copied" : state === "failed" ? "Hold to copy" : "Copy"}
      </span>
    </button>
  );
}
