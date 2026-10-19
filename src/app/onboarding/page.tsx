// src/app/onboarding/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { AuthShell } from "@/components/ui/AuthShell";
import { authEmailToPhone } from "@/lib/auth/pin";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: provider, error } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (provider) redirect("/dashboard");

  // The number they signed in with (stored in the placeholder login email).
  const metadataPhone = (user.user_metadata as { phone?: unknown }).phone;
  const phone =
    authEmailToPhone(user.email) ?? (typeof metadataPhone === "string" ? metadataPhone : "");

  return (
    <AuthShell title="Set up PayLink" description="Two quick steps, about 2 minutes.">
      <OnboardingWizard userId={user.id} phone={phone} />
    </AuthShell>
  );
}
