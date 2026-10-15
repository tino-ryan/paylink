// src/components/pay/StaticProfilePage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerRequest } from "@/app/[slug]/actions";
import { formatRand, MIN_AMOUNT_CENTS, parseRandInput } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types";

export interface StaticProfilePageProps {
  profile: PublicProfile;
}

export function StaticProfilePage({ profile }: StaticProfilePageProps) {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = parseRandInput(amountInput);

  const initials = profile.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please describe what you're paying for.");
      return;
    }
    if (amountCents === null || amountCents < MIN_AMOUNT_CENTS) {
      setError("Please enter an amount of at least R 1.00.");
      return;
    }

    setLoading(true);
    try {
      const result = await createCustomerRequest(
        profile.slug,
        description,
        amountInput,
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/pay/${result.data.shortCode}`);
    } catch {
      setError("We couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile.full_name}</p>
              <p className="text-sm text-gray-400">{profile.trade}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4"
        >
          <p className="text-sm font-medium text-gray-700">
            What are you paying for?
          </p>

          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Haircut, garden cleanup, plumbing"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            maxLength={100}
          />

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
            <p className="text-sm text-emerald-600 font-medium">
              {formatRand(amountCents)}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors"
          >
            {loading ? "Setting up payment…" : "Continue to payment"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Powered by PayLink · No app needed
        </p>
      </div>
    </main>
  );
}
