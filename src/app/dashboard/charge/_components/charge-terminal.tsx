// src/app/dashboard/charge/_components/charge-terminal.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatRand, MAX_AMOUNT_CENTS, MIN_AMOUNT_CENTS, parseRandInput } from "@/lib/utils";
import { Button, buttonClasses } from "@/components/ui/Button";
import { MoneyHero, Notice } from "@/components/ui/Surface";
import { QRFrame } from "@/components/dashboard/QRFrame";
import { ReceiptSender } from "@/components/dashboard/ReceiptSender";
import { receiptUrl } from "@/lib/receipt";
import type { PaidMethod } from "@/lib/types";
import {
  cancelCharge,
  createCharge,
  getChargeStatus,
  markChargePaid,
  type ChargeStatus,
} from "../actions";

export interface ChargeTerminalProps {
  providerName: string;
  appUrl: string;
}

const POLL_MS = 4000;
const MAX_WHOLE_DIGITS = 7; // R 9 999 999

type Phase =
  | { kind: "enter" }
  | { kind: "showing"; code: string; amountCents: number; description: string };

// ---- Keypad entry: rands first, optional "." and up to 2 cents digits ----

function pressKey(current: string, key: string): string {
  if (key === "back") return current.slice(0, -1);
  if (key === ".") {
    if (current.includes(".")) return current;
    return current === "" ? "0." : `${current}.`;
  }
  const [whole, cents] = current.split(".");
  if (cents !== undefined) return cents.length >= 2 ? current : current + key;
  if (whole === "0") return key; // no leading zeros
  return whole.length >= MAX_WHOLE_DIGITS ? current : current + key;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

export function ChargeTerminal({ providerName, appUrl }: ChargeTerminalProps) {
  const [phase, setPhase] = useState<Phase>({ kind: "enter" });
  const [entry, setEntry] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const amountCents = entry ? (parseRandInput(entry) ?? 0) : 0;
  const tooSmall = amountCents < MIN_AMOUNT_CENTS;
  const tooBig = amountCents > MAX_AMOUNT_CENTS;

  async function showQr() {
    setError(null);
    if (tooSmall) return setError("Enter an amount of at least R 1.00.");
    if (tooBig) return setError("That's more than a payment link allows.");

    setCreating(true);
    try {
      const result = await createCharge(amountCents, description);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPhase({
        kind: "showing",
        code: result.data.shortCode,
        amountCents,
        description: description.trim() || "Payment",
      });
    } catch {
      setError("Couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setCreating(false);
    }
  }

  function newSale() {
    setEntry("");
    setDescription("");
    setError(null);
    setPhase({ kind: "enter" });
  }

  if (phase.kind === "showing") {
    return (
      <ShowQr
        providerName={providerName}
        payUrl={`${appUrl}/pay/${phase.code}`}
        receiptLink={receiptUrl(appUrl, phase.code)}
        code={phase.code}
        amountCents={phase.amountCents}
        description={phase.description}
        onCancelled={() => setPhase({ kind: "enter" })}
        onNewSale={newSale}
      />
    );
  }

  return (
    <div className="space-y-4">
      <section
        aria-label="Amount"
        className="flex min-h-[132px] flex-col items-center justify-center rounded-4xl bg-white px-4 py-5"
      >
        <p className="text-sm font-semibold text-muted">Amount to charge</p>
        <MoneyHero
          cents={amountCents}
          size={56}
          className={entry ? "text-ink" : "text-muted/50"}
        />
        <p className="sr-only" aria-live="polite">
          {formatRand(amountCents)}
        </p>
      </section>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Keypad">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setEntry((current) => pressKey(current, key));
              if (error) setError(null);
            }}
            aria-label={key === "back" ? "Delete" : key === "." ? "Decimal point" : key}
            className="flex min-h-16 items-center justify-center rounded-2xl bg-white font-display text-[28px] font-bold text-ink transition-colors select-none active:bg-mint focus-visible:outline-3 focus-visible:outline-jade-600"
          >
            {key === "back" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
                <path d="M17 9l-5 6M12 9l5 6" />
              </svg>
            ) : (
              key
            )}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="sr-only">What&apos;s it for? (optional)</span>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={100}
          placeholder="What's it for? (optional)"
          autoComplete="off"
          autoCapitalize="sentences"
          className="block min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-[17px] font-semibold text-ink placeholder:font-medium placeholder:text-muted/70 focus:border-jade focus:shadow-[0_0_0_4px_var(--color-mint)] focus:outline-none"
        />
      </label>

      {error && <Notice tone="error">{error}</Notice>}

      <Button
        variant="accent"
        size="lg"
        fullWidth
        onClick={showQr}
        loading={creating}
        loadingText="Making QR code…"
        disabled={!entry}
      >
        {entry && !tooSmall ? `Show QR for ${formatRand(amountCents)}` : "Show QR code"}
      </Button>

      <Link href="/dashboard/new" className={buttonClasses({ variant: "ghost", fullWidth: true })}>
        Customer not here? Send a payment link instead
      </Link>
    </div>
  );
}

