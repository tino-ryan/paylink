// src/components/dashboard/StatusBadge.tsx
import type { RequestStatus } from "@/lib/types";

export interface StatusBadgeProps {
  status: RequestStatus;
  /** Customer tapped "I've sent the money" but the provider hasn't confirmed. */
  customerReported?: boolean;
}

export function StatusBadge({ status, customerReported = false }: StatusBadgeProps) {
  const base = "text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap";

  if (status === "paid") {
    return <span className={`${base} bg-emerald-100 text-emerald-800`}>Paid</span>;
  }
  if (customerReported) {
    return <span className={`${base} bg-sky-100 text-sky-800`}>Check bank</span>;
  }
  if (status === "expired") {
    return <span className={`${base} bg-gray-100 text-gray-500`}>Expired</span>;
  }
  return <span className={`${base} bg-amber-100 text-amber-800`}>Pending</span>;
}
