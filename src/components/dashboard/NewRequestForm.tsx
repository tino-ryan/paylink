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
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Surface";
import { LogoMark } from "@/components/brand/Logo";

export interface NewRequestFormProps {
  providerId: string;
}

const SHORT_CODE_ATTEMPTS = 3;
const MAX_DESCRIPTION = 100;

interface Errors {
  description?: string;
  amount?: string;
  form?: string;
}

function validate(description: string, amountCents: number | null, amountInput: string): Errors {
  const errors: Errors = {};
  if (!description.trim()) errors.description = "Say what the job was, e.g. Geyser repair.";
  if (!amountInput.trim()) errors.amount = "Enter the amount.";
  else if (amountCents === null) errors.amount = "Enter an amount like 350 or 1 250.50.";
  else if (amountCents < MIN_AMOUNT_CENTS) errors.amount = "The minimum is R 1.00.";
  else if (amountCents > MAX_AMOUNT_CENTS) errors.amount = "That's more than a payment link allows.";
  return errors;
}

export function NewRequestForm({ providerId }: NewRequestFormProps) {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const amountCents = parseRandInput(amountInput);
  const showPreview = amountCents !== null && amountCents >= MIN_AMOUNT_CENTS && !errors.amount;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const found = validate(description, amountCents, amountInput);
    setErrors(found);
    if (Object.keys(found).length > 0 || amountCents === null) return;

    setLoading(true);
    const supabase = createClient();
    const cleanDescription = description.trim();

    // Retry with a fresh code if the random one already exists.
    for (let attempt = 0; attempt < SHORT_CODE_ATTEMPTS; attempt++) {
      const shortCode = generateShortCode();
      const { error } = await supabase.from("payment_requests").insert({
        provider_id: providerId,
        description: cleanDescription,
        amount_cents: amountCents,
        short_code: shortCode,
        cashsend_reference: generateCashSendReference(cleanDescription, shortCode),
      });

      if (!error) {
        router.push(`/dashboard/requests/${shortCode}`);
        router.refresh(); // drop the cached jobs list so it shows this link
        return;
      }
      if (error.code !== UNIQUE_VIOLATION) break;
    }

    setLoading(false);
    setErrors({ form: "Couldn't create the link. Check your signal and try again." });
  }

  const amountInvalid = Boolean(errors.amount);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* The amount is the hero: big, centred, framed in jade. */}
      <div className="flex flex-col gap-2">
        <div
          className={`flex flex-col items-center gap-1.5 rounded-3xl bg-white px-4 pt-[22px] pb-[18px] transition-shadow ${
            amountInvalid
              ? "shadow-[inset_0_0_0_2px_var(--color-failed-dot)]"
              : "shadow-[inset_0_0_0_2px_var(--color-jade)] focus-within:shadow-[inset_0_0_0_2px_var(--color-jade),0_0_0_4px_var(--color-mint)]"
          }`}
        >
          <label htmlFor="amount" className="text-[15px] font-bold text-muted">
            How much?
          </label>
          <div className="flex w-full items-baseline justify-center gap-1.5">
            <span aria-hidden="true" className="font-display text-[30px] font-extrabold text-muted">
              R
            </span>
            <input
              id="amount"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                if (errors.amount) setErrors({ ...errors, amount: undefined });
              }}
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              autoFocus
              aria-invalid={amountInvalid || undefined}
              aria-describedby={amountInvalid ? "amount-error" : showPreview ? "amount-hint" : undefined}
              className="w-full max-w-[230px] min-w-0 bg-transparent p-0 text-center font-display text-[56px] font-extrabold tracking-[-0.045em] text-ink tabular-nums placeholder:text-line focus:outline-none"
            />
          </div>
        </div>
        {errors.amount ? (
          <p id="amount-error" role="alert" className="flex gap-1.5 text-sm font-semibold text-failed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7.5v5.5M12 16.5v.5" />
            </svg>
            {errors.amount}
          </p>
        ) : showPreview ? (
          <p id="amount-hint" className="text-center text-sm text-muted">
            Customer will pay {formatRand(amountCents)}
          </p>
        ) : null}
      </div>

      <TextField
        id="description"
        label="What was the job?"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          if (errors.description) setErrors({ ...errors, description: undefined });
        }}
        placeholder="Geyser repair"
        maxLength={MAX_DESCRIPTION}
        autoComplete="off"
        autoCapitalize="sentences"
        enterKeyHint="done"
        error={errors.description}
        hint="Your customer sees this on the payment page."
      />

      {errors.form && <Notice tone="error">{errors.form}</Notice>}

      <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Creating link…">
        <LogoMark size={24} tone="white" />
        Get payment link
      </Button>
    </form>
  );
}
