// src/lib/constants.ts
// Lists shared by onboarding and settings, so both always offer the same options.

export const TRADES = [
  "Plumber",
  "Electrician",
  "Painter",
  "Tiler",
  "Carpenter",
  "Builder",
  "Gardener",
  "Domestic worker",
  "Cleaner",
  "Hairstylist",
  "Nail technician",
  "Tutor",
  "Driver",
  "Mechanic",
  "Caterer",
  "Other",
] as const;

export const BANKS = [
  "ABSA",
  "African Bank",
  "Capitec",
  "Discovery Bank",
  "FNB",
  "Nedbank",
  "Standard Bank",
  "TymeBank",
  "Other",
] as const;

/** Banks whose customers can withdraw a CashSend-style payment at an ATM. */
export const CASHSEND_BANKS = ["ABSA", "FNB", "Nedbank", "Standard Bank"] as const;

/**
 * Words that can't be used as a profile link, because a page already lives at
 * that address (paylink.co.za/login, /dashboard …) or might in future.
 */
export const RESERVED_SLUGS = new Set([
  "about",
  "admin",
  "api",
  "app",
  "apple-icon",
  "auth",
  "card",
  "contact",
  "dashboard",
  "favicon",
  "help",
  "icons",
  "login",
  "logout",
  "manifest",
  "new",
  "offline",
  "onboarding",
  "pay",
  "paylink",
  "pricing",
  "privacy",
  "receipt",
  "receipts",
  "register",
  "settings",
  "signup",
  "support",
  "sw",
  "terms",
]);
