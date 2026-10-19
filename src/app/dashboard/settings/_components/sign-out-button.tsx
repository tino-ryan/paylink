// src/app/dashboard/settings/_components/sign-out-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    // Even if the network call fails, the local session is cleared,
    // so sending them to the login page is always correct.
    await supabase.auth.signOut().catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button variant="secondary" fullWidth onClick={signOut} loading={loading} loadingText="Signing out…">
      Sign out
    </Button>
  );
}
