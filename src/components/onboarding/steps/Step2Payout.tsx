"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { OnboardingData } from "../OnboardingWizard";
import type { AccountType } from "@/lib/types";

const BANKS = [
  "ABSA",
  "Capitec",
  "FNB",
  "Nedbank",
  "Standard Bank",
  "TymeBank",
  "African Bank",
  "Other",
];

interface Props {
  data: OnboardingData;
  onChange: (partial: Partial<OnboardingData>) => void;
  onBack: () => void;
  userId: string;
}

export function Step2Payout({ data, onChange, onBack, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validate based on payout method
    if (data.payoutMethod === "bank") {
      if (!data.bankName) {
        setError("Please select your bank.");
        return;
      }
      if (!data.accountNumber.trim()) {
        setError("Please enter your account number.");
        return;
      }
      if (!data.accountType) {
        setError("Please choose cheque or savings.");
        return;
      }
    }
    if (data.payoutMethod === "cashsend") {
      if (!data.cashsendPhone.trim()) {
        setError("Please enter your CashSend phone number.");
        return;
      }
      if (!data.cashsendBank) {
        setError("Please select your bank.");
        return;
      }
    }

    setLoading(true);

    const { error: insertError } = await supabase.from("providers").insert({
      user_id: userId,
      full_name: data.fullName,
      trade: data.trade,
      slug: data.slug,
      phone: data.phone || null,
      payout_method: data.payoutMethod,
      bank_name: data.payoutMethod === "bank" ? data.bankName : null,
      account_number: data.payoutMethod === "bank" ? data.accountNumber : null,
      account_type: data.payoutMethod === "bank" ? data.accountType : null,
      cashsend_phone:
        data.payoutMethod === "cashsend" ? data.cashsendPhone : null,
      cashsend_bank:
        data.payoutMethod === "cashsend" ? data.cashsendBank : null,
    });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique constraint — slug already taken
        setError(
          "That PayLink address is already taken. Go back and choose a different one.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5"
    >
      <h2 className="font-semibold text-gray-900 text-lg">
        How do you want to get paid?
      </h2>

      {/* Payout method toggle */}
      <div className="grid grid-cols-2 gap-2">
        {(["bank", "cashsend"] as const).map((method) => (
          <button
            key={method}
            type="button"
            onClick={() => onChange({ payoutMethod: method })}
            className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-colors ${
              data.payoutMethod === method
                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {method === "bank" ? "🏦 Bank account" : "📱 CashSend"}
          </button>
        ))}
      </div>

      {data.payoutMethod === "bank" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank
            </label>
            <select
              value={data.bankName}
              onChange={(e) => onChange({ bankName: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            >
              <option value="">Choose your bank…</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account number
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={data.accountNumber}
              onChange={(e) =>
                onChange({ accountNumber: e.target.value.replace(/\D/g, "") })
              }
              placeholder="1234567890"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["cheque", "savings"] as AccountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ accountType: type })}
                  className={`py-3 rounded-xl border-2 text-sm font-medium capitalize transition-colors ${
                    data.accountType === type
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {data.payoutMethod === "cashsend" && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            CashSend lets your customers send money to your phone number via
            their banking app. You then withdraw cash at an ATM.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone number customers send to
            </label>
            <input
              type="tel"
              value={data.cashsendPhone}
              onChange={(e) => onChange({ cashsendPhone: e.target.value })}
              placeholder="071 234 5678"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your bank
            </label>
            <select
              value={data.cashsendBank}
              onChange={(e) => onChange({ cashsendBank: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              required
            >
              <option value="">Choose your bank…</option>
              {["ABSA", "FNB", "Nedbank", "Standard Bank"].map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Only banks that support CashSend withdrawals.
            </p>
          </div>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-medium hover:border-gray-300 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-2 flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors"
        >
          {loading ? "Saving…" : "Finish setup"}
        </button>
      </div>
    </form>
  );
}
