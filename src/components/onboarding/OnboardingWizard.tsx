// src/components/onboarding/OnboardingWizard.tsx
"use client";

import { useState } from "react";
import { EMPTY_PAYOUT, type PayoutDetails } from "@/lib/payout";
import { formatSAPhone } from "@/lib/validation";
import { Step1Details } from "./steps/Step1Details";
import { Step2Payout } from "./steps/Step2Payout";

export interface ProfileDraft {
  fullName: string;
  trade: string;
  phone: string;
  slug: string;
}

export interface OnboardingWizardProps {
  userId: string;
  /** The number they signed in with. Saved as their WhatsApp number. */
  phone: string;
}

const STEPS = ["About you", "Getting paid"] as const;

export function OnboardingWizard({ userId, phone }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState<ProfileDraft>({
    fullName: "",
    trade: "",
    phone,
    slug: "",
  });
  // Most people receive CashSend on the number they signed up with.
  const [payout, setPayout] = useState<PayoutDetails>({
    ...EMPTY_PAYOUT,
    cashsendPhone: phone ? formatSAPhone(phone) : "",
  });
  // Set when saving fails because the address was taken in the meantime.
  const [slugError, setSlugError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-muted">
          Step {step} of {STEPS.length}: {STEPS[step - 1]}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5" aria-hidden="true">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={`h-1.5 rounded-full ${index < step ? "bg-jade" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <Step1Details
          value={profile}
          onChange={setProfile}
          externalSlugError={slugError}
          onNext={() => {
            setSlugError(null);
            // Most people's bank account is in their own name: start with that.
            setPayout((current) =>
              current.accountHolder ? current : { ...current, accountHolder: profile.fullName.trim() },
            );
            setStep(2);
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
        <Step2Payout
          userId={userId}
          profile={profile}
          value={payout}
          onChange={setPayout}
          onBack={() => setStep(1)}
          onSlugTaken={() => {
            setSlugError("Someone just took that address. Choose another one.");
            setStep(1);
          }}
        />
      )}
    </div>
  );
}
