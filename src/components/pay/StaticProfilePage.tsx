// src/components/pay/StaticProfilePage.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerRequest } from "@/app/[slug]/actions";
import { formatRand, MAX_AMOUNT_CENTS, MIN_AMOUNT_CENTS, parseRandInput } from "@/lib/utils";
import type { PublicProfile } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { PublicShell } from "@/components/ui/PublicShell";
import { Avatar, Notice } from "@/components/ui/Surface";

export interface StaticProfilePageProps {
  profile: PublicProfile;
}

interface Errors {
  description?: string;
  amount?: string;
  form?: string;
}

export function StaticProfilePage({ profile }: StaticProfilePageProps) {
  const router = useRouter();
  const firstName = profile.full_name.split(" ")[0];

  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const amountCents = parseRandInput(amountInput);
  const showPreview = amountCents !== null && amountCents >= MIN_AMOUNT_CENTS && !errors.amount;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const found: Errors = {};
    if (!description.trim()) found.description = `Say what you're paying ${firstName} for.`;
    if (!amountInput.trim()) found.amount = "Enter the amount.";
    else if (amountCents === null) found.amount = "Enter an amount like 350 or 1 250.50.";
    else if (amountCents < MIN_AMOUNT_CENTS) found.amount = "The minimum is R 1.00.";
    else if (amountCents > MAX_AMOUNT_CENTS) found.amount = "That's more than a payment link allows.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const result = await createCustomerRequest(profile.slug, description, amountInput);
      if (!result.ok) {
        setErrors({ form: result.error });
        setLoading(false);
        return;
      }
      // Keep the spinner while the payment page loads.
      router.push(`/pay/${result.data.shortCode}`);
    } catch {
      setErrors({ form: "We couldn't reach PayLink. Check your signal and try again." });
      setLoading(false);
    }
  }

  return (
    <PublicShell>
      <section className="relative overflow-hidden rounded-4xl bg-jade px-5 py-[22px] text-white">
        <div aria-hidden="true" className="brand-pattern absolute -top-2.5 -right-2.5 h-[140px] w-[160px]" />
        <div className="relative flex items-center gap-3.5">
          <Avatar name={profile.full_name} size="lg" verified={profile.verified_at !== null} onJade />
          <div className="min-w-0">
            <h1 className="truncate font-heading text-[27px]">{profile.full_name}</h1>
            <p className="mt-0.5 text-sm font-medium text-mint">
              {profile.trade}
              {profile.verified_at !== null && " · Verified by PayLink"}
            </p>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-[22px] bg-white p-5"
      >
        <h2 className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink">Pay {firstName}</h2>
        <TextField
          id="description"
          label="What are you paying for?"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors({ ...errors, description: undefined });
          }}
          placeholder="Haircut"
          maxLength={100}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="next"
          error={errors.description}
        />
        <TextField
          id="amount"
          label="Amount"
          prefix="R"
          value={amountInput}
          onChange={(e) => {
            setAmountInput(e.target.value);
            if (errors.amount) setErrors({ ...errors, amount: undefined });
          }}
          placeholder="0.00"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          className="tabular-nums"
          error={errors.amount}
          hint={showPreview ? `You'll pay ${formatRand(amountCents)}` : undefined}
        />

        {errors.form && <Notice tone="error">{errors.form}</Notice>}

        <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Opening payment…">
          Continue to payment
        </Button>
      </form>
    </PublicShell>
  );
}
