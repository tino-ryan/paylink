// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { getMyProvider, getSessionUser } from "@/lib/auth/session";
import { DashboardHeader } from "./_components/dashboard-header";
import { BottomNav } from "./_components/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared with the page below via cache(): one lookup per request.
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const provider = await getMyProvider();
  if (!provider) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-cream print:min-h-0 print:bg-white">
      <DashboardHeader providerName={provider.full_name} />
      {/* Bottom padding keeps content clear of the fixed bottom nav. */}
      <main className="mx-auto max-w-md px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] print:max-w-none print:p-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
