// src/components/dashboard/MarkPaidButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface MarkPaidButtonProps {
  code: string;
}

export function MarkPaidButton({ code }: MarkPaidButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleMarkPaid() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setError(null);

    // RLS lets a provider update only their own requests.
    // Expired requests can still be marked paid: money sometimes arrives late.
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("payment_requests")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("short_code", code)
      .in("status", ["pending", "expired"]);

    setLoading(false);

    if (updateError) {
      setError("Couldn't save that. Check your signal and try again.");
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <div className="flex gap-2">
          <button
            onClick={handleMarkPaid}
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
          >
            {loading ? "Saving…" : "Yes, I got the money"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={handleMarkPaid}
          className="w-full border-2 border-emerald-600 text-emerald-600 font-semibold py-3 rounded-xl text-sm hover:bg-emerald-50 transition-colors"
        >
          Mark as paid
        </button>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
    </div>
  );
}
