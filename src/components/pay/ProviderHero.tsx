// src/components/pay/ProviderHero.tsx
// The jade card at the top of the payment page: who is asking, for what, how much.
import { Avatar, MoneyHero } from "@/components/ui/Surface";

export interface ProviderHeroProps {
  name: string;
  trade: string;
  description: string;
  amountCents: number;
  /** Small line under the amount, e.g. "Link open until 22 Oct". */
  note?: string;
  /** PayLink has checked this provider by hand. */
  verified?: boolean;
}

export function ProviderHero({
  name,
  trade,
  description,
  amountCents,
  note,
  verified = false,
}: ProviderHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-4xl bg-jade px-5 py-[22px] text-white">
      <div aria-hidden="true" className="brand-pattern absolute -top-2.5 -right-2.5 h-[140px] w-[160px]" />
      <div className="relative flex items-center gap-3.5">
        <Avatar name={name} size="lg" verified={verified} onJade />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-[27px]">{name}</h1>
          <p className="mt-0.5 text-sm font-medium text-mint">
            {trade}
            {verified && " · Verified by PayLink"}
          </p>
        </div>
      </div>
      <div className="relative my-5 h-px bg-white/15" />
      <div className="relative flex flex-col gap-1.5">
        <p className="text-[15px] font-semibold text-mint">{description}</p>
        <MoneyHero cents={amountCents} size={60} centsClassName="text-mint" className="leading-[0.95]" />
        {note && <p className="text-sm text-mint">{note}</p>}
      </div>
    </section>
  );
}

/** Compact white card naming the provider and job, for message screens. */
export function ProviderSummary({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-white px-3.5 py-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-extrabold tracking-[-0.02em] text-ink">{name}</p>
        <p className="truncate text-sm text-muted">{detail}</p>
      </div>
    </div>
  );
}
