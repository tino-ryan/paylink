// src/components/onboarding/steps/Step2Payout.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  payoutToColumns,
  validatePayout,
  type PayoutDetails,
  type PayoutErrors,
} from "@/lib/payout";
import { normalizeSAPhone } from "@/lib/validation";
import { UNIQUE_VIOLATION } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle, Notice } from "@/components/ui/Surface";
import { PayoutDetailsFields } from "@/components/forms/PayoutDetailsFields";
import type { ProfileDraft } from "../OnboardingWizard";

export interface Step2PayoutProps {
  userId: string;
  profile: ProfileDraft;
  value: PayoutDetails;
  onChange: (next: PayoutDetails) => void;
  onBack: () => void;
  onSlugTaken: () => void;
}

export function Step2Payout({
  userId,
  profile,
  value,
  onChange,
  onBack,
  onSlugTaken,
}: Step2PayoutProps) {
  const router = useRouter();
  const [errors, setErrors] = useState<PayoutErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const found = validatePayout(value);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("providers").insert({
      user_id: userId,
      full_name: profile.fullName.trim(),
      trade: profile.trade,
      slug: profile.slug,
      phone: profile.phone.trim() ? normalizeSAPhone(profile.phone) : null,
      ...payoutToColumns(value),
    });

    if (error) {
      setSaving(false);
      if (error.code === UNIQUE_VIOLATION) {
        // Either the address was taken since step 1, or this login already
        // has a profile (double tap). The details tell us which.
        if (`${error.message} ${error.details ?? ""}`.includes("user_id")) {
          router.replace("/dashboard");
          return;
        }
        onSlugTaken();
        return;
      }
      setFormError("Couldn't save your details. Check your signal and try again.");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Card>
        <CardTitle description="Pick every option you're happy to accept. Customers choose one when they pay.">
          How do you want to get paid?
        </CardTitle>
        <PayoutDetailsFields
          value={value}
          errors={errors}
          onChange={(next) => {
            onChange(next);
            if (Object.keys(errors).length > 0) setErrors(validatePayout(next));
          }}
        />
      </Card>

      <Notice tone="info">
        PayLink never holds your money. Customers pay you directly, and only see these details on
        your payment links.
      </Notice>

      {formError && <Notice tone="error">{formError}</Notice>}

      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Button variant="secondary" size="lg" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button type="submit" size="lg" loading={saving} loadingText="Saving…">
          Finish setup
        </Button>
      </div>
    </form>
  );
}
