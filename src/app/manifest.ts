// src/app/manifest.ts
// Served by Next.js at /manifest.webmanifest and linked automatically.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/dashboard",
    name: "PayLink — Get paid instantly",
    short_name: "PayLink",
    description:
      "Send a link. Get paid. Payment links and QR codes for people who work on the go.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F3EA", // brand cream, the app background
    theme_color: "#0E4D3C", // brand jade, the primary colour
    categories: ["finance", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
