// src/components/marketing/LegalShell.tsx
// Shared layout for the privacy policy and terms: readable prose, contents list.
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/marketing/SiteChrome";
import { SITE } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

export interface LegalShellProps {
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
}

export function LegalShell({ title, intro, sections }: LegalShellProps) {
  return (
    <div className="min-h-dvh bg-cream text-ink">
      <SiteHeader sections={false} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-14">
        <h1 className="font-heading text-[40px] leading-tight sm:text-[48px]">{title}</h1>
        <p className="mt-2 text-[15px] text-muted">Last updated {SITE.legalUpdated}</p>
        <div className="legal mt-6">{intro}</div>

        <nav aria-label="Contents" className="mt-8 rounded-3xl border border-line bg-white p-5">
          <p className="text-[15px] font-semibold text-ink">Contents</p>
          <ol className="mt-2 grid gap-1 text-[15px] sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-block py-1 text-jade-600 underline-offset-2 hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <h2>
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
