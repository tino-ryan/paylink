// src/components/forms/PayoutDetailsFields.tsx
"use client";

import { BANKS, CASHSEND_BANKS } from "@/lib/constants";
import type { PayoutDetails, PayoutErrors } from "@/lib/payout";
import type { AccountType } from "@/lib/types";
import { cleanPhoneInput, PHONE_INPUT_MAX } from "@/lib/validation";
import { CheckboxCard, ChoiceGroup, SelectField, TextField } from "@/components/ui/Field";

export interface PayoutDetailsFieldsProps {
  value: PayoutDetails;
  errors: PayoutErrors;
  onChange: (next: PayoutDetails) => void;
}

const ACCOUNT_TYPES = [
  { value: "cheque", label: "Cheque" },
  { value: "savings", label: "Savings" },
] as const;

/** "How customers pay you": bank EFT and/or CashSend, with their details. */
export function PayoutDetailsFields({ value, errors, onChange }: PayoutDetailsFieldsProps) {
  const set = (partial: Partial<PayoutDetails>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <CheckboxCard
          id="accepts-bank"
          checked={value.acceptsBank}
          onChange={(checked) => set({ acceptsBank: checked })}
          title="Bank transfer (EFT)"
          description="Customers pay into your bank account from their banking app."
        />
        {value.acceptsBank && (
          <div className="space-y-4 rounded-2xl bg-cream p-4">
            <SelectField
              id="bank-name"
              label="Bank"
              placeholder="Choose your bank"
              options={BANKS}
              value={value.bankName}
              onChange={(e) => set({ bankName: e.target.value })}
              error={errors.bankName}
            />
            <TextField
              id="account-number"
              label="Account number"
              value={value.accountNumber}
              onChange={(e) => set({ accountNumber: e.target.value.replace(/[^\d\s]/g, "") })}
              inputMode="numeric"
              autoComplete="off"
              placeholder="1234567890"
              className="tabular-nums"
              error={errors.accountNumber}
            />
            <ChoiceGroup<AccountType>
              name="account-type"
              legend="Account type"
              options={ACCOUNT_TYPES}
              value={value.accountType}
              onChange={(accountType) => set({ accountType })}
              error={errors.accountType}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <CheckboxCard
          id="accepts-cashsend"
          checked={value.acceptsCashSend}
          onChange={(checked) => set({ acceptsCashSend: checked })}
          title="CashSend"
          description="Customers send money to your cellphone number. You withdraw it at an ATM."
        />
        {value.acceptsCashSend && (
          <div className="space-y-4 rounded-2xl bg-cream p-4">
            <TextField
              id="cashsend-phone"
              label="Cellphone number customers send to"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={value.cashsendPhone}
              maxLength={PHONE_INPUT_MAX}
              onChange={(e) => set({ cashsendPhone: cleanPhoneInput(e.target.value) })}
              placeholder="071 234 5678"
              error={errors.cashsendPhone}
            />
            <SelectField
              id="cashsend-bank"
              label="Bank for this number"
              placeholder="Choose a bank"
              options={CASHSEND_BANKS}
              value={value.cashsendBank}
              onChange={(e) => set({ cashsendBank: e.target.value })}
              error={errors.cashsendBank}
              hint="Only these banks support CashSend withdrawals."
            />
          </div>
        )}
      </div>

      {errors.methods && (
        <p role="alert" className="text-sm font-semibold text-failed">
          {errors.methods}
        </p>
      )}
    </div>
  );
}
