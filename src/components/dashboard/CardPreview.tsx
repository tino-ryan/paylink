// src/components/dashboard/CardPreview.tsx
"use client";

import { QRCodeSVG } from "qrcode.react";
import { LogoMark, Wordmark } from "@/components/brand/Logo";

interface Props {
  fullName: string;
  trade: string;
  payUrl: string;
}

export function CardPreview({ fullName, trade, payUrl }: Props) {
  const displayUrl = payUrl.replace(/^https?:\/\//, "");

  return (
    <>
      {/*
        Print: the rest of the page is display:none (print:hidden), so the card
        and sticker flow from the top of one A4 page. Neither may split across
        pages, and the jade background must print (browsers drop it by default).
      */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          html, body { background: #fff !important; }
          .print-area { gap: 12mm !important; padding-top: 0 !important; }
          .print-area .print-block { break-inside: avoid; page-break-inside: avoid; }
          .print-area, .print-area * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      <div className="print-area flex flex-col items-center gap-8">
        {/* QR card: hand it out, stick it up, or print and cut out. */}
        <div className="print-block w-full">
          <p className="mb-3 text-center text-sm text-muted print:hidden">
            Your QR card: show it, print it, or stick it on your toolbox
          </p>
          <div className="relative mx-auto flex w-full max-w-[360px] flex-col gap-3.5 overflow-hidden rounded-[26px] bg-jade p-4">
            <div aria-hidden="true" className="brand-pattern absolute inset-0" />
            <div className="relative flex flex-col gap-0.5 px-1.5 pt-1.5 text-white">
              <span className="text-base font-semibold text-mint">Scan to pay</span>
              <span className="truncate font-heading text-[30px]">{fullName}</span>
              <span className="text-sm font-medium text-mint">{trade}</span>
            </div>
            <div className="relative flex flex-col items-center gap-3 rounded-3xl bg-white px-4 py-5">
              <div className="relative p-[18px]">
                <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true" className="absolute top-0 left-0">
                  <path d="M4 44V22A18 18 0 0 1 22 4h22" fill="none" stroke="var(--color-jade)" strokeWidth="7" strokeLinecap="round" />
                </svg>
                <svg width="44" height="44" viewBox="0 0 48 48" aria-hidden="true" className="absolute right-0 bottom-0">
                  <path d="M44 4v22a18 18 0 0 1-18 18H4" fill="none" stroke="var(--color-jade)" strokeWidth="7" strokeLinecap="round" />
                </svg>
                <QRCodeSVG value={payUrl} size={200} level="M" marginSize={0} bgColor="#ffffff" fgColor="#000000" />
              </div>
              <span className="break-all text-center text-base font-bold text-ink">{displayUrl}</span>
            </div>
            <div className="relative flex items-center justify-between px-1.5 pb-0.5">
              <Wordmark tone="white" className="text-[26px]" />
              <span className="text-sm font-semibold text-mint">EFT · CashSend</span>
            </div>
          </div>
        </div>

        {/* Round sticker */}
        <div className="print-block flex w-full flex-col items-center">
          <p className="mb-3 text-center text-sm text-muted print:hidden">
            Sticker: for your phone, toolbox or vehicle
          </p>
          <div className="flex h-[170px] w-[170px] flex-col items-center justify-center gap-1.5 rounded-full border-[6px] border-jade bg-white">
            <QRCodeSVG value={payUrl} size={92} level="M" marginSize={0} bgColor="#ffffff" fgColor="#000000" />
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-jade">
              <LogoMark size={14} />
              Scan to pay
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
