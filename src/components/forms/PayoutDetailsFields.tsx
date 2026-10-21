// src/components/forms/PayoutDetailsFields.tsx
"use client";

import { BANKS } from "@/lib/constants";
import { defaultBranchCode, type PayoutDetails, type PayoutErrors } from "@/lib/payout";
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
              onChange={(e) => {
                const bankName = e.target.value;
                // Swap in the new bank's universal code, unless they typed their own.
                const autoFilled =
                  value.branchCode === "" || value.branchCode === defaultBranchCode(value.bankName);
                set({ bankName, ...(autoFilled ? { branchCode: defaultBranchCode(bankName) } : {}) });
              }}
              error={errors.bankName}
            />
            <TextField
              id="account-holder"
              label="Account holder"
              value={value.accountHolder}
              onChange={(e) => set({ accountHolder: e.target.value })}
              autoComplete="name"
              maxLength={80}
              placeholder="Name on the account"
              hint="Exactly as your bank shows it, e.g. T Mokoena or Thandi's Hair Studio."
              error={errors.accountHolder}
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
            <TextField
              id="branch-code"
              label="Branch code"
              value={value.branchCode}
              onChange={(e) => set({ branchCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              placeholder="250655"
              className="tabular-nums"
              hint={
                defaultBranchCode(value.bankName) && value.branchCode === defaultBranchCode(value.bankName)
                  ? `${value.bankName}'s universal code, which works for every branch.`
                  : "6 digits. Most banks use one code for every branch."
              }
              error={errors.branchCode}
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
          description="Customers send cash to your cellphone from their banking app. They give you the voucher number and PIN, and you draw it at an ATM. No bank account needed."
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
