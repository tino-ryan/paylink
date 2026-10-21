// src/lib/site.ts
//
// Business details shown on the landing page, privacy policy and terms.
// ⚠️ Fill in every value in [square brackets] before you show the site to
// the public. POPIA requires a real responsible party and Information Officer.

export const SITE = {
  name: "PayLink",
  tagline: "Send a link. Get paid.",
  description:
    "Payment links and QR codes for South African service providers. Customers pay from their own banking app. No card machine, no app to download.",

  /** Registered company name, e.g. "PayLink Technologies (Pty) Ltd". */
  legalName: "Tinotenda Gozho ",
  /** CIPC registration number, e.g. "2026/123456/07". */
  registrationNumber: "[CIPC registration number]",
  /** Where letters can reach you. */
  address: " Johannesburg, Gauteng, 2194",
  /** Monitored inbox for privacy and legal questions. */
  email: "tinogozho2@gmail.com",
  /** The person responsible for POPIA compliance (often the founder). */
  informationOfficer: "Tinotenda Gozho",

  /** When the privacy policy and terms last changed. */
  legalUpdated: "19 October 2026",
} as const;

/** WhatsApp support link, or null if NEXT_PUBLIC_SUPPORT_WHATSAPP isn't set. */
export function supportWhatsAppUrl(
  message = "Hi PayLink, I have a question.",
): string | null {
  const number = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}

/**
 * Absolute site URL without a trailing slash, e.g. "https://paylink.co.za".
 * Server-only (every caller is a Server Component or route). In order:
 *  1. APP_URL: set this in Vercel / .env.local. Not NEXT_PUBLIC_: the browser
 *     never needs it, so Vercel doesn't warn about it.
 *  2. NEXT_PUBLIC_APP_URL: the old name, still honoured.
 *  3. VERCEL_PROJECT_PRODUCTION_URL: set automatically by Vercel, so a deploy
 *     works even if you forget 1.
 *  4. localhost for local development.
 */
export function siteUrl(): string {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const url = configured || (vercel ? `https://${vercel}` : "http://localhost:3000");
  return url.trim().replace(/\/$/, "");
}
