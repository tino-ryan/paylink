// src/components/ui/Button.tsx
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "danger"
  | "whatsapp";
export type ButtonSize = "md" | "lg";

// Big, soft, tactile: solid buttons carry a darker bottom edge (inset shadow)
// so they read as pressable in bright sun.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-jade text-white shadow-[inset_0_-3px_0_var(--color-jade-900)] hover:bg-jade-800 active:bg-jade-800 active:shadow-none disabled:bg-jade/50 disabled:shadow-none",
  // Apricot: the one main action on a screen (e.g. "New payment request").
  accent:
    "bg-apricot text-ink shadow-[inset_0_-3px_0_var(--color-apricot-deep)] hover:brightness-95 active:shadow-none disabled:opacity-50",
  secondary:
    "bg-white text-jade border-2 border-jade hover:bg-mist active:bg-mint disabled:border-line disabled:text-muted",
  ghost: "text-jade-600 hover:bg-mist active:bg-mint disabled:text-muted/50",
  danger:
    "bg-failed-dot text-white shadow-[inset_0_-3px_0_var(--color-failed-deep)] hover:bg-failed active:shadow-none disabled:opacity-50",
  // Same as primary: the brand, not WhatsApp's green, carries the action.
  whatsapp:
    "bg-jade text-white shadow-[inset_0_-3px_0_var(--color-jade-900)] hover:bg-jade-800 active:bg-jade-800 active:shadow-none",
};

const SIZES: Record<ButtonSize, string> = {
  md: "min-h-12 px-4 text-[15px] rounded-[14px]",
  lg: "min-h-14 px-5 text-[17px] rounded-2xl",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
} = {}): string {
  return [
    "inline-flex items-center justify-center gap-2 font-bold",
    "transition select-none disabled:cursor-not-allowed",
    "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jade-600",
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? "w-full" : "",
  ].join(" ");
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-[18px] w-[18px] animate-spin motion-reduce:animate-none ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--color-apricot)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows a spinner, disables the button and swaps the label. */
  loading?: boolean;
  loadingText?: string;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingText,
  disabled,
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}
      {...rest}
    >
      {loading && <Spinner />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

export interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={`${buttonClasses({ variant, size, fullWidth })} ${className}`}>
      {children}
    </Link>
  );
}
