// src/components/pay/PaymentOptions.tsx
"use client";

import { useState } from "react";
import { reportPaymentSent } from "@/app/pay/actions";
import { centsToPlainAmount, formatRand } from "@/lib/utils";
import { formatSAPhone } from "@/lib/validation";
import type { PublicPayoutDetails, PublicRequest } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { CopyRow } from "@/components/ui/CopyRow";
import { Notice, SectionTitle } from "@/components/ui/Surface";

export interface PaymentOptionsProps {
  provider: PublicPayoutDetails;
  request: PublicRequest;
}

type Tab = "eft" | "cashsend";

interface DetailRow {
  label: string;
  /** What's shown. */
  display: string;
  /** What's copied, if different from display (e.g. phone without spaces). */
  copy?: string;
}

function DetailRows({ rows, large = false }: { rows: DetailRow[]; large?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[22px] bg-white p-1.5">
      {rows.map((row) => (
        <CopyRow key={row.label} label={row.label} display={row.display} copy={row.copy} large={large} />
      ))}
    </div>
  );
}

const ICONS: Record<Tab, string> = {
  eft: "M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18",
  cashsend: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2",
};

/** How to find CashSend in each bank's app. Shown as step 1. */
const CASHSEND_FIRST_STEP: Record<string, string> = {
  FNB: "Open the FNB App and tap Send Money, then eWallet.",
  Capitec: "Open the Capitec app, tap Transact, then Cash Send.",
  ABSA: "Open the Absa app, tap Pay, then CashSend.",
  "Standard Bank": "Open the Standard Bank app, tap Transact, then Instant Money.",
  Nedbank: "Open the Nedbank Money app, tap Pay, then Send-iMali.",
};
const CASHSEND_BANK_NAMES = Object.keys(CASHSEND_FIRST_STEP);

