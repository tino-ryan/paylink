// src/components/dashboard/CancelRequestButton.tsx
// "Cancel this link": for a wrong amount or a customer who changed their mind.
// Asks once before cancelling, because the customer's link stops working.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelCharge } from "@/app/dashboard/charge/actions";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Surface";

export function CancelRequestButton({ code }: { code: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const result = await cancelCharge(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="ghost" fullWidth onClick={() => setConfirming(true)}>
        Cancel this link
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 border-line bg-white p-4">
      <p className="text-[15px] text-ink">
        Your customer won&apos;t be able to pay with this link any more. You can always send a new
        one.
      </p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
          Keep it
        </Button>
        <Button variant="danger" onClick={cancel} loading={busy} loadingText="Cancelling…">
          Cancel link
        </Button>
      </div>
    </div>
  );
}
