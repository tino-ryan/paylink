"use client";

import { useState } from "react";
import { nameToSlug } from "@/lib/utils";
import type { OnboardingData } from "../OnboardingWizard";

const TRADES = [
  "Plumber",
  "Electrician",
  "Painter",
  "Tiler",
  "Carpenter",
  "Gardener",
  "Domestic worker",
  "Hairstylist",
  "Tutor",
  "Driver",
  "Mechanic",
  "Other",
];

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  onNext: () => void;
}

export function Step1Details({ data, onChange, onNext }: Props) {
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(name: string) {
    onChange({ fullName: name });
    if (!slugEdited) {
      onChange({ slug: nameToSlug(name) });
    }
  }

  function handleSlugChange(slug: string) {
    setSlugEdited(true);
    onChange({ slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, "") });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!data.fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!data.trade) {
      setError("Please choose your trade.");
      return;
    }
    if (!data.slug || data.slug.length < 3) {
      setError("Your link name must be at least 3 characters.");
      return;
    }

    onNext();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5"
    >
      <h2 className="font-semibold text-gray-900 text-lg">About you</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your full name
        </label>
        <input
          type="text"
          value={data.fullName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Sipho Dlamini"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          What do you do?
        </label>
        <select
          value={data.trade}
          onChange={(e) => onChange({ trade: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          required
        >
          <option value="">Choose your trade…</option>
          {TRADES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your PayLink address
        </label>
        <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
          <span className="bg-gray-50 px-3 py-3 text-sm text-gray-400 border-r border-gray-300 whitespace-nowrap">
            paylink.co.za/
          </span>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="sipho-plumbing"
            className="flex-1 px-3 py-3 text-base focus:outline-none bg-white"
            required
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          This is your permanent profile link. Lowercase letters, numbers,
          hyphens only.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp number{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="tel"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          placeholder="071 234 5678"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          We&apos;ll send you a WhatsApp when you get paid.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
      >
        Next →
      </button>
    </form>
  );
}
