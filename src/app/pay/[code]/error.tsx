// src/app/pay/[code]/error.tsx
// Errors on the customer payment page. Plain reassurance: nothing was charged.
"use client";

import { ErrorScreen } from "@/components/ui/ErrorScreen";
import { PublicShell } from "@/components/ui/PublicShell";

export default function PayError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <PublicShell>
      <ErrorScreen
        title="Couldn't open this payment"
        message="Nothing has been paid or charged. Try again, or ask for the link to be sent again."
        onRetry={unstable_retry}
        digest={error.digest}
      />
    </PublicShell>
  );
}
