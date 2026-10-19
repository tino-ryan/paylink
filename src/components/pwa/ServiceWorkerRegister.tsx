// src/components/pwa/ServiceWorkerRegister.tsx
"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js once on every page. Renders nothing.
 *
 * Service workers only run on HTTPS or localhost. On the phone-over-Wi-Fi dev
 * address (http://192.168.x.x) registration is skipped silently; test the PWA
 * on localhost or on the Vercel deployment.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Registration failing only means no offline page or push on this
        // device. The app itself works normally, so there's nothing to show.
      });
  }, []);

  return null;
}
