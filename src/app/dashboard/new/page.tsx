// src/app/dashboard/new/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewRequestForm } from "@/components/dashboard/NewRequestForm";
import { PageHeader } from "@/components/ui/Surface";

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) redirect("/onboarding");

  return (
    <div className="space-y-5">
      <PageHeader
        title="New payment request"
        description="You'll get a link and QR code to send your customer."
        backHref="/dashboard"
        backLabel="Your jobs"
      />
      <NewRequestForm providerId={(data as { id: string }).id} />
    </div>
  );
}
