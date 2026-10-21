// src/proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie when needed. getClaims() verifies the token
  // locally with Supabase's signing keys instead of a round trip to Supabase
  // on every page view, which was most of the wait on each tap.
  await supabase.auth.getClaims();

  return supabaseResponse;
}

// Skip the Supabase session refresh for static files: build assets, images,
// the service worker, the manifest and the offline page.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|sitemap.xml|robots.txt|opengraph-image|sw.js|offline.html|manifest.webmanifest|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
