// src/components/ui/PublicShell.tsx
// Layout for pages customers see (payment page, profile page). No app chrome:
// the wordmark, a "Secure" pill, the content and a quiet reassurance footer.
import type { ReactNode } from "react";
import { Wordmark } from "@/components/brand/Logo";

function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function PublicShell({
  children,
  footer = true,
}: {
  children: ReactNode;
  /** Hide the "money goes straight to" footer on message screens. */
  footer?: boolean;
}) {
  return (
    <main className="min-h-dvh bg-cream px-4 pt-[env(safe-area-inset-top)] pb-[calc(1.5rem+env(safe-area-inset-bottom))] print:min-h-0 print:bg-white print:p-0">
      <div className="mx-auto flex min-h-[calc(100dvh-1.5rem-env(safe-area-inset-top))] w-full max-w-md flex-col gap-4 print:block print:min-h-0 print:max-w-none">
        <header className="flex h-[60px] items-center justify-between print:hidden">
          <Wordmark className="text-2xl" />
          <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-jade-600">
            <LockIcon />
            Secure
          </span>
        </header>
        {children}
        {footer && (
          <footer className="mt-auto flex flex-col print:hidden items-center gap-1.5 pt-6 text-center text-sm text-muted">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <LockIcon />
              Secured by <strong className="font-bold text-jade">paylink</strong>
            </span>
            <span>No app or account needed</span>
          </footer>
        )}
      </div>
    </main>
  );
}

export type MessageIcon = "expired" | "paid" | "failed" | "missing";

/** The corner frame holding a status disc, as in the Brand Kit error screens. */
export function StatusFrame({ icon }: { icon: MessageIcon }) {
  const frame = icon === "paid" ? "var(--color-jade)" : "var(--color-slot)";
  const disc = {
    expired: "var(--color-expired-soft)",
    paid: "var(--color-paid-dot)",
    failed: "var(--color-failed-dot)",
    missing: "var(--color-expired-soft)",
  }[icon];
  return (
    <svg width="112" height="112" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 26V18a10 10 0 0 1 10-10h8M56 38v8a10 10 0 0 1-10 10h-8" fill="none" stroke={frame} strokeWidth="5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="15" fill={disc} />
      {icon === "paid" && (
        <path d="M25 32.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {icon === "failed" && (
        <path d="M32 25v9M32 39v.5" fill="none" stroke="#fff" strokeWidth="3.8" strokeLinecap="round" />
      )}
      {icon === "expired" && (
        <g fill="none" stroke="var(--color-expired)" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="32" cy="32" r="8" />
          <path d="M32 28v4.5l3 2" />
        </g>
      )}
      {icon === "missing" && (
        <path d="M29 28.5a3.2 3.2 0 1 1 4.4 3c-.9.4-1.4 1.1-1.4 2v.8M32 38.5v.3" fill="none" stroke="var(--color-expired)" strokeWidth="2.6" strokeLinecap="round" />
      )}
    </svg>
  );
}

/** Full-page message for customers: expired, paid, not found, errors. */
export function PublicMessage({
  title,
  icon = "missing",
  context,
  children,
  action,
}: {
  title: string;
  icon?: MessageIcon;
  /** Small card above the message naming the provider and the job. */
  context?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <PublicShell footer={false}>
      {context}
      <section className="flex flex-col items-center gap-3.5 pt-4 text-center">
        <StatusFrame icon={icon} />
        <h1 className="font-heading text-[30px] text-ink">{title}</h1>
        <div className="max-w-xs text-base leading-normal text-muted">{children}</div>
      </section>
      {action && <div className="mt-auto flex flex-col gap-2.5 pt-6">{action}</div>}
    </PublicShell>
  );
}
