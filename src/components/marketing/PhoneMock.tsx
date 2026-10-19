// src/components/marketing/PhoneMock.tsx
// The landing-page hero picture: a phone showing a real PayLink payment page,
// built from the same components customers see, plus the alert the provider
// gets. Purely decorative for screen readers (the page text says it all).
import { Wordmark } from "@/components/brand/Logo";
import { ProviderHero } from "@/components/pay/ProviderHero";

export function PhoneMock() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[340px] select-none">
      {/* Phone */}
      <div className="rounded-[44px] bg-ink p-2.5 shadow-[0_30px_60px_-20px_rgba(17,32,26,0.45)]">
        <div className="relative overflow-hidden rounded-[36px] bg-cream">
          <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-ink" />
          <div className="flex flex-col gap-3 px-3.5 pt-2 pb-5">
            <div className="flex h-10 items-center justify-between">
              <Wordmark className="text-lg" />
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-jade-600">
                Secure
              </span>
            </div>
            <div className="pointer-events-none">
              <ProviderHero
                name="Thandi Mokoena"
                trade="Hairstylist"
                description="Braids and wash"
                amountCents={45000}
                note="Link open until 26 Oct"
                verified
              />
            </div>
            <div className="rounded-[20px] bg-white p-3">
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-sand p-1 text-center text-[12px] font-bold">
                <span className="rounded-lg bg-white py-1.5 text-jade">Bank transfer</span>
                <span className="py-1.5 text-muted">CashSend</span>
              </div>
              <dl className="mt-2 divide-y divide-line-soft text-[12px]">
                {[
                  ["Bank", "Capitec"],
                  ["Account", "1234 567 890"],
                  ["Reference", "BRA-K7M4QX"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5">
                    <dt className="text-muted">{label}</dt>
                    <dd className="font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl bg-jade py-3 text-center text-[14px] font-bold text-white shadow-[inset_0_-3px_0_var(--color-jade-900)]">
              I&apos;ve sent the money
            </div>
          </div>
        </div>
      </div>

      {/* The alert on the provider's phone */}
      <div className="absolute -right-3 bottom-20 w-[230px] rounded-2xl bg-white p-3 shadow-[0_18px_40px_-12px_rgba(17,32,26,0.35)] sm:-right-16">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-jade">
            <svg width="20" height="20" viewBox="0 0 64 64">
              <path d="M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9" fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
              <circle cx="32" cy="32" r="7.5" fill="var(--color-apricot)" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-ink">Customer says they&apos;ve paid</span>
            <span className="block text-[12px] leading-snug text-muted">
              R 450.00 for Braids and wash. Check your bank, then mark it paid.
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
