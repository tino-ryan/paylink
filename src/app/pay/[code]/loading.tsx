// src/app/pay/[code]/loading.tsx
import { PublicShell } from "@/components/ui/PublicShell";
import { LoadingLabel, Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function PayLoading() {
  return (
    <PublicShell>
      <LoadingLabel text="Loading payment" />
      <div className="space-y-4 rounded-[22px] bg-white p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <SkeletonCard lines={4} />
      <Skeleton className="h-14 w-full rounded-2xl" />
    </PublicShell>
  );
}
