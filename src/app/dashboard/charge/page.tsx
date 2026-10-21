// src/app/dashboard/charge/page.tsx
import { siteUrl } from "@/lib/site";
import { redirect } from "next/navigation";
import { getMyProvider } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/Surface";
import { ChargeTerminal } from "./_components/charge-terminal";

export default async function ChargePage() {
  const provider = await getMyProvider();
  if (!provider) redirect("/onboarding");

  const appUrl = siteUrl();

  return (
    <div className="space-y-4">
      <PageHeader title="Charge" description="For a customer standing in front of you." />
      <ChargeTerminal providerName={provider.full_name} appUrl={appUrl} />
    </div>
  );
}
