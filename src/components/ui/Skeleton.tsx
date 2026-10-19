// src/components/ui/Skeleton.tsx
// Sand-coloured placeholder blocks shown while a page loads on a slow connection.

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-sand motion-reduce:animate-none ${className}`}
    />
  );
}

/** Screen-reader announcement paired with skeletons. */
export function LoadingLabel({ text = "Loading" }: { text?: string }) {
  return (
    <p role="status" className="sr-only">
      {text}…
    </p>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 rounded-[22px] bg-white p-5">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
