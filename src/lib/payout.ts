// src/lib/payout.ts
// How a provider gets paid, shared by onboarding and settings.
// A provider can accept bank EFT, CashSend, or both.
//
// CashSend only needs a cellphone number: the customer sends from their own
// banking app, and the provider collects the cash at an ATM with the voucher
// number and PIN. The provider doesn't need an account at any bank for it.
import { BANK_BRANCH_CODES } from "./constants";
import { formatSAPhone, normalizeSAPhone, validateAccountNumber, validatePhone } from "./validation";
import type { AccountType, PayoutMethod, Provider } from "./types";

export interface PayoutDetails {
  acceptsBank: boolean;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: AccountType | "";
  acceptsCashSend: boolean;
  cashsendPhone: string;
}

export type PayoutErrors = Partial<
  Record<
    "methods" | "bankName" | "accountHolder" | "accountNumber" | "branchCode" | "accountType" | "cashsendPhone",
    string
  >
>;

export const EMPTY_PAYOUT: PayoutDetails = {
  acceptsBank: true,
  bankName: "",
  accountHolder: "",
  accountNumber: "",
  branchCode: "",
  accountType: "",
  acceptsCashSend: false,
  cashsendPhone: "",
};

export type PayoutColumns = Pick<
  Provider,
  | "payout_method"
  | "bank_name"
  | "account_holder"
  | "account_number"
  | "branch_code"
  | "account_type"
  | "cashsend_phone"
  | "cashsend_bank"
>;

/** Columns that count as "where the money goes": changing any needs the PIN. */
export const PAYOUT_KEYS: readonly (keyof PayoutColumns)[] = [
  "payout_method",
  "bank_name",
  "account_holder",
  "account_number",
  "branch_code",
  "account_type",
  "cashsend_phone",
  "cashsend_bank",
];

/** The bank's universal branch code, or "" if we don't know it. */
export const defaultBranchCode = (bankName: string) => BANK_BRANCH_CODES[bankName] ?? "";

/**
 * Form values from a provider row. Older rows have no account holder or
 * branch code yet, so those are prefilled with the provider's name and the
 * bank's universal code for them to check.
 */
export function payoutFromProvider(provider: PayoutColumns & Pick<Provider, "full_name">): PayoutDetails {
  const bankName = provider.bank_name ?? "";
  return {
    acceptsBank: Boolean(provider.bank_name && provider.account_number),
    bankName,
    accountHolder: provider.account_holder ?? (bankName ? provider.full_name : ""),
    accountNumber: provider.account_number ?? "",
    branchCode: provider.branch_code ?? defaultBranchCode(bankName),
    accountType: provider.account_type ?? "",
    acceptsCashSend: Boolean(provider.cashsend_phone),
    cashsendPhone: provider.cashsend_phone ? formatSAPhone(provider.cashsend_phone) : "",
  };
}

export function validatePayout(details: PayoutDetails): PayoutErrors {
  const errors: PayoutErrors = {};

  if (!details.acceptsBank && !details.acceptsCashSend) {
    errors.methods = "Choose at least one way to get paid.";
  }
  if (details.acceptsBank) {
    if (!details.bankName) errors.bankName = "Choose your bank.";
    const holder = details.accountHolder.trim();
    if (holder.length < 2) errors.accountHolder = "Enter the name on the account, as your bank shows it.";
    else if (holder.length > 80) errors.accountHolder = "Keep the account name to 80 letters or fewer.";
    const accountError = validateAccountNumber(details.accountNumber);
    if (accountError) errors.accountNumber = accountError;
    if (!/^\d{6}$/.test(details.branchCode.replace(/\s/g, ""))) {
      errors.branchCode = "Enter your 6-digit branch code. It's in your banking app under account details.";
    }
    if (!details.accountType) errors.accountType = "Choose cheque or savings.";
  }
  if (details.acceptsCashSend) {
    const phoneError = validatePhone(details.cashsendPhone, { required: true });
    if (phoneError) errors.cashsendPhone = phoneError;
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
    account_holder: details.acceptsBank ? details.accountHolder.trim().replace(/\s+/g, " ") : null,
    account_number: details.acceptsBank ? details.accountNumber.replace(/\s/g, "") : null,
    branch_code: details.acceptsBank ? details.branchCode.replace(/\s/g, "") : null,
    account_type: details.acceptsBank && details.accountType ? details.accountType : null,
    cashsend_phone: details.acceptsCashSend ? normalizeSAPhone(details.cashsendPhone) : null,
    cashsend_bank: null,
  };
}
