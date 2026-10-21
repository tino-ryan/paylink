// src/app/dashboard/settings/_components/settings-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PAYOUT_KEYS,
  payoutFromProvider,
  payoutToColumns,
  validatePayout,
  type PayoutDetails,
  type PayoutErrors,
} from "@/lib/payout";
import { cleanPinInput, validateFullName } from "@/lib/validation";
import type { Provider } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { TradePicker, validateTrade } from "@/components/forms/TradePicker";
import { Card, CardTitle, Notice } from "@/components/ui/Surface";
import { PayoutDetailsFields } from "@/components/forms/PayoutDetailsFields";
import { saveSettings } from "../actions";

export interface SettingsFormProps {
  provider: Provider;
}

interface ProfileErrors {
  fullName?: string;
  trade?: string;
}

type Status = "idle" | "saving" | "saved" | "error";


export function SettingsForm({ provider }: SettingsFormProps) {
  const router = useRouter();

  const [fullName, setFullName] = useState(provider.full_name);
  const [trade, setTrade] = useState(provider.trade);
  const [payout, setPayout] = useState<PayoutDetails>(() => payoutFromProvider(provider));
  const [pin, setPin] = useState("");

  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [payoutErrors, setPayoutErrors] = useState<PayoutErrors>({});
  const [pinError, setPinError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [savedPayout, setSavedPayout] = useState(false);

  // Ask for the PIN as soon as where-the-money-goes changes (the server checks too).
  const payoutValid = Object.keys(validatePayout(payout)).length === 0;
  const columns = payoutValid ? payoutToColumns(payout) : null;
  const payoutChanged =
    columns !== null && PAYOUT_KEYS.some((key) => (columns[key] ?? null) !== (provider[key] ?? null));

  function markDirty() {
    if (status === "saved" || status === "error") setStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setPinError(null);

    const nextProfileErrors: ProfileErrors = {};
    const nameError = validateFullName(fullName);
    if (nameError) nextProfileErrors.fullName = nameError;
    const tradeError = validateTrade(trade);
    if (tradeError) nextProfileErrors.trade = tradeError;
    const nextPayoutErrors = validatePayout(payout);
    setProfileErrors(nextProfileErrors);
    setPayoutErrors(nextPayoutErrors);

    if (Object.keys(nextProfileErrors).length > 0 || Object.keys(nextPayoutErrors).length > 0) {
      setFormError("Some details need fixing. Check the highlighted fields above.");
      setStatus("error");
      return;
    }
    if (payoutChanged && pin.length !== 6) {
      setPinError("Enter your 6-digit PIN to change payment details.");
      setStatus("error");
      return;
    }

    setStatus("saving");
    try {
      const result = await saveSettings({
        fullName,
        trade: trade.trim(),
        payout,
        pin: payoutChanged ? pin : undefined,
      });
      if (!result.ok) {
        if (result.needsPin) setPinError(result.error);
        else setFormError(result.error);
        setPin("");
        setStatus("error");
        return;
      }
      setSavedPayout(result.data.payoutChanged);
      setPin("");
      setStatus("saved");
      router.refresh();
    } catch {
      setFormError("Couldn't save your changes. Check your signal and try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} onChange={markDirty} noValidate className="space-y-5">
      <Card className="space-y-5">
        <CardTitle description="Shown to customers on your payment page.">Your details</CardTitle>
        <TextField
          id="full-name"
          label="Your name or business name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          autoCapitalize="words"
          error={profileErrors.fullName}
        />
        <TradePicker
          id="trade"
          value={trade}
          onChange={(next) => {
            setTrade(next);
            markDirty();
            if (profileErrors.trade) setProfileErrors({ ...profileErrors, trade: undefined });
          }}
          error={profileErrors.trade}
        />
      </Card>

      <Card>
        <CardTitle description="Customers see these options when they pay you.">
          How customers pay you
        </CardTitle>
        {provider.bank_name && (!provider.account_holder || !provider.branch_code) && (
          <div className="mb-4">
            <Notice tone="info">
              New: customers now see your account holder name and branch code. We&apos;ve filled
              in the usual values. Check them, then save with your PIN.
            </Notice>
          </div>
        )}
        <PayoutDetailsFields
          value={payout}
          errors={payoutErrors}
          onChange={(next) => {
            setPayout(next);
            markDirty();
          }}
        />
      </Card>

      {payoutChanged && (
        <Card className="space-y-4">
          <CardTitle description="You're changing where customers send money. Enter your PIN to confirm it's you.">
            Confirm with your PIN
          </CardTitle>
          <TextField
            id="confirm-pin"
            label="PIN"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(cleanPinInput(e.target.value));
              if (pinError) setPinError(null);
            }}
            placeholder="••••••"
            className="tracking-[0.4em]"
            error={pinError}
          />
        </Card>
      )}

      {status === "saved" && (
        <Notice tone="success">
          {savedPayout
            ? "Saved. Customers will see your new payment details from now on."
            : "Changes saved."}
        </Notice>
      )}
      {status === "error" && formError && <Notice tone="error">{formError}</Notice>}

      <Button type="submit" size="lg" fullWidth loading={status === "saving"} loadingText="Saving…">
        Save changes
      </Button>
    </form>
  );
}
