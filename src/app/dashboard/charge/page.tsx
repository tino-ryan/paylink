// src/app/dashboard/charge/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Surface";
import { ChargeTerminal } from "./_components/charge-terminal";

export default async function ChargePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("providers")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) redirect("/onboarding");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set in .env.local");

  return (
    <div className="space-y-4">
      <PageHeader title="Charge" description="For a customer standing in front of you." />
      <ChargeTerminal providerName={(data as { full_name: string }).full_name} appUrl={appUrl} />
    </div>
  );
}
