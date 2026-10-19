// src/components/ui/CopyRow.tsx
"use client";

import { useState } from "react";
import { CopyButton } from "./CopyButton";

export interface CopyRowProps {
  label: string;
  /** What's shown. */
  display: string;
  /** What's copied, if different from display (e.g. phone without spaces). */
  copy?: string;
  /** Bigger figures for the details customers must type (phone, reference). */
  large?: boolean;
}

/**
 * A detail the customer needs in their banking app: label above, value large,
 * Copy button on the right. The row lights up mint while "Copied" shows.
 */
export function CopyRow({ label, display, copy, large = false }: CopyRowProps) {
  const [copied, setCopied] = useState(false);
  const canCopy = copy !== undefined && copy !== "";

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl py-3 pr-2.5 pl-4 transition-colors ${
        copied ? "bg-mist shadow-[inset_0_0_0_2px_var(--color-jade-600)]" : "bg-cream"
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold text-muted">{label}</span>
        <span
          className={`truncate font-bold tabular-nums tracking-[0.02em] text-ink ${
            large ? "text-[23px] leading-tight" : "text-[19px] leading-snug"
          }`}
        >
          {display}
        </span>
      </div>
      {canCopy && <CopyButton value={copy} label={label.toLowerCase()} onCopiedChange={setCopied} />}
    </div>
  );
}
