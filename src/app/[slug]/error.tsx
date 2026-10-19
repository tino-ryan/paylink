// src/app/[slug]/error.tsx
"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";
import { PublicShell } from "@/components/ui/PublicShell";

export default function ProfileError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <PublicShell>
      <ErrorScreen
        title="Couldn't open this page"
        message="Nothing has been paid or charged. Try again in a moment."
        onRetry={unstable_retry}
        digest={error.digest}
      />
    </PublicShell>
  );
}
