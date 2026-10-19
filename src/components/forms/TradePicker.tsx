// src/components/forms/TradePicker.tsx
//
// "What do you do?" as tappable chips. The last chip, "Something else",
// opens a text box so anyone can type their own trade (Welder, Braider…).
// The value is always the plain trade text that gets saved.
"use client";

import { useState } from "react";
import { TRADES } from "@/lib/constants";

/** The chips: the shared list minus the old catch-all "Other". */
const CHIPS = (TRADES as readonly string[]).filter((t) => t !== "Other");

export const MAX_TRADE_LENGTH = 40;

/** Error text for a trade, or null when it's fine. */
export function validateTrade(trade: string): string | null {
  const t = trade.trim();
  if (!t || t === "Other") return "Choose what you do, or tap Something else and type it.";
  if (t.length > MAX_TRADE_LENGTH) return `Keep it short, ${MAX_TRADE_LENGTH} letters or fewer.`;
  return null;
}

export interface TradePickerProps {
  id: string;
  value: string;
  onChange: (trade: string) => void;
  error?: string | null;
}

export function TradePicker({ id, value, onChange, error }: TradePickerProps) {
  // Typing mode when the saved trade isn't one of the chips (or is the old "Other").
  const [typing, setTyping] = useState(
    value === "Other" || (value !== "" && !CHIPS.includes(value)),
  );
  const typed = typing && value !== "Other" ? value : "";
  const inputId = `${id}-own`;
  const errorId = `${id}-error`;

  const chip = (label: string, on: boolean, onClick: () => void) => (
    <button
      key={label}
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`min-h-11 rounded-full border-2 px-3.5 text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-jade-600 ${
        on ? "border-jade bg-jade text-white" : "border-line bg-white text-ink hover:border-jade/40"
      }`}
    >
      {label}
    </button>
  );

  return (
    <fieldset
      aria-describedby={error ? errorId : undefined}
      className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0"
    >
      <legend className="mb-2.5 p-0 text-[15px] font-bold text-ink">What do you do?</legend>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((trade) =>
          chip(trade, !typing && value === trade, () => {
            setTyping(false);
            onChange(trade);
          }),
        )}
        {chip("Something else", typing, () => {
          setTyping(true);
          // Start empty so they type their own, unless they already had.
          onChange(typing ? value : "");
        })}
      </div>

      {typing && (
        <div className="flex flex-col gap-2 pt-1">
          <label htmlFor={inputId} className="text-[15px] font-bold text-ink">
            Type what you do
          </label>
          <input
            id={inputId}
            value={typed}
            onChange={(e) => onChange(e.target.value.slice(0, MAX_TRADE_LENGTH))}
            placeholder="Welder, braider, DJ…"
            maxLength={MAX_TRADE_LENGTH}
            autoComplete="off"
            autoCapitalize="sentences"
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`block min-h-14 w-full rounded-2xl border-2 bg-white px-4 text-[17px] text-ink transition-[border-color,box-shadow] placeholder:text-muted/60 focus:border-jade focus:shadow-[0_0_0_4px_var(--color-mint)] focus:outline-none ${
              error ? "border-failed-dot" : "border-line"
            }`}
          />
          <p className="text-sm text-muted">Customers see this under your name.</p>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="flex gap-1.5 text-sm font-semibold text-failed">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.5" />
          </svg>
          {error}
        </p>
      )}
    </fieldset>
  );
}
