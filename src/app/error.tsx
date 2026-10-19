// src/app/error.tsx
// Catch-all for pages outside the dashboard and payment pages (login, setup).
"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-dvh bg-cream px-4 pt-16">
      <div className="mx-auto max-w-md">
        <ErrorScreen
          title="Something went wrong"
          message="This page didn't load properly. Try again in a moment."
          onRetry={unstable_retry}
          digest={error.digest}
          homeHref="/login"
          homeLabel="Go to sign in"
        />
      </div>
    </main>
  );
}
