// src/app/dashboard/new/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewRequestForm } from "@/components/dashboard/NewRequestForm";

export default async function NewRequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/onboarding");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <h1 className="font-semibold text-gray-900">New payment request</h1>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 py-6">
        <NewRequestForm providerId={provider.id} />
      </div>
    </main>
  );
}
