// src/components/dashboard/JobRow.tsx
import Link from "next/link";
import { effectiveStatus } from "@/lib/utils";
import { Money } from "@/components/ui/Surface";
import { StatusBadge } from "./StatusBadge";
import type { PaymentRequest } from "@/lib/types";

export type JobListItem = Pick<
  PaymentRequest,
  | "id"
  | "description"
  | "amount_cents"
  | "status"
  | "short_code"
  | "expires_at"
  | "created_at"
  | "customer_reported_paid_at"
  | "cancelled_at"
  | "customer_name"
>;

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Johannesburg",
  });

export function JobRow({ job }: { job: JobListItem }) {
  const status = effectiveStatus(job);
  const cancelled = status !== "paid" && job.cancelled_at !== null;
  const reported = status !== "paid" && !cancelled && job.customer_reported_paid_at !== null;

  return (
    <li>
      <Link
        href={`/dashboard/requests/${job.short_code}`}
        className="flex min-h-[74px] items-center gap-3 px-4 py-3.5 text-ink transition-colors hover:bg-cream/60 active:bg-cream focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-jade-600"
      >
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist font-display text-[15px] font-extrabold text-jade"
        >
          {job.description.trim()[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-ink">{job.description}</p>
          <p className="mt-0.5 text-sm text-muted">
            {formatDay(job.created_at)} · {job.customer_name ?? job.short_code}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Money cents={job.amount_cents} size="sm" className="text-ink" />
          <StatusBadge status={status} customerReported={reported} cancelled={cancelled} />
        </div>
      </Link>
    </li>
  );
}

/** A card holding a divided list of jobs. */
export function JobList({ jobs }: { jobs: JobListItem[] }) {
  return (
    <ul className="divide-y divide-line-soft overflow-hidden rounded-[22px] bg-white">
      {jobs.map((job) => (
        <JobRow key={job.id} job={job} />
      ))}
    </ul>
  );
}
