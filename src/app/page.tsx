// src/app/page.tsx
// The public landing page. Static: no database calls, so it's served from
// Vercel's edge cache and loads fast on slow mobile data.
import type { Metadata } from "next";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { PhoneMock } from "@/components/marketing/PhoneMock";
import { SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";
import { SITE, supportWhatsAppUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${SITE.name}: ${SITE.tagline}` },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name}: ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
    siteName: SITE.name,
    locale: "en_ZA",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const STEPS = [
  {
    title: "Type the amount",
    body: "Tap Charge, enter what the job costs and what it was for. Takes about ten seconds.",
  },
  {
    title: "Your customer scans or taps",
    body: "Show the QR code on your phone, or send the link on WhatsApp. They open it in their browser and see your bank or CashSend details with the exact reference.",
  },
  {
    title: "You know it's paid",
    body: "They tap “I've sent the money” and your phone buzzes. Check your bank, mark it paid, and a numbered receipt is ready to share.",
  },
] as const;

const FEATURES = [
  {
    title: "QR code at the counter",
    body: "Customer in front of you? Open Charge and they scan your screen. No card machine to buy or charge.",
    icon: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2v2h-2zM18 14h2v2h-2z",
  },
  {
    title: "Links on WhatsApp",
    body: "Finished the job and already gone? Send the link. It shows your name, the job and the amount, so nobody gets it wrong.",
    icon: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  },
  {
    title: "Proper receipts",
    body: "Every paid job gets a numbered receipt (REC-0001, REC-0002…) your customer can save or print.",
    icon: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6",
  },
  {
    title: "Payment alerts",
    body: "Add PayLink to your home screen and get a notification the moment a customer says they've paid.",
    icon: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  },
  {
    title: "Your own pay page",
    body: "A personal link with your name on it and a printable QR card for your shop wall or bakkie.",
    icon: "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM8 15c1-2 7-2 8 0M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4",
  },
  {
    title: "Light on data",
    body: "Works on any smartphone browser, even an older Android. Sign in with your number and a PIN. No SMS, no email needed.",
    icon: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  },
] as const;

const TRADES = [
  "Plumbers",
  "Electricians",
  "Hairstylists",
  "Barbers",
  "Nail techs",
  "Painters",
  "Builders",
  "Gardeners",
  "Cleaners",
  "Mechanics",
  "Tutors",
  "Caterers",
  "Spaza shops",
  "Market stalls",
  "Movers",
  "Photographers",
] as const;

const FAQ = [
  {
    q: "Does PayLink hold my money?",
    a: "No. Customers pay straight into your own bank account or CashSend number. PayLink just shows them the right details and reference, and tells you when they say they've paid. Your money never passes through us.",
  },
  {
    q: "Do my customers need an app or an account?",
    a: "No. They open the link or scan the QR code with their phone camera, and it opens in their browser. They pay with the banking app they already use.",
  },
  {
    q: "How do I know the money really arrived?",
    a: "When a customer taps “I've sent the money”, you get an alert, but always check your bank or CashSend SMS before you mark the job as paid. Instant payments usually show within minutes; a normal EFT between different banks can take longer.",
  },
  {
    q: "What does it cost?",
    a: "Nothing while we're in our pilot. If we ever introduce fees, we'll tell you at least 30 days before, and you can stop using PayLink at any time.",
  },
  {
    q: "Can customers pay by card?",
    a: "Not yet. Right now customers pay by bank transfer or CashSend. Card and instant EFT are next on our list.",
  },
  {
    q: "What if I forget my PIN?",
    a: "Message us on WhatsApp from the number you signed up with. We'll check it's really you and set a new PIN.",
  },
] as const;

function Icon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function Home() {
  const whatsapp = supportWhatsAppUrl("Hi PayLink, I'd like to know more.");

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <SiteHeader />

      <main id="main">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16 md:pb-24">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-jade-600">
              <span className="h-2 w-2 rounded-full bg-apricot" aria-hidden="true" />
              Free during our Johannesburg pilot
            </p>
            <h1 className="font-heading text-[44px] leading-[1.02] text-ink sm:text-[60px]">
              Send a link.{" "}
              <span className="text-jade">Get paid.</span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted">
              PayLink gives you a payment link and QR code in seconds. Your customer pays from their
              own banking app, straight into your account. No card machine. No app to download. No
              chasing.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login?mode=create" className={buttonClasses({ variant: "accent", size: "lg" })}>
                Create your free account
              </Link>
              <a href="#how" className={buttonClasses({ variant: "secondary", size: "lg" })}>
                See how it works
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-muted">
              {["Money goes straight to you", "Sign up in 2 minutes", "Works on any phone"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-paid-dot)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12l5 5 9-10" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <PhoneMock />
        </section>

        {/* How it works */}
        <section id="how" className="scroll-mt-20 border-y border-line bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
            <h2 className="font-heading text-[34px] leading-tight sm:text-[42px]">
              Three steps. Paid on the spot.
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="rounded-3xl bg-cream p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-jade font-heading text-xl text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-heading text-2xl">{step.title}</h3>
                  <p className="mt-2 text-[16px] leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Trust band */}
        <section className="relative overflow-hidden bg-jade text-white">
          <div aria-hidden="true" className="brand-pattern absolute -top-6 -right-6 h-[260px] w-[300px] opacity-70" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-20">
            <h2 className="font-heading text-[34px] leading-tight sm:text-[42px]">
              PayLink never touches your money.
            </h2>
            <div className="space-y-4 text-[17px] leading-relaxed text-mint">
              <p>
                Customers pay directly into your own bank account or CashSend number. We don&apos;t
                hold it, we don&apos;t delay it, and we don&apos;t take a cut.
              </p>
              <p>
                Every payment page shows who&apos;s asking, what for and the exact amount, so your
                customer can pay with confidence. Providers we&apos;ve checked get a verified badge.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <h2 className="max-w-2xl font-heading text-[34px] leading-tight sm:text-[42px]">
            Made for people who work on the go
          </h2>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rounded-3xl border border-line bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist text-jade-600">
                  <Icon d={f.icon} />
                </span>
                <h3 className="mt-4 font-heading text-[22px]">{f.title}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-muted">{f.body}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14">
            <h3 className="font-heading text-2xl">Built for every kind of trade</h3>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Trades">
              {TRADES.map((t) => (
                <li key={t} className="rounded-full bg-sand px-4 py-2 text-[15px] font-semibold text-ink">
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-20">
            <div className="space-y-4">
              <h2 className="font-heading text-[34px] leading-tight sm:text-[42px]">Simple pricing</h2>
              <p className="text-[17px] leading-relaxed text-muted">
                We&apos;re running a pilot with service providers in Johannesburg. Use everything
                for free while we learn what you need.
              </p>
            </div>
            <div className="rounded-4xl border-2 border-jade bg-cream p-7">
              <p className="text-[15px] font-semibold text-jade-600">Pilot</p>
              <p className="mt-1 font-heading text-[56px] leading-none">R 0</p>
              <p className="mt-1 text-[15px] text-muted">per month, no card needed</p>
              <ul className="mt-6 space-y-2.5 text-[16px]">
                {[
                  "Unlimited payment links and QR codes",
                  "Numbered receipts",
                  "Payment alerts on your phone",
                  "Your own pay page and printable QR card",
                  "30 days' notice before any fees",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <svg className="mt-1 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-paid-dot)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?mode=create"
                className={`${buttonClasses({ variant: "primary", size: "lg", fullWidth: true })} mt-7`}
              >
                Start free
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6 md:py-20">
          <h2 className="font-heading text-[34px] leading-tight sm:text-[42px]">Questions</h2>
          <div className="mt-8 divide-y divide-line rounded-3xl border border-line bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <svg className="shrink-0 transition-transform group-open:rotate-45" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-jade-600)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p className="pb-5 text-[16px] leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
          {whatsapp && (
            <p className="mt-6 text-[16px] text-muted">
              Something else?{" "}
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="font-semibold text-jade underline underline-offset-2">
                Ask us on WhatsApp
              </a>
              .
            </p>
          )}
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-4xl bg-jade px-6 py-12 text-center text-white sm:py-16">
            <div aria-hidden="true" className="brand-pattern absolute -bottom-8 -left-8 h-[200px] w-[240px] opacity-60" />
            <h2 className="relative font-heading text-[34px] leading-tight sm:text-[44px]">
              Your next job could be paid on the spot.
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-[17px] text-mint">
              Sign up with your phone number and a PIN. Add your bank or CashSend details and
              you&apos;re ready.
            </p>
            <Link
              href="/login?mode=create"
              className={`${buttonClasses({ variant: "accent", size: "lg" })} relative mt-8`}
            >
              Create your free account
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
