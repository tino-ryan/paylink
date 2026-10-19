// src/app/dashboard/charge/loading.tsx
import { LoadingLabel, Skeleton } from "@/components/ui/Skeleton";

export default function ChargeLoading() {
  return (
    <div className="space-y-4">
      <LoadingLabel text="Opening the till" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-[132px] w-full rounded-4xl" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
