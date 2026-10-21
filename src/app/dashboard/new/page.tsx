// src/app/dashboard/new/page.tsx
import { redirect } from "next/navigation";
import { getMyProvider } from "@/lib/auth/session";
import { NewRequestForm } from "@/components/dashboard/NewRequestForm";
import { PageHeader } from "@/components/ui/Surface";

export default async function NewRequestPage() {
  const provider = await getMyProvider();
  if (!provider) redirect("/onboarding");

  return (
    <div className="space-y-5">
      <PageHeader
        title="New payment request"
        description="You'll get a link and QR code to send your customer."
        backHref="/dashboard"
        backLabel="Your jobs"
      />
      <NewRequestForm providerId={provider.id} />
    </div>
  );
}
