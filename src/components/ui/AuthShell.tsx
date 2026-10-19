// src/components/ui/AuthShell.tsx
// Single-column layout for sign-in and setup screens.
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Logo";

export function AuthShell({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: ReactNode;
  /** Shown on the right of the top bar, e.g. "Step 1 of 2". */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-cream px-4 pt-[env(safe-area-inset-top)] pb-10">
      <div className="mx-auto w-full max-w-md">
        <div className="flex h-[60px] items-center justify-between">
          <Wordmark className="text-2xl" />
          {aside && <span className="text-sm font-semibold text-muted">{aside}</span>}
        </div>
        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <h1 className="font-heading text-[30px] text-ink">{title}</h1>
            {description && <p className="text-base leading-normal text-muted">{description}</p>}
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
