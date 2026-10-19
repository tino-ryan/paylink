// src/components/ui/Surface.tsx
// Layout building blocks: cards, page headers, notices.
import Link from "next/link";
import type { ReactNode } from "react";
import { formatRand } from "@/lib/utils";

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`rounded-[22px] bg-white ${padded ? "p-5" : ""} ${className}`}>
      {children}
    </section>
  );
}

/** Section heading inside a card. */
export function CardTitle({
  children,
  description,
}: {
  children: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink">{children}</h2>
      {description && <p className="mt-1 text-[15px] leading-normal text-muted">{description}</p>}
    </div>
  );
}

/** Heading for a group of cards on a page ("Your jobs", "How would you like to pay?"). */
export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink">
      {children}
    </h2>
  );
}

/** Round white back button with a label beside it, as in the Brand Kit screens. */
export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="group -ml-0.5 inline-flex min-h-11 items-center gap-2.5 rounded-full pr-2 text-[15px] font-semibold text-muted focus-visible:outline-3 focus-visible:outline-jade-600"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-jade transition-colors group-hover:bg-mist">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </span>
      {label}
    </Link>
  );
}

/** Title row for pages inside the dashboard, with an optional back link. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
}: {
  title: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="space-y-3">
      {backHref && <BackLink href={backHref} label={backLabel} />}
      <div className="space-y-2">
        <h1 className="font-heading text-[30px] text-ink">{title}</h1>
        {description && <p className="text-base leading-normal text-muted">{description}</p>}
      </div>
    </header>
  );
}

export type NoticeTone = "info" | "warning" | "error" | "success";

const TONES: Record<NoticeTone, { box: string; icon: string; path: string }> = {
  info: {
    box: "bg-mist text-jade",
    icon: "text-jade-600",
    path: "M12 8v.5M12 11v5.5",
  },
  warning: {
    box: "bg-waiting-soft text-waiting-ink",
    icon: "text-waiting",
    path: "M12 7.5v.5M12 11v5.5",
  },
  error: {
    box: "bg-failed-soft text-failed",
    icon: "text-failed",
    path: "M12 7.5v5.5M12 16.5v.5",
  },
  success: {
    box: "bg-paid-soft text-paid",
    icon: "text-paid",
    path: "M8 12.5l3 3 5-6",
  },
};

export function Notice({
  tone = "info",
  children,
  className = "",
}: {
  tone?: NoticeTone;
  children: ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-2.5 rounded-[20px] px-4 py-3.5 text-[15px] leading-[1.45] font-semibold ${t.box} ${className}`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`mt-px shrink-0 ${t.icon}`}
      >
        <circle cx="12" cy="12" r="9" />
        <path d={t.path} />
      </svg>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

/** Initials on apricot soft. `verified` adds the tick badge. */
export function Avatar({
  name,
  size = "md",
  verified = false,
  onJade = false,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  verified?: boolean;
  /** Badge ring matches a jade background instead of white. */
  onJade?: boolean;
}) {
  const dims = {
    sm: "h-10 w-10 text-[15px]",
    md: "h-11 w-11 text-[17px]",
    lg: "h-[60px] w-[60px] text-[22px]",
  }[size];
  return (
    <span aria-hidden="true" className="relative inline-flex shrink-0">
      <span
        className={`inline-flex items-center justify-center rounded-full bg-apricot-soft font-display font-extrabold tracking-[-0.02em] text-jade ${dims}`}
      >
        {initialsOf(name)}
      </span>
      {verified && (
        <span
          className={`absolute -right-[3px] -bottom-[3px] flex h-6 w-6 items-center justify-center rounded-full border-[3px] ${
            onJade ? "border-jade bg-apricot text-ink" : "border-white bg-jade text-white"
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      )}
    </span>
  );
}

/** Money in lists and sentences: plain "R 1 250.00", tabular figures. */
export function Money({
  cents,
  size = "md",
  className = "",
}: {
  cents: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  if (size === "lg" || size === "xl") {
    return <MoneyHero cents={cents} size={size === "xl" ? 52 : 36} className={className} />;
  }
  const sizes = {
    sm: "text-base font-bold",
    md: "text-xl font-bold",
  }[size];
  return (
    <span className={`whitespace-nowrap tabular-nums ${sizes} ${className}`}>{formatRand(cents)}</span>
  );
}

/**
 * The hero amount: Bricolage ExtraBold with a raised R and raised cents.
 * Screen readers get the plain "R 1 250.00".
 */
export function MoneyHero({
  cents,
  size = 52,
  className = "",
  centsClassName = "opacity-75",
}: {
  cents: number;
  /** Font size in px. */
  size?: number;
  className?: string;
  /** Colour for the raised cents (e.g. text-mint on jade). */
  centsClassName?: string;
}) {
  const full = formatRand(cents); // "R 1 250.00"
  const [rands, fraction] = full.replace(/^-?R /, "").split(".");
  const negative = cents < 0;
  return (
    <span
      className={`inline-block whitespace-nowrap font-display font-extrabold leading-none tracking-[-0.045em] ${className}`}
      style={{ fontSize: size }}
    >
      <span className="sr-only">{full}</span>
      <span aria-hidden="true">
        {negative && "-"}
        <span className="mr-[0.1em] align-[0.6em] text-[0.55em]">R</span>
        {rands.replace(/ /g, "\u00a0")}
        <span className={`align-[0.6em] text-[0.55em] ${centsClassName}`}>.{fraction}</span>
      </span>
    </span>
  );
}
