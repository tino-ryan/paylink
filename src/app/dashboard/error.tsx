// src/app/dashboard/error.tsx
// Errors inside the signed-in app. Renders inside the dashboard layout, so the
// top bar and bottom navigation stay usable.
"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <ErrorScreen
      title="Couldn't load this page"
      message="Something went wrong on our side. Your jobs and payments are safe. Try again in a moment."
      onRetry={unstable_retry}
      digest={error.digest}
      homeHref="/dashboard"
      homeLabel="Back to jobs"
    />
  );
}
