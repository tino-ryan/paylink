// src/app/robots.ts
// Served at /robots.txt. Keeps signed-in areas and customers' payment pages
// out of search results. (Provider profile pages at /[slug] already set
// noindex where needed; robots.txt can't list every slug.)
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/onboarding", "/pay/", "/receipt/", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
