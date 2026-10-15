// src/components/dashboard/CardPreview.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";

interface Props {
  fullName: string;
  trade: string;
  slug: string;
  payUrl: string;
}

export function CardPreview({ fullName, trade, slug, payUrl }: Props) {
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>

      <div className="print-area flex flex-col items-center gap-8">
        {/* Business card */}
        <div className="w-full">
          <p className="text-xs text-gray-400 mb-3 text-center print:hidden">
            Business card — hand to customers or print and cut out
          </p>
          <div
            className="bg-white rounded-2xl overflow-hidden border border-gray-200 w-full"
            style={{ maxWidth: "360px", margin: "0 auto" }}
          >
            {/* Green top bar */}
            <div className="bg-emerald-600 h-1.5 w-full" />

            <div className="flex items-stretch p-5 gap-4">
              {/* Left side */}
              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs mb-3">
                    {initials}
                  </div>
                  <p className="font-bold text-gray-900 text-base leading-tight truncate">
                    {fullName}
                  </p>
                  <p className="text-emerald-600 text-xs font-medium mt-0.5">
                    {trade}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-gray-400 text-xs">Scan to pay</p>
                  <p className="text-gray-600 font-mono text-xs break-all">
                    paylink.co.za/{slug}
                  </p>
                  <p className="text-gray-300 text-xs mt-2 tracking-widest font-semibold">
                    PAYLINK
                  </p>
                </div>
              </div>

              {/* Right side — QR */}
              <div className="flex items-center justify-center shrink-0">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-2">
                  <QRCodeSVG
                    value={payUrl}
                    size={110}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticker */}
        <div className="w-full flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-3 text-center print:hidden">
            Sticker — stick on your phone, toolbox, or vehicle
          </p>
          <div
            className="flex flex-col items-center justify-center bg-white border-4 border-emerald-600 rounded-full"
            style={{ width: "150px", height: "150px" }}
          >
            <QRCodeSVG
              value={payUrl}
              size={85}
              level="M"
              includeMargin={false}
            />
            <p className="text-gray-400 mt-1" style={{ fontSize: "9px" }}>
              Scan to pay
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
