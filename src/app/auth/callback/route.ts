// src/app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if provider profile exists
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: provider } = await supabase
          .from("providers")
          .select("id")
          .eq("user_id", user.id)
          .single();

        return NextResponse.redirect(
          new URL(provider ? "/dashboard" : "/onboarding", request.url),
        );
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth", request.url));
}
