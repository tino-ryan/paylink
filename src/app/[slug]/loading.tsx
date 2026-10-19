// src/app/[slug]/loading.tsx
import { PublicShell } from "@/components/ui/PublicShell";
import { LoadingLabel, Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <PublicShell>
      <LoadingLabel />
      <div className="flex items-center gap-3 rounded-[22px] bg-white p-5">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonCard lines={3} />
    </PublicShell>
  );
}
