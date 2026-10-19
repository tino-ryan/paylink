// src/app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "./_components/dashboard-header";
import { BottomNav } from "./_components/bottom-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: provider, error } = await supabase
    .from("providers")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!provider) redirect("/onboarding");

  return (
    <div className="min-h-dvh bg-cream print:min-h-0 print:bg-white">
      <DashboardHeader providerName={(provider as { full_name: string }).full_name} />
      {/* Bottom padding keeps content clear of the fixed bottom nav. */}
      <main className="mx-auto max-w-md px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] print:max-w-none print:p-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
