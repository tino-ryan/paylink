// src/lib/utils.ts
import type { RequestStatus } from "./types";

// ---- Money ----

/** Largest amount accepted from any form: R 1 000 000.00 */
export const MAX_AMOUNT_CENTS = 100_000_000;
/** Smallest amount accepted: R 1.00 */
export const MIN_AMOUNT_CENTS = 100;

/**
 * Format cents as Rand display string, using integer arithmetic only.
 * 1250 → "R 12.50"
 * 100000 → "R 1 000.00"
 *
 * Not toLocaleString: "en-ZA" gives "1 250,00" (comma decimal) on some
 * devices and "1 250.00" on others, and the server and the phone can disagree,
 * which also breaks React hydration.
 */
export const formatRand = (cents: number): string => {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(cents));
  const rands = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const remainder = (abs % 100).toString().padStart(2, "0");
  return `${sign}R ${rands}.${remainder}`;
};

/**
 * Plain amount for pasting into a banking app: 125050 → "1250.50".
 * No "R", no spaces, integer arithmetic only.
 */
export const centsToPlainAmount = (cents: number): string => {
  const abs = Math.abs(Math.trunc(cents));
  return `${cents < 0 ? "-" : ""}${Math.floor(abs / 100)}.${(abs % 100).toString().padStart(2, "0")}`;
};

/**
 * Parse a Rand amount typed by a person into integer cents, without floats.
 *
 * Accepts the ways South Africans actually type money:
 *   "350"        → 35000
 *   "350.50"     → 35050
 *   "350,50"     → 35050   (comma as decimal)
 *   "1 250"      → 125000
 *   "1,250"      → 125000  (comma as thousands — NOT R 1.25)
 *   "1,250.00"   → 125000
 *   "1 250,00"   → 125000
 *   "R 1 250"    → 125000
 *
 * Rule: a single "," or "." followed by exactly 1–2 digits at the end is the
 * decimal mark. Any other "," or "." is a thousands separator.
 *
 * Returns null for anything that isn't a positive amount.
 */
export const parseRandInput = (input: string): number | null => {
  const cleaned = input.replace(/^\s*R/i, "").replace(/[\s ]/g, "");
  if (!/^[0-9.,]+$/.test(cleaned)) return null;

  let wholePart = cleaned;
  let fractionPart = "";

  const decimalMatch = cleaned.match(/^(.*)[.,](\d{1,2})$/);
  if (decimalMatch) {
    wholePart = decimalMatch[1];
    fractionPart = decimalMatch[2];
  }

  // Whatever separators remain in the whole part are thousands separators.
  // They must group digits in threes: "1,250,000" ok, "12,50,0" not.
  if (/[.,]/.test(wholePart)) {
    if (!/^\d{1,3}([.,]\d{3})+$/.test(wholePart)) return null;
    wholePart = wholePart.replace(/[.,]/g, "");
  }

  if (wholePart === "") wholePart = "0";
  if (!/^\d+$/.test(wholePart)) return null;
  if (wholePart.length > 9) return null; // guards against overflow

  const rands = Number(wholePart);
  const cents = Number(fractionPart.padEnd(2, "0"));
  const total = rands * 100 + cents;

  return total > 0 ? total : null;
};

// ---- Receipts ----

/** 7 → "REC-0007" */
export const formatReceiptNumber = (n: number): string => `REC-${n.toString().padStart(4, "0")}`;

export const PAID_METHOD_LABELS = {
  eft: "Bank transfer (EFT)",
  cashsend: "CashSend",
  cash: "Cash",
  card: "Card",
  other: "Other",
} as const;

// ---- Status & expiry ----

/**
 * The status a person should see. A pending request past its expiry time is
 * shown as expired even though the database row still says "pending" — there
 * is no background job that flips it.
 */
export const effectiveStatus = (request: {
  status: RequestStatus;
  expires_at: string | null;
}): RequestStatus => {
  if (
    request.status === "pending" &&
    request.expires_at !== null &&
    new Date(request.expires_at).getTime() <= Date.now()
  ) {
    return "expired";
  }
  return request.status;
};

/**
 * Start of the current calendar month in South African time, as an ISO
 * string. SAST is UTC+2 all year (no daylight saving), so local midnight on
 * the 1st is 22:00 UTC on the last day of the previous month.
 */
export const startOfMonthSAST = (now: Date = new Date()): string => {
  const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
  const local = new Date(now.getTime() + SAST_OFFSET_MS);
  const localMidnightFirst = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    1,
  );
  return new Date(localMidnightFirst - SAST_OFFSET_MS).toISOString();
};

// ---- Short codes ----

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateShortCode = (): string =>
  Array.from(
    { length: 6 },
    () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)],
  ).join("");

/** Postgres error code for a unique-constraint violation. */
export const UNIQUE_VIOLATION = "23505";

// ---- CashSend references ----

/**
 * Generate a CashSend reference from description + short code.
 * "Geyser repair" + "ABC123" → "GEY-ABC123"
 */
export const generateCashSendReference = (
  description: string,
  shortCode: string,
): string => {
  const letters = description.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = letters.slice(0, 3).padEnd(3, "X"); // pad if description is very short
  return `${prefix}-${shortCode}`;
};

// ---- Slugs ----

/**
 * Convert a provider name to a URL-safe slug.
 * "Sipho's Plumbing & Repairs" → "siphos-plumbing-repairs"
 */
export const nameToSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
