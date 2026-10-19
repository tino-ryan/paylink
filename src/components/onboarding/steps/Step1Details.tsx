// src/components/onboarding/steps/Step1Details.tsx
"use client";

import { useState } from "react";
import { checkSlugAvailable } from "@/app/onboarding/actions";
import {
  cleanSlugInput,
  finalizeSlug,
  validateFullName,
  validateSlug,
} from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { TradePicker, validateTrade } from "@/components/forms/TradePicker";
import { Card } from "@/components/ui/Surface";
import type { ProfileDraft } from "../OnboardingWizard";

export interface Step1DetailsProps {
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
  onNext: () => void;
  externalSlugError: string | null;
}

interface Errors {
  fullName?: string;
  trade?: string;
  slug?: string;
}

export function Step1Details({ value, onChange, onNext, externalSlugError }: Step1DetailsProps) {
  // Keep suggesting a link from the name until they edit the link themselves.
  const [slugEdited, setSlugEdited] = useState(value.slug !== "");
  const [errors, setErrors] = useState<Errors>(
    externalSlugError ? { slug: externalSlugError } : {},
  );
  const [checking, setChecking] = useState(false);

  const set = (partial: Partial<ProfileDraft>, clear: keyof Errors) => {
    onChange({ ...value, ...partial });
    if (errors[clear]) setErrors({ ...errors, [clear]: undefined });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const found: Errors = {};
    const nameError = validateFullName(value.fullName);
    if (nameError) found.fullName = nameError;
    const tradeError = validateTrade(value.trade);
    if (tradeError) found.trade = tradeError;
    const slugError = validateSlug(value.slug);
    if (slugError) found.slug = slugError;

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setChecking(true);
    try {
      const result = await checkSlugAvailable(value.slug);
      if (!result.ok) {
        setErrors({ slug: result.error });
        return;
      }
      if (!result.data.available) {
        setErrors({ slug: "That address is taken. Try adding your area, like sipho-plumbing-soweto." });
        return;
      }
      onChange({ ...value, trade: value.trade.trim(), slug: finalizeSlug(value.slug) });
      onNext();
    } catch {
      setErrors({ slug: "Couldn't check that address. Check your signal and try again." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Card className="space-y-5">
        <TextField
          id="full-name"
          label="Your name or business name"
          value={value.fullName}
          onChange={(e) => {
            const fullName = e.target.value;
            onChange({
              ...value,
              fullName,
              slug: slugEdited ? value.slug : cleanSlugInput(fullName),
            });
            if (errors.fullName) setErrors({ ...errors, fullName: undefined });
          }}
          placeholder="Sipho Dlamini Plumbing"
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="next"
          autoFocus
          error={errors.fullName}
        />

        <TradePicker
          id="trade"
          value={value.trade}
          onChange={(trade) => set({ trade }, "trade")}
          error={errors.trade}
        />

        <TextField
          id="slug"
          label="Your PayLink address"
          prefix="paylink.co.za/"
          value={value.slug}
          onChange={(e) => {
            setSlugEdited(true);
            set({ slug: cleanSlugInput(e.target.value) }, "slug");
          }}
          placeholder="sipho-plumbing"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.slug}
          hint="Goes on your card and QR code. You can't change it later."
        />
      </Card>

      <Button type="submit" size="lg" fullWidth loading={checking} loadingText="Checking…">
        Continue
      </Button>
    </form>
  );
}