// ---- Full-screen QR with live status ----

interface ShowQrProps {
  providerName: string;
  payUrl: string;
  receiptLink: string;
  code: string;
  amountCents: number;
  description: string;
  onCancelled: () => void;
  onNewSale: () => void;
}

function ShowQr({
  providerName,
  payUrl,
  receiptLink,
  code,
  amountCents,
  description,
  onCancelled,
  onNewSale,
}: ShowQrProps) {
  const [status, setStatus] = useState<ChargeStatus>({ status: "pending", customerReported: false, receipt: null });
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState<"paid" | "cancel" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const buzzed = useRef(false);

  const finished = status.status === "paid" || status.status === "expired";

  // Poll for the customer's "I've sent the money" while the QR is up.
  useEffect(() => {
    if (finished) return;
    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const result = await getChargeStatus(code);
        if (cancelled) return;
        if (result.ok) {
          setStatus(result.data);
          setOffline(false);
          if (result.data.customerReported && !buzzed.current) {
            buzzed.current = true;
            navigator.vibrate?.([200, 100, 200]);
          }
        }
      } catch {
        if (!cancelled) setOffline(true);
      }
    };

    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [code, finished]);

  // Keep the screen on while the customer is scanning.
  useEffect(() => {
    if (finished || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let released = false;
    navigator.wakeLock
      .request("screen")
      .then((sentinel) => {
        if (released) void sentinel.release();
        else lock = sentinel;
      })
      .catch(() => {
        // Not allowed (battery saver, old browser). The screen may dim; that's all.
      });
    return () => {
      released = true;
      void lock?.release();
    };
  }, [finished]);

  async function confirmPaid(method?: PaidMethod) {
    setBusy("paid");
    setActionError(null);
    try {
      const result = await markChargePaid(code, method);
      if (!result.ok) setActionError(result.error);
      else setStatus({ status: "paid", customerReported: false, receipt: result.data });
    } catch {
      setActionError("Couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setActionError(null);
    try {
      const result = await cancelCharge(code);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      onCancelled();
    } catch {
      setActionError("Couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setBusy(null);
    }
  }

  // Covers the whole screen, bottom nav included, so the customer sees only this.
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-cream pt-[env(safe-area-inset-top)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-4">
        {status.status === "paid" ? (
          <section className="flex flex-col items-center gap-3 rounded-4xl bg-paid-soft px-6 py-10 text-center" role="status">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-paid-dot text-white">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </span>
            <h1 className="font-heading text-[30px] text-paid">Paid</h1>
            <MoneyHero cents={amountCents} size={44} className="text-ink" />
            <p className="text-[15px] font-semibold text-paid">{description}</p>
          </section>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="truncate text-[15px] font-semibold text-muted">{providerName}</p>
              <span className="text-sm font-semibold text-muted">Ref {code}</span>
            </div>

            <div className="text-center">
              <p className="text-[15px] font-semibold text-muted">{description}</p>
              <MoneyHero cents={amountCents} size={52} className="text-ink" />
            </div>

            <QRFrame url={payUrl} caption="Scan with your phone camera to pay" />

            {status.customerReported ? (
              <section className="space-y-3 rounded-[22px] bg-white p-5" role="status">
                <p className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink">
                  Customer says they&apos;ve paid
                </p>
                <p className="text-[15px] text-muted">
                  Check your bank app or CashSend SMS for {formatRand(amountCents)} before you confirm.
                </p>
                <Button size="lg" fullWidth onClick={() => confirmPaid()} loading={busy === "paid"} loadingText="Saving…">
                  Money&apos;s in, mark paid
                </Button>
              </section>
            ) : (
              <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-muted" role="status">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-full ${offline ? "bg-failed-dot" : "animate-pulse bg-waiting-dot motion-reduce:animate-none"}`}
                />
                {offline ? "No connection. Still trying…" : "Waiting for the customer to pay"}
              </p>
            )}
          </>
        )}

        {actionError && <Notice tone="error">{actionError}</Notice>}

        {status.status === "paid" ? (
          <div className="space-y-2">
            <section className="space-y-3 rounded-[22px] bg-white p-5">
              <p className="font-heading text-[22px] text-ink">Send their receipt</p>
              <ReceiptSender
                url={receiptLink}
                info={{
                  code,
                  receiptNumber: status.receipt?.receiptNumber ?? null,
                  description,
                  amountCents,
                  paidAt: status.receipt?.paidAt ?? null,
                  paidMethod: status.receipt?.paidMethod ?? null,
                  providerName,
                }}
              />
            </section>
            <Button variant="accent" size="lg" fullWidth onClick={onNewSale}>
              New sale
            </Button>
            <Link href="/dashboard" className={buttonClasses({ variant: "ghost", fullWidth: true })}>
              Back to jobs
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={cancel} loading={busy === "cancel"} loadingText="Cancelling…">
              Cancel sale
            </Button>
            {!status.customerReported && (
              <Button variant="secondary" onClick={() => confirmPaid("cash")} loading={busy === "paid"} loadingText="Saving…">
                Paid in cash
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
