// src/components/dashboard/ReceiptSender.tsx
// Send a receipt straight into the customer's WhatsApp chat: type their
// number once and WhatsApp opens on their chat with the receipt filled in.
// The provider can save the customer's name and number on the job (on by
// default, easy to untick). Only that provider can see them.
"use client";

import { useId, useState, type FormEvent } from "react";
import { cleanPhoneInput, formatSAPhone, normalizeSAPhone, PHONE_INPUT_MAX } from "@/lib/validation";
import { receiptLabel, receiptMessage, toWhatsAppNumber, type ReceiptInfo } from "@/lib/receipt";
import { saveJobCustomer } from "@/app/dashboard/customer-actions";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Surface";

export interface ReceiptSenderProps {
  info: ReceiptInfo;
  /** Absolute receipt page URL (receiptUrl()). */
  url: string;
  autoFocus?: boolean;
  /** Already saved on this job, if any. */
  customer?: { name: string | null; phone: string | null };
}

type ShareState = "idle" | "working" | "failed";

function openExternal(url: string) {
  // A real navigation is the most reliable way to hand off to the WhatsApp app
  // on Android, including from an installed PWA.
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (!win) window.location.href = url;
}

export function ReceiptSender({ info, url, autoFocus = false, customer }: ReceiptSenderProps) {
  const inputId = useId();
  const savedName = customer?.name ?? "";
  const savedPhone = customer?.phone ?? null;
  const [name, setName] = useState(savedName);
  const [phone, setPhone] = useState(savedPhone ? formatSAPhone(savedPhone) : "");
  const [save, setSave] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [share, setShare] = useState<ShareState>("idle");

  const message = receiptMessage({ ...info, customerName: name.trim() || null }, url);
  const label = receiptLabel(info);
  const imageUrl = `${url}/image`;

  function sendToNumber(e: FormEvent) {
    e.preventDefault();
    const local = normalizeSAPhone(phone);
    if (!local) {
      setError(
        phone.trim()
          ? "That doesn't look like a SA cellphone number. Try 071 234 5678."
          : "Type your customer's number, or tap “Choose the chat myself”.",
      );
      return;
    }
    setError(null);
    setPhone(formatSAPhone(local));
    // Open WhatsApp first: browsers only allow it straight from the tap.
    openExternal(`https://wa.me/${toWhatsAppNumber(local)}?text=${encodeURIComponent(message)}`);

    const changed = name.trim() !== savedName || local !== savedPhone;
    if (save && changed) {
      setSaveError(null);
      saveJobCustomer(info.code, name, local)
        .then((result) => {
          if (!result.ok) setSaveError(result.error);
        })
        .catch(() => setSaveError("Sent, but couldn't save the customer. Check your signal."));
    }
  }

  async function sharePicture() {
    setShare("working");
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Receipt image: ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], `receipt-${label}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `Receipt ${label}` });
      } else {
        // Desktop or old browser: download the picture instead.
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
      setShare("idle");
    } catch (err) {
      // Closing the share sheet isn't an error.
      setShare(err instanceof DOMException && err.name === "AbortError" ? "idle" : "failed");
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={sendToNumber} noValidate className="space-y-2.5">
        <label htmlFor={`${inputId}-name`} className="block text-[15px] font-semibold text-ink">
          Customer&apos;s name <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id={`${inputId}-name`}
          type="text"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={80}
          placeholder="e.g. Sipho"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-[17px] text-ink placeholder:text-muted/60 focus:border-jade focus:outline-none"
        />
        <label htmlFor={inputId} className="block pt-1 text-[15px] font-semibold text-ink">
          Customer&apos;s WhatsApp number
        </label>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="071 234 5678"
          value={phone}
          maxLength={PHONE_INPUT_MAX}
          onChange={(e) => {
            setPhone(cleanPhoneInput(e.target.value));
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className="min-h-14 w-full rounded-2xl border-2 border-line bg-white px-4 text-[18px] font-semibold tracking-wide text-ink tabular-nums placeholder:font-normal placeholder:text-muted/60 focus:border-jade focus:outline-none aria-invalid:border-failed-dot"
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm font-medium text-failed">
            {error}
          </p>
        )}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink">
          <input
            type="checkbox"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
            className="h-5 w-5 shrink-0 accent-jade"
          />
          Save name and number to this job
        </label>
        <Button type="submit" size="lg" fullWidth>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19l1.5-4A8 8 0 1 1 9 18.5z" />
          </svg>
          Send receipt on WhatsApp
        </Button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-1 text-center text-[15px] font-semibold text-jade-600 underline underline-offset-2"
        >
          Choose the chat myself
        </a>
      </form>
      {saveError && <Notice tone="warning">{saveError}</Notice>}

      <div className="grid grid-cols-2 gap-2 border-t border-line-soft pt-3">
        <Button variant="secondary" onClick={sharePicture} loading={share === "working"} loadingText="Getting it…" className="px-2">
          Share as picture
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonClasses({ variant: "secondary" })} px-2`}
        >
          View or save PDF
        </a>
      </div>
      {share === "failed" && (
        <Notice tone="error">Couldn&apos;t get the picture. Check your signal and try again.</Notice>
      )}
    </div>
  );
}
