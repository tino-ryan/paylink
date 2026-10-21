// next.config.ts
import path from "node:path";
import type { NextConfig } from "next";

const projectRoot = path.join(__dirname);

const nextConfig: NextConfig = {
  // Pin the project root. A stray package-lock.json in the home folder made
  // Next guess the wrong root (the "multiple lockfiles" warning).
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,

  experimental: {
    // Keep pages the phone has already loaded (or prefetched from the bottom
    // nav) for 30 seconds, so switching tabs is instant instead of a fresh
    // server round trip each time. Saving anything clears this early.
    staleTimes: { dynamic: 30, static: 60 },
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        // The service worker must never be cached, or phones keep running an
        // old version after you deploy a fix.
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
