// src/components/dashboard/QRFrame.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * The QR code inside the brand frame: a jade card with two white corners,
 * holding a white panel. The QR itself is always pure black on white so
 * every phone camera reads it.
 */
export function QRFrame({ url, caption }: { url: string; caption: string }) {
  return (
    <div className="relative flex flex-col items-center gap-4 rounded-4xl bg-jade px-6 pt-[26px] pb-5">
      <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true" className="absolute top-3 left-3">
        <path d="M4 56V30A26 26 0 0 1 30 4h26" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true" className="absolute right-3 bottom-3">
        <path d="M56 4v26a26 26 0 0 1-26 26H4" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
      </svg>
      <div className="relative rounded-[18px] bg-white p-4">
        <QRCodeSVG
          value={url}
          size={220}
          level="M"
          marginSize={0}
          bgColor="#ffffff"
          fgColor="#000000"
          title={`QR code for ${url.replace(/^https?:\/\//, "")}`}
        />
      </div>
      <div className="relative flex flex-col items-center gap-0.5 text-center text-white">
        <span className="text-sm font-semibold text-mint">{caption}</span>
        <span className="break-all text-base font-bold">{url.replace(/^https?:\/\//, "")}</span>
      </div>
    </div>
  );
}
