// src/components/dashboard/SharePanel.tsx
"use client";

import { formatRand } from "@/lib/utils";
import { QRFrame } from "./QRFrame";
import { ShareLinks } from "./ShareLinks";

export interface SharePanelProps {
  payUrl: string;
  description: string;
  amountCents: number;
  customer?: { name: string | null; phone: string | null };
}

/** QR code to show the customer in person, plus WhatsApp and copy for remote. */
export function SharePanel({ payUrl, description, amountCents, customer }: SharePanelProps) {
  const firstName = customer?.name?.trim().split(/\s+/)[0];
  const message = `Hi${firstName ? ` ${firstName}` : ""}! Here's the payment link for ${description} (${formatRand(amountCents)}). You can pay by EFT or CashSend, no app needed:`;

  return (
    <div className="flex flex-col gap-4">
      <QRFrame url={payUrl} caption="Customer here? Let them scan this." />
      <p className="flex justify-center gap-1.5 text-center text-sm leading-[1.45] text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5" />
        </svg>
        In the sun? Turn your brightness all the way up.
      </p>
      <ShareLinks
        url={payUrl}
        message={message}
        recipient={customer?.phone ? { name: customer.name, phone: customer.phone } : null}
      />
    </div>
  );
}
