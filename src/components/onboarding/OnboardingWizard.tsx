"use client";

import { useState } from "react";
import { Step1Details } from "./steps/Step1Details";
import { Step2Payout } from "./steps/Step2Payout";
import type { PayoutMethod, AccountType } from "@/lib/types";

export interface OnboardingData {
  fullName: string;
  trade: string;
  phone: string;
  slug: string;
  payoutMethod: PayoutMethod;
  bankName: string;
  accountNumber: string;
  accountType: AccountType | "";
  cashsendPhone: string;
  cashsendBank: string;
}

const INITIAL: OnboardingData = {
  fullName: "",
  trade: "",
  phone: "",
  slug: "",
  payoutMethod: "bank",
  bankName: "",
  accountNumber: "",
  accountType: "",
  cashsendPhone: "",
  cashsendBank: "",
};

interface Props {
  userId: string;
}

export function OnboardingWizard({ userId }: Props) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL);

  function update(partial: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div>
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`h-2 rounded-full transition-all ${
              step >= n ? "bg-emerald-600 w-6" : "bg-gray-200 w-2"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Step1Details data={data} onChange={update} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <Step2Payout
          data={data}
          onChange={update}
          onBack={() => setStep(1)}
          userId={userId}
        />
      )}
    </div>
  );
}
