// src/app/admin/layout.tsx
// PayLink admin. Only phone numbers in ADMIN_PHONES get in; everyone else
// sees "not found", so the area doesn't advertise that it exists.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdmin } from "@/lib/admin";
import { Lockup } from "@/components/brand/Logo";
import { formatSAPhone } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Admin · PayLink",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) notFound();

  return (
    <div className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-30 border-b border-line bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-14 max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
          <div className="flex items-center gap-3">
            <Lockup />
            <span className="rounded-full bg-apricot-soft px-2.5 py-0.5 text-sm font-bold text-apricot-ink">
              Admin
            </span>
          </div>
          <nav aria-label="Admin" className="flex items-center gap-1 text-[15px] font-semibold">
            <Link href="/admin" className="rounded-lg px-3 py-2 text-jade hover:bg-mist">
              Overview
            </Link>
            <Link href="/admin/providers" className="rounded-lg px-3 py-2 text-jade hover:bg-mist">
              Providers
            </Link>
            <Link href="/dashboard" className="rounded-lg px-3 py-2 text-muted hover:bg-mist">
              My app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-16">{children}</main>
      <p className="pb-6 text-center text-sm text-muted">Signed in as admin {formatSAPhone(admin.phone)}</p>
    </div>
  );
}
