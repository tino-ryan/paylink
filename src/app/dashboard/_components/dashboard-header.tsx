// src/app/dashboard/_components/dashboard-header.tsx
// Slim top bar for every signed-in screen: wordmark left, your initials right.
import Link from "next/link";
import { Wordmark } from "@/components/brand/Logo";
import { initialsOf } from "@/components/ui/Surface";

export function DashboardHeader({ providerName }: { providerName: string }) {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 pt-[env(safe-area-inset-top)] backdrop-blur print:hidden">
      <div className="mx-auto flex h-[60px] max-w-md items-center justify-between px-4">
        <Link
          href="/dashboard"
          aria-label="PayLink, your jobs"
          className="flex min-h-11 items-center rounded-lg focus-visible:outline-3 focus-visible:outline-jade-600"
        >
          <Wordmark className="text-2xl" />
        </Link>
        <Link
          href="/dashboard/settings"
          aria-label={`Profile and settings for ${providerName}`}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-apricot-soft font-display text-base font-extrabold text-jade focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jade-600"
        >
          {initialsOf(providerName)}
        </Link>
      </div>
    </header>
  );
}
