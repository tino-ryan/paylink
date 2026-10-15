// src/components/pay/PaymentOptions.tsx
"use client";

import { useState } from "react";
import { reportPaymentSent } from "@/app/pay/actions";
import { formatRand } from "@/lib/utils";
import type { PublicPayoutDetails, PublicRequest } from "@/lib/types";

export interface PaymentOptionsProps {
  provider: PublicPayoutDetails;
  request: PublicRequest;
}

type Tab = "eft" | "cashsend";

interface DetailRow {
  label: string;
  value: string;
  copyable: boolean;
}

export function PaymentOptions({ provider, request }: PaymentOptionsProps) {
  const firstName = provider.full_name.split(" ")[0];
  const hasEft = Boolean(provider.bank_name && provider.account_number);
  const hasCashSend = Boolean(provider.cashsend_phone);

  const tabs: { key: Tab; label: string }[] = [
    ...(hasCashSend ? [{ key: "cashsend" as const, label: "CashSend" }] : []),
    ...(hasEft ? [{ key: "eft" as const, label: "EFT" }] : []),
  ];

  const [tab, setTab] = useState<Tab | null>(
    provider.payout_method === "cashsend" && hasCashSend
      ? "cashsend"
      : (tabs[0]?.key ?? null),
  );
  const [copied, setCopied] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [reported, setReported] = useState(
    request.customer_reported_paid_at !== null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // EFT reference = the CashSend reference (e.g. GEY-ABC123), so the
  // provider can match the deposit on their statement to this job.
  const reference = request.cashsend_reference ?? request.short_code;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("Couldn't copy. Press and hold the text to copy it instead.");
    }
  }

  async function handleReport() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await reportPaymentSent(request.short_code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReported(true);
    } catch {
      setError("We couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (reported) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
        <p className="text-4xl">🙌</p>
        <p className="font-semibold text-gray-900">Thanks — we&apos;ve told {firstName}</p>
        <p className="text-sm text-gray-500">
          {firstName} will confirm once the money shows in their account. You
          can close this page.
        </p>
      </div>
    );
  }

  if (tabs.length === 0 || tab === null) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-600">
          {firstName} hasn&apos;t added payment details yet. Ask them how
          they&apos;d like to be paid.
        </p>
      </div>
    );
  }

  const eftRows: DetailRow[] = [
    { label: "Bank", value: provider.bank_name ?? "", copyable: false },
    { label: "Account holder", value: provider.full_name, copyable: false },
    { label: "Account number", value: provider.account_number ?? "", copyable: true },
    { label: "Account type", value: provider.account_type ?? "", copyable: false },
    { label: "Reference", value: reference, copyable: true },
    { label: "Amount", value: formatRand(request.amount_cents), copyable: true },
  ];

  const cashSendRows: DetailRow[] = [
    { label: "Send to", value: provider.cashsend_phone ?? "", copyable: true },
    { label: "Reference", value: reference, copyable: true },
    { label: "Amount", value: formatRand(request.amount_cents), copyable: true },
  ];

  const rows = tab === "eft" ? eftRows : cashSendRows;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {tabs.length > 1 && (
          <div className="flex border-b border-gray-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-3 min-h-11 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "text-emerald-700 border-b-2 border-emerald-600"
                    : "text-gray-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 space-y-4">
          {tab === "eft" && (
            <p className="text-sm text-gray-500">
              Do an EFT to this account. Use the reference below so {firstName}{" "}
              knows it&apos;s from you.
            </p>
          )}

          {tab === "cashsend" && request.amount_cents > 100000 && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Some banks limit CashSend to R 1 000. For larger amounts, use EFT
              instead.
            </p>
          )}

          <div>
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-3 py-2 border-b border-gray-50"
              >
                <span className="text-xs text-gray-400 shrink-0">{row.label}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate capitalize">
                    {row.value}
                  </span>
                  {row.copyable && (
                    <button
                      onClick={() => copy(row.value, row.label)}
                      className="text-xs text-emerald-600 font-medium px-2 py-2 -my-2"
                    >
                      {copied === row.label ? "✓" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {tab === "eft" && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Normal EFTs can take 1–2 business days to clear. Instant payment
              from your banking app is faster if your bank offers it.
            </p>
          )}

          {tab === "cashsend" && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-700">How to send CashSend:</p>
              {[
                "Open your banking app",
                "Go to Payments → CashSend (or Send Cash)",
                "Enter the number and amount above",
                "Use the reference shown above",
                `You'll get a PIN — WhatsApp it to ${firstName}`,
              ].map((step, i) => (
                <p key={step} className="text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{i + 1}.</span> {step}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      {confirming ? (
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900">
            Have you sent {formatRand(request.amount_cents)} to {firstName}?
          </p>
          <p className="text-xs text-gray-400">
            Only tap yes once the payment has gone through in your banking app.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReport}
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {loading ? "Sending…" : "Yes, I've sent it"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl text-sm"
            >
              Not yet
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleReport}
          className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl hover:bg-emerald-700 transition-colors"
        >
          I&apos;ve sent the money
        </button>
      )}
    </div>
  );
}
