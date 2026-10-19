// src/components/dashboard/StatusBadge.tsx
// Status pills: a coloured dot (or tick) plus a word, so status never relies
// on colour alone.
import type { RequestStatus } from "@/lib/types";

export interface StatusBadgeProps {
  status: RequestStatus;
  /** Customer tapped "I've sent the money" but the provider hasn't confirmed. */
  customerReported?: boolean;
  /** Longer label, e.g. "Waiting for payment" on the job page. */
  long?: boolean;
}

type Look = { label: string; longLabel: string; pill: string; dot: string };

const LOOKS: Record<"paid" | "reported" | "expired" | "waiting", Look> = {
  paid: { label: "Paid", longLabel: "Paid", pill: "bg-paid-soft text-paid", dot: "" },
  reported: {
    label: "Check bank",
    longLabel: "Customer says paid",
    pill: "bg-apricot-soft text-apricot-ink",
    dot: "bg-apricot",
  },
  expired: { label: "Expired", longLabel: "Link expired", pill: "bg-expired-soft text-expired", dot: "bg-expired-dot" },
  waiting: {
    label: "Waiting",
    longLabel: "Waiting for payment",
    pill: "bg-waiting-soft text-waiting",
    dot: "bg-waiting-dot",
  },
};

export function StatusBadge({ status, customerReported = false, long = false }: StatusBadgeProps) {
  const key =
    status === "paid" ? "paid" : customerReported ? "reported" : status === "expired" ? "expired" : "waiting";
  const look = LOOKS[key];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pr-2.5 pl-2 font-bold ${
        long ? "text-sm" : "text-[13px]"
      } ${look.pill}`}
    >
      {key === "paid" ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : (
        <span aria-hidden="true" className={`h-[7px] w-[7px] rounded-full ${look.dot}`} />
      )}
      {long ? look.longLabel : look.label}
    </span>
  );
}
