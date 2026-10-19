// src/components/marketing/SiteChrome.tsx
// Header and footer for the public website (landing, privacy, terms).
import Link from "next/link";
import { Lockup } from "@/components/brand/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { SITE, supportWhatsAppUrl } from "@/lib/site";

export function SiteHeader({ sections = true }: { sections?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="PayLink home" className="rounded-lg focus-visible:outline-3 focus-visible:outline-jade-600">
          <Lockup />
        </Link>
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-2">
          {sections && (
            <span className="hidden items-center gap-1 md:flex">
              <a href="#how" className="rounded-lg px-3 py-2 text-[15px] font-semibold text-muted hover:text-jade">
                How it works
              </a>
              <a href="#pricing" className="rounded-lg px-3 py-2 text-[15px] font-semibold text-muted hover:text-jade">
                Pricing
              </a>
              <a href="#faq" className="rounded-lg px-3 py-2 text-[15px] font-semibold text-muted hover:text-jade">
                Questions
              </a>
            </span>
          )}
          <Link href="/login" className="rounded-lg px-3 py-2 text-[15px] font-semibold text-jade hover:bg-mist">
            Sign in
          </Link>
          <Link href="/login?mode=create" className={`${buttonClasses({ variant: "primary" })} hidden sm:inline-flex`}>
            Start free
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const whatsapp = supportWhatsAppUrl();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs space-y-3">
          <Lockup />
          <p className="text-[15px] leading-relaxed text-muted">
            Payment links and QR codes for people who work on the go. Made in Johannesburg.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 text-[15px] sm:grid-cols-3">
          <Link href="/login?mode=create" className="font-semibold text-jade hover:underline">
            Create account
          </Link>
          <Link href="/login" className="text-muted hover:text-jade">
            Sign in
          </Link>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-jade">
              WhatsApp us
            </a>
          )}
          <Link href="/privacy" className="text-muted hover:text-jade">
            Privacy policy
          </Link>
          <Link href="/terms" className="text-muted hover:text-jade">
            Terms of use
          </Link>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 text-sm text-muted sm:px-6">
        © {year} {SITE.legalName.startsWith("[") ? SITE.name : SITE.legalName.trim()}. PayLink is not a bank
        and never holds customers&apos; money.
      </p>
    </footer>
  );
}
