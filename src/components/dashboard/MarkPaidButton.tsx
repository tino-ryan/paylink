// src/components/dashboard/MarkPaidButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PaidMethod } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Surface";

export interface MarkPaidButtonProps {
  code: string;
  amountLabel: string;
}

const METHODS: { value: PaidMethod; label: string }[] = [
  { value: "eft", label: "Bank transfer" },
  { value: "cashsend", label: "CashSend" },
  { value: "cash", label: "Cash" },
];

/**
 * "Mark as paid", then one tap for how they paid. The method goes on the
 * customer's receipt; the database adds the receipt number.
 */
export function MarkPaidButton({ code, amountLabel }: MarkPaidButtonProps) {
  const [saving, setSaving] = useState<PaidMethod | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function markPaid(method: PaidMethod) {
    setSaving(method);
    setError(null);

    // RLS lets a provider update only their own requests.
    // Expired requests can still be marked paid: money sometimes arrives late.
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("payment_requests")
      .update({ status: "paid", paid_at: new Date().toISOString(), paid_method: method })
      .eq("short_code", code)
      .in("status", ["pending", "expired"]);

    setSaving(null);

    if (updateError) {
      setError("Couldn't save that. Check your signal and try again.");
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {confirming ? (
        <div className="space-y-3">
          <p className="text-base font-semibold text-ink">
            How did you get the {amountLabel}?
          </p>
          <p className="text-sm text-muted">Only confirm once you&apos;ve seen the money. It goes on their receipt.</p>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((method) => (
              <Button
                key={method.value}
                onClick={() => markPaid(method.value)}
                loading={saving === method.value}
                disabled={saving !== null && saving !== method.value}
                className="px-2"
              >
                {method.label}
              </Button>
            ))}
          </div>
          <Button variant="ghost" fullWidth onClick={() => setConfirming(false)} disabled={saving !== null}>
            Not yet
          </Button>
        </div>
      ) : (
        <Button variant="secondary" fullWidth onClick={() => setConfirming(true)}>
          Mark as paid
        </Button>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