/** Numbered steps on a jade rail; the last dot is apricot. */
function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col rounded-[22px] bg-white px-[18px] py-5">
      {steps.map((text, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={i} className="flex gap-3.5">
            <div className="flex shrink-0 flex-col items-center">
              <span
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-extrabold ${
                  last ? "bg-apricot text-ink" : "bg-jade text-white"
                }`}
              >
                {i + 1}
              </span>
              {!last && <span aria-hidden="true" className="min-h-4 w-0.5 flex-1 bg-mint" />}
            </div>
            <span className={`pt-1 text-base leading-[1.45] text-ink ${last ? "" : "pb-[18px]"}`}>{text}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function PaymentOptions({ provider, request }: PaymentOptionsProps) {
  const firstName = provider.full_name.split(" ")[0];
  const hasEft = Boolean(provider.bank_name && provider.account_number);
  const hasCashSend = Boolean(provider.cashsend_phone);

  const tabs: { key: Tab; label: string; sub: string }[] = [
    ...(hasEft
      ? [{ key: "eft" as const, label: "Bank transfer", sub: "Normal EFT · 1–2 working days" }]
      : []),
    ...(hasCashSend
      ? [{ key: "cashsend" as const, label: "CashSend", sub: "Send cash to a phone number" }]
      : []),
  ];

  const [tab, setTab] = useState<Tab | null>(
    provider.payout_method === "cashsend" && hasCashSend ? "cashsend" : (tabs[0]?.key ?? null),
  );
  const [bank, setBank] = useState<string>("Capitec");
  const [confirming, setConfirming] = useState(false);
  const [reported, setReported] = useState(request.customer_reported_paid_at !== null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The same reference (e.g. GEY-ABC123) for EFT and CashSend, so the provider
  // can match the payment on their statement or SMS to this job.
  const reference = request.cashsend_reference ?? request.short_code;
  const amount = formatRand(request.amount_cents);
  const amountPlain = centsToPlainAmount(request.amount_cents);

  async function report() {
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
      <section className="flex flex-col items-center gap-3 rounded-[22px] bg-white px-5 py-7 text-center">
        <svg width="88" height="88" viewBox="0 0 64 64" aria-hidden="true">
          <path d="M8 26V18a10 10 0 0 1 10-10h8M56 38v8a10 10 0 0 1-10 10h-8" fill="none" stroke="var(--color-jade)" strokeWidth="5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="15" fill="var(--color-paid-dot)" />
          <path d="M25 32.5l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="font-heading text-[26px] text-ink">Thank you! We&apos;ve told {firstName}</h2>
        <p className="text-[15px] leading-normal text-muted">
          {firstName} will confirm once the money shows in their account. You can close this page.
        </p>
      </section>
    );
  }

  if (tab === null) {
    return (
      <Notice tone="warning">
        {firstName} hasn&apos;t added payment details yet. Ask them how they&apos;d like to be paid.
      </Notice>
    );
  }

  const eftRows: DetailRow[] = [
    { label: "Bank", display: provider.bank_name ?? "" },
    { label: "Account name", display: provider.full_name, copy: provider.full_name },
    {
      label: "Account number",
      display: provider.account_number ?? "",
      copy: provider.account_number ?? "",
    },
    {
      label: "Account type",
      display: provider.account_type === "savings" ? "Savings" : "Cheque",
    },
    { label: "Reference", display: reference, copy: reference },
    { label: "Amount", display: amount, copy: amountPlain },
  ];

  const cashSendRows: DetailRow[] = [
    {
      label: "Send to",
      display: formatSAPhone(provider.cashsend_phone ?? ""),
      copy: provider.cashsend_phone ?? "",
    },
    { label: "Reference", display: reference, copy: reference },
    { label: "Amount", display: amount, copy: amountPlain },
  ];

  const cashSendSteps = [
    CASHSEND_FIRST_STEP[bank] ?? "Open your banking app and find CashSend (or Send Cash).",
    `Enter ${formatSAPhone(provider.cashsend_phone ?? "")} as the number.`,
    `Enter ${amount} as the amount and ${reference} as the reference.`,
    `You'll get a PIN. WhatsApp it to ${firstName} so they can collect the cash.`,
  ];

  return (
    <div className="flex flex-col gap-4">
      {tabs.length > 1 && (
        <>
          <div className="mt-2">
            <SectionTitle id="pay-how">How would you like to pay?</SectionTitle>
          </div>
          <div role="radiogroup" aria-labelledby="pay-how" className="flex flex-col gap-2.5">
            {tabs.map((t) => {
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTab(t.key)}
                  className={`flex min-h-[76px] items-center gap-3 rounded-[18px] border-2 p-3.5 text-left transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jade-600 ${
                    on ? "border-jade bg-mist" : "border-transparent bg-white shadow-[0_1px_0_var(--color-line)]"
                  }`}
                >
                  <span
                    className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] ${
                      on ? "bg-jade text-white" : "bg-mist text-jade"
                    }`}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={ICONS[t.key]} />
                    </svg>
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[17px] font-bold text-ink">{t.label}</span>
                    <span className="text-sm text-muted">{t.sub}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                      on ? "border-jade bg-jade" : "border-slot"
                    }`}
                  >
                    {on && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "eft" ? (
        <section aria-label="Pay by bank transfer" className="flex flex-col gap-4">
          <div className="space-y-1.5 px-1 pt-2">
            <h2 className="font-heading text-[26px] text-ink">Pay by bank transfer</h2>
            <p className="text-base leading-normal text-muted">
              Add {firstName} as a once-off payment in your banking app. Use the reference so they
              know it&apos;s from you.
            </p>
          </div>
          <DetailRows rows={eftRows} />
          <p className="flex gap-2.5 px-1 text-[15px] leading-normal text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span>
              Between different banks this can take 1–2 working days. Choose instant payment in
              your banking app if it&apos;s offered.
            </span>
          </p>
        </section>
      ) : (
        <section aria-label="Send with CashSend" className="flex flex-col gap-4">
          <div className="space-y-1.5 px-1 pt-2">
            <h2 className="font-heading text-[26px] text-ink">Send with CashSend</h2>
            <p className="text-base leading-normal text-muted">
              Use your banking app to send cash to {firstName}&apos;s phone. It takes about 2
              minutes.
            </p>
          </div>
          {request.amount_cents > 100000 && (
            <Notice tone="warning">
              Some banks limit CashSend to R&nbsp;1&nbsp;000. For larger amounts, use EFT instead.
            </Notice>
          )}
          <DetailRows rows={cashSendRows} large />

          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-2.5 font-display text-[21px] font-bold tracking-[-0.02em] text-ink">
              Which bank do you use?
            </legend>
            <div className="flex flex-wrap gap-2">
              {CASHSEND_BANK_NAMES.map((name) => {
                const on = name === bank;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setBank(name)}
                    className={`min-h-12 rounded-[14px] border-2 px-3.5 text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jade-600 ${
                      on ? "border-jade bg-jade text-white" : "border-line bg-white text-ink"
                    }`}
                  >
                    {name === "ABSA" ? "Absa" : name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <Steps steps={cashSendSteps} />
        </section>
      )}

      {error && <Notice tone="error">{error}</Notice>}

      {confirming ? (
        <section className="flex flex-col gap-3 rounded-[22px] bg-white p-5">
          <p className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink">
            Have you sent {amount} to {firstName}?
          </p>
          <p className="text-[15px] text-muted">Only say yes once the payment has gone through.</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="lg" onClick={() => setConfirming(false)} disabled={loading}>
              Not yet
            </Button>
            <Button size="lg" onClick={report} loading={loading} loadingText="Sending…">
              Yes, sent
            </Button>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-2.5 pt-2">
          <Button size="lg" fullWidth onClick={() => setConfirming(true)}>
            I&apos;ve sent the money
          </Button>
          <p className="text-center text-sm text-muted">Tap this once you have paid, and we’ll let {firstName} know.</p>
        </div>
      )}
    </div>
  );
}
