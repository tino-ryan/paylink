// src/app/dashboard/requests/[code]/loading.tsx
import { LoadingLabel, Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function RequestLoading() {
  return (
    <div className="space-y-5">
      <LoadingLabel text="Loading job" />
      <Skeleton className="h-8 w-2/3" />
      <div className="space-y-3 rounded-[22px] bg-white p-5">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <SkeletonCard lines={2} />
      <div className="flex justify-center rounded-[22px] bg-white p-5">
        <Skeleton className="h-52 w-52" />
      </div>
    </div>
  );
}
