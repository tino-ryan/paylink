// src/app/dashboard/loading.tsx
// Shown instantly while a dashboard page loads. Shaped like the jobs screen.
import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <LoadingLabel text="Loading your jobs" />
      <div className="space-y-3 rounded-[22px] bg-white p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-44" />
        <Skeleton className="mt-2 h-4 w-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <div className="divide-y divide-line-soft rounded-[22px] bg-white">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
