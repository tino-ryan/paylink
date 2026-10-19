// src/app/admin/_components/provider-actions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatSAPhone } from "@/lib/validation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardTitle, Notice } from "@/components/ui/Surface";
import { resetPin, setSuspended, setVerified, unlockPhone } from "../actions";

export interface ProviderActionsProps {
  providerId: string;
  providerName: string;
  verified: boolean;
  suspended: boolean;
  /** "0712345678", or null for old email accounts. */
  signInPhone: string | null;
  locked: boolean;
}

type Busy = "verify" | "unlock" | "reset" | "suspend" | null;

/** "0712345678" → "27712345678" for wa.me links. */
const toWhatsAppNumber = (phone: string) => `27${phone.slice(1)}`;

export function ProviderActions({
  providerId,
  providerName,
  verified,
  suspended,
  signInPhone,
  locked,
}: ProviderActionsProps) {
  const router = useRouter();
  const firstName = providerName.split(" ")[0];
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<"reset" | "suspend" | null>(null);
  const [reason, setReason] = useState("");
  const [newPin, setNewPin] = useState<string | null>(null);

  async function run(kind: Exclude<Busy, null>, action: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(kind);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "That didn't work.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Couldn't reach the server.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function doReset() {
    setBusy("reset");
    setError(null);
    try {
      const result = await resetPin(providerId);
      if (!result.ok) setError(result.error);
      else {
        setNewPin(result.data.pin);
        setConfirm(null);
      }
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  const pinMessage = newPin
    ? `Hi ${firstName}, this is PayLink. Your new PIN is ${newPin}. Sign in with it, then change it in Settings > Change PIN.`
    : "";

  return (
    <Card className="space-y-4">
      <CardTitle>Actions</CardTitle>

      {error && <Notice tone="error">{error}</Notice>}

      {newPin && signInPhone && (
        <div className="space-y-3 rounded-2xl bg-mist p-4">
          <p className="text-[15px] font-semibold text-jade">
            New PIN for {formatSAPhone(signInPhone)}:
          </p>
          <p className="font-heading text-[40px] tracking-[0.2em] text-ink tabular-nums">{newPin}</p>
          <p className="text-sm text-muted">
            It&apos;s shown once and not saved anywhere. Only send it after checking it&apos;s really
            them.
          </p>
          <a
            href={`https://wa.me/${toWhatsAppNumber(signInPhone)}?text=${encodeURIComponent(pinMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "whatsapp", fullWidth: true })}
          >
            Send it to {firstName} on WhatsApp
          </a>
          <Button variant="ghost" fullWidth onClick={() => setNewPin(null)}>
            Done, hide it
          </Button>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant={verified ? "secondary" : "primary"}
          loading={busy === "verify"}
          loadingText="Saving…"
          onClick={() => run("verify", () => setVerified(providerId, !verified))}
        >
          {verified ? "Remove verified badge" : "Mark as verified"}
        </Button>

        {signInPhone && locked && (
          <Button
            variant="secondary"
            loading={busy === "unlock"}
            loadingText="Unlocking…"
            onClick={() => run("unlock", () => unlockPhone(signInPhone))}
          >
            Unlock PIN
          </Button>
        )}

        {signInPhone && confirm !== "reset" && (
          <Button variant="secondary" onClick={() => setConfirm("reset")} disabled={busy !== null}>
            Reset PIN
          </Button>
        )}

        {confirm !== "suspend" && (
          <Button
            variant={suspended ? "secondary" : "danger"}
            loading={busy === "suspend" && suspended}
            loadingText="Saving…"
            onClick={() =>
              suspended
                ? run("suspend", () => setSuspended(providerId, false, ""))
                : setConfirm("suspend")
            }
            disabled={busy !== null && busy !== "suspend"}
          >
            {suspended ? "Lift suspension" : "Suspend"}
          </Button>
        )}
      </div>

      {confirm === "reset" && (
        <div className="space-y-3 rounded-2xl border-2 border-line p-4">
          <p className="text-[15px] text-ink">
            This replaces {firstName}&apos;s PIN with a new random one. Their old PIN stops working
            immediately. Have you confirmed it&apos;s really them?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy === "reset"}>
              Cancel
            </Button>
            <Button onClick={doReset} loading={busy === "reset"} loadingText="Resetting…">
              Make new PIN
            </Button>
          </div>
        </div>
      )}

      {confirm === "suspend" && (
        <div className="space-y-3 rounded-2xl border-2 border-failed-soft p-4">
          <p className="text-[15px] text-ink">
            {firstName} won&apos;t be able to sign in, and their payment links and profile page will
            stop working for customers. You can lift it later.
          </p>
          <label htmlFor="suspend-reason" className="block text-sm font-semibold text-ink">
            Reason (for your records)
          </label>
          <input
            id="suspend-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Customer reported a scam"
            className="min-h-12 w-full rounded-2xl border-2 border-line bg-white px-4 text-[16px] text-ink focus:border-jade focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setConfirm(null)} disabled={busy === "suspend"}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={busy === "suspend"}
              loadingText="Suspending…"
              onClick={async () => {
                const ok = await run("suspend", () => setSuspended(providerId, true, reason));
                if (ok) {
                  setConfirm(null);
                  setReason("");
                }
              }}
            >
              Suspend {firstName}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
