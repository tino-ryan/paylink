// src/app/login/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/ui/AuthShell";

interface Props {
  searchParams: Promise<{ mode?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { mode } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already signed in: send them on.
  if (user) {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    redirect(provider ? "/dashboard" : "/onboarding");
  }

  return (
    <AuthShell
      title="Send a link. Get paid."
      description="Send a payment link by WhatsApp. Your customer pays from their phone, no app needed."
    >
      <LoginForm initialMode={mode === "create" ? "create" : "signin"} />
    </AuthShell>
  );
}
