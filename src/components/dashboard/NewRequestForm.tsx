// src/components/dashboard/NewRequestForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formatRand,
  generateCashSendReference,
  generateShortCode,
  MAX_AMOUNT_CENTS,
  MIN_AMOUNT_CENTS,
  parseRandInput,
  UNIQUE_VIOLATION,
} from "@/lib/utils";

export interface NewRequestFormProps {
  providerId: string;
}

const SHORT_CODE_ATTEMPTS = 3;

export function NewRequestForm({ providerId }: NewRequestFormProps) {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = parseRandInput(amountInput);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanDescription = description.trim();
    if (!cleanDescription) {
      setError("Please describe the job.");
      return;
    }
    if (amountCents === null || amountCents < MIN_AMOUNT_CENTS) {
      setError("Please enter an amount of at least R 1.00.");
      return;
    }
    if (amountCents > MAX_AMOUNT_CENTS) {
      setError("That amount is too large for a payment link.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Retry with a fresh code if the random one already exists.
    for (let attempt = 0; attempt < SHORT_CODE_ATTEMPTS; attempt++) {
      const shortCode = generateShortCode();
      const { error: insertError } = await supabase.from("payment_requests").insert({
        provider_id: providerId,
        description: cleanDescription,
        amount_cents: amountCents,
        short_code: shortCode,
        cashsend_reference: generateCashSendReference(cleanDescription, shortCode),
      });

      if (!insertError) {
        router.push(`/dashboard/requests/${shortCode}`);
        return;
      }
      if (insertError.code !== UNIQUE_VIOLATION) break;
    }

    setLoading(false);
    setError("Couldn't create the link. Check your signal and try again.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What&apos;s the job?
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Geyser repair, haircut, garden cleanup"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              R
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {amountCents !== null && amountCents >= MIN_AMOUNT_CENTS && (
            <p className="text-sm text-emerald-600 mt-1 font-medium">
              {formatRand(amountCents)}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors text-base"
      >
        {loading ? "Creating…" : "Create payment link"}
      </button>

      <button
        type="button"
        onClick={() => router.back()}
        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
      >
        Cancel
      </button>
    </form>
  );
}
