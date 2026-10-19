// src/lib/payout.ts
// How a provider gets paid, shared by onboarding and settings.
// A provider can accept bank EFT, CashSend, or both.
import { formatSAPhone, normalizeSAPhone, validateAccountNumber, validatePhone } from "./validation";
import type { AccountType, PayoutMethod, Provider } from "./types";

export interface PayoutDetails {
  acceptsBank: boolean;
  bankName: string;
  accountNumber: string;
  accountType: AccountType | "";
  acceptsCashSend: boolean;
  cashsendPhone: string;
  cashsendBank: string;
}

export type PayoutErrors = Partial<
  Record<"methods" | "bankName" | "accountNumber" | "accountType" | "cashsendPhone" | "cashsendBank", string>
>;

export const EMPTY_PAYOUT: PayoutDetails = {
  acceptsBank: true,
  bankName: "",
  accountNumber: "",
  accountType: "",
  acceptsCashSend: false,
  cashsendPhone: "",
  cashsendBank: "",
};

export type PayoutColumns = Pick<
  Provider,
  | "payout_method"
  | "bank_name"
  | "account_number"
  | "account_type"
  | "cashsend_phone"
  | "cashsend_bank"
>;

export function payoutFromProvider(provider: PayoutColumns): PayoutDetails {
  return {
    acceptsBank: Boolean(provider.bank_name && provider.account_number),
    bankName: provider.bank_name ?? "",
    accountNumber: provider.account_number ?? "",
    accountType: provider.account_type ?? "",
    acceptsCashSend: Boolean(provider.cashsend_phone),
    cashsendPhone: provider.cashsend_phone ? formatSAPhone(provider.cashsend_phone) : "",
    cashsendBank: provider.cashsend_bank ?? "",
  };
}

export function validatePayout(details: PayoutDetails): PayoutErrors {
  const errors: PayoutErrors = {};

  if (!details.acceptsBank && !details.acceptsCashSend) {
    errors.methods = "Choose at least one way to get paid.";
  }
  if (details.acceptsBank) {
    if (!details.bankName) errors.bankName = "Choose your bank.";
    const accountError = validateAccountNumber(details.accountNumber);
    if (accountError) errors.accountNumber = accountError;
    if (!details.accountType) errors.accountType = "Choose cheque or savings.";
  }
  if (details.acceptsCashSend) {
    const phoneError = validatePhone(details.cashsendPhone, { required: true });
    if (phoneError) errors.cashsendPhone = phoneError;
    if (!details.cashsendBank) errors.cashsendBank = "Choose the bank for this number.";
  }
  return errors;
}

/**
 * Database columns for the provider row. Call only after validatePayout passes.
 * payout_method records which option customers see first on the payment page.
 */
export function payoutToColumns(details: PayoutDetails): PayoutColumns {
  const preferred: PayoutMethod =
    details.acceptsCashSend && !details.acceptsBank ? "cashsend" : "bank";

  return {
    payout_method: preferred,
    bank_name: details.acceptsBank ? details.bankName : null,
    account_number: details.acceptsBank ? details.accountNumber.replace(/\s/g, "") : null,
    account_type: details.acceptsBank && details.accountType ? details.accountType : null,
    cashsend_phone: details.acceptsCashSend ? normalizeSAPhone(details.cashsendPhone) : null,
    cashsend_bank: details.acceptsCashSend ? details.cashsendBank : null,
  };
}
