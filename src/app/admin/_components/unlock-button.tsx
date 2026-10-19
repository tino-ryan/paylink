// src/app/admin/_components/unlock-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { unlockPhone } from "../actions";

export function UnlockButton({ phone }: { phone: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    setLoading(true);
    setError(null);
    try {
      const result = await unlockPhone(phone);
      if (!result.ok) setError(result.error);
      else router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      {error && <span className="text-sm text-failed">{error}</span>}
      <Button variant="secondary" onClick={unlock} loading={loading} loadingText="Unlocking…">
        Unlock
      </Button>
    </span>
  );
}
