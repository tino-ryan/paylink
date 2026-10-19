// src/app/dashboard/settings/_components/change-pin-form.tsx
"use client";

import { useState } from "react";
import { cleanPinInput, validateNewPin } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Surface";
import { changePin } from "../actions";

/** Collapsed by default: a "Change PIN" button that opens the three fields. */
export function ChangePinForm() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const strength = validateNewPin(next);
    if (current.length !== 6) return setError("Enter your current 6-digit PIN.");
    if (strength) return setError(strength);
    if (next !== confirm) return setError("The new PINs don't match.");

    setLoading(true);
    try {
      const result = await changePin(current, next, confirm);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      reset();
      setOpen(false);
      setDone(true);
    } catch {
      setError("Couldn't reach PayLink. Check your signal and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {done && <Notice tone="success">PIN changed. Use your new PIN next time you sign in.</Notice>}
        <Button
          variant="secondary"
          fullWidth
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
        >
          Change PIN
        </Button>
      </div>
    );
  }

  const pinProps = {
    type: "password",
    inputMode: "numeric" as const,
    maxLength: 6,
    placeholder: "••••••",
    className: "tracking-[0.4em]",
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <TextField
        id="current-pin"
        label="Current PIN"
        autoComplete="current-password"
        value={current}
        onChange={(e) => setCurrent(cleanPinInput(e.target.value))}
        {...pinProps}
      />
      <TextField
        id="new-pin"
        label="New PIN"
        autoComplete="new-password"
        value={next}
        onChange={(e) => setNext(cleanPinInput(e.target.value))}
        hint="6 digits. Avoid easy ones like 123456."
        {...pinProps}
      />
      <TextField
        id="confirm-new-pin"
        label="New PIN again"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(cleanPinInput(e.target.value))}
        {...pinProps}
      />
      {error && <Notice tone="error">{error}</Notice>}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading} loadingText="Saving…">
          Save new PIN
        </Button>
      </div>
    </form>
  );
}
