// src/lib/validation.ts
// Plain functions, safe on the client and the server. Each validator returns
// an error message a provider can act on, or null when the value is fine.
import { RESERVED_SLUGS } from "./constants";

// ---- Phone numbers (South African cellphones) ----

/**
 * Normalise a South African cellphone number to 10 digits starting with 0.
 * Accepts "071 234 5678", "071-234-5678", "+27 71 234 5678", "27712345678".
 * Returns null if it isn't a valid SA cellphone number.
 */
export const normalizeSAPhone = (input: string): string | null => {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+27")) digits = `0${digits.slice(3)}`;
  else if (digits.startsWith("27") && digits.length === 11) digits = `0${digits.slice(2)}`;
  return /^0[6-8]\d{8}$/.test(digits) ? digits : null;
};

/** Longest a typed SA number can be: "+27 71 234 5678". */
export const PHONE_INPUT_MAX = 16;

/**
 * Cleans a phone field as the user types: digits only (plus spaces/dashes
 * between them and one leading "+"), capped at one SA number: 10 digits
 * (071…) or 11 with the country code (27… / +27…).
 */
export const cleanPhoneInput = (input: string): string => {
  const intl = /^\s*(\+|27)/.test(input);
  const maxDigits = intl ? 11 : 10;
  let out = "";
  let digits = 0;
  for (const ch of input) {
    if (ch >= "0" && ch <= "9") {
      if (digits >= maxDigits) continue;
      digits++;
      out += ch;
    } else if ((ch === " " || ch === "-") && digits > 0 && digits < maxDigits && !/[ -]$/.test(out)) {
      out += ch;
    } else if (ch === "+" && out === "") {
      out += ch;
    }
  }
  return out;
};

/** "0712345678" → "071 234 5678". Leaves anything else unchanged. */
export const formatSAPhone = (phone: string): string =>
  /^0\d{9}$/.test(phone) ? `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}` : phone;

export const validatePhone = (input: string, { required }: { required: boolean }) => {
  if (!input.trim()) return required ? "Enter a cellphone number." : null;
  return normalizeSAPhone(input) ? null : "Enter a South African cellphone number, like 071 234 5678.";
};

// ---- Names & text ----

export const validateFullName = (input: string): string | null => {
  const name = input.trim();
  if (!name) return "Enter your name.";
  if (name.length < 2) return "Your name looks too short.";
  if (name.length > 80) return "Keep your name under 80 characters.";
  return null;
};

export const validateRequired = (input: string, message: string): string | null =>
  input.trim() ? null : message;

// ---- Bank details ----

export const validateAccountNumber = (input: string): string | null => {
  const digits = input.replace(/\s/g, "");
  if (!digits) return "Enter your account number.";
  if (!/^\d+$/.test(digits)) return "Account numbers only contain digits.";
  if (digits.length < 6 || digits.length > 16) return "That doesn't look like a full account number.";
  return null;
};

// ---- Profile link (slug) ----

export const SLUG_MIN = 3;
export const SLUG_MAX = 40;

/** Lowercase, keep letters/digits/hyphens, collapse repeats. Used while typing. */
export const cleanSlugInput = (input: string): string =>
  input
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .slice(0, SLUG_MAX);

/** The slug as it will be saved: no leading or trailing hyphens. */
export const finalizeSlug = (input: string): string => input.replace(/^-+|-+$/g, "");

export const validateSlug = (input: string): string | null => {
  const slug = finalizeSlug(input);
  if (slug.length < SLUG_MIN) return `Use at least ${SLUG_MIN} letters or numbers.`;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return "Use lowercase letters, numbers and single hyphens only.";
  }
  if (RESERVED_SLUGS.has(slug)) return "That address is reserved. Try adding your name or area.";
  return null;
};

// ---- PIN (6 digits) ----

export const PIN_LENGTH = 6;

/** Keep digits only, max 6. Used while typing. */
export const cleanPinInput = (input: string): string => input.replace(/\D/g, "").slice(0, PIN_LENGTH);

const COMMON_PINS = new Set([
  "000000", "111111", "121212", "123123", "112233", "123321", "696969",
  "102030", "101010", "202020", "159753", "147258", "789456", "000123",
]);

/** Easy-to-guess PINs: all the same digit, straight runs (123456, 987654), common patterns. */
export const isWeakPin = (pin: string): boolean => {
  if (/^(\d)\1+$/.test(pin)) return true;
  if (COMMON_PINS.has(pin)) return true;
  const digits = pin.split("").map(Number);
  const steps = digits.slice(1).map((d, i) => d - digits[i]);
  return steps.every((s) => s === 1) || steps.every((s) => s === -1);
};

export const validatePin = (pin: string): string | null => {
  if (pin.length === 0) return "Enter your PIN.";
  if (!/^\d{6}$/.test(pin)) return `Your PIN is ${PIN_LENGTH} digits.`;
  return null;
};

/** For choosing a new PIN: format plus strength. */
export const validateNewPin = (pin: string): string | null => {
  if (pin.length === 0) return "Choose a 6-digit PIN.";
  if (!/^\d{6}$/.test(pin)) return `Use exactly ${PIN_LENGTH} digits.`;
  if (isWeakPin(pin)) return "That PIN is too easy to guess. Avoid repeats and runs like 123456.";
  return null;
};
