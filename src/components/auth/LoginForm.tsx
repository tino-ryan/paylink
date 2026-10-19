// src/components/auth/LoginForm.tsx
"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createAccount, signIn, type SignedIn } from "@/app/login/actions";
import {
  cleanPhoneInput,
  cleanPinInput,
  formatSAPhone,
  normalizeSAPhone,
  PHONE_INPUT_MAX,
  validateNewPin,
  validatePhone,
  validatePin,
} from "@/lib/validation";
import { Button, buttonClasses } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Card, Notice } from "@/components/ui/Surface";

export type Mode = "signin" | "create";

interface Remembered {
  phone: string;
  firstName: string | null;
}

const REMEMBER_KEY = "paylink:remembered";

// ---- Remembered number (per device, convenience only) ----

const noSubscription = () => () => {};

function readRemembered(): string {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveRemembered(value: Remembered) {
  try {
    window.localStorage.setItem(REMEMBER_KEY, JSON.stringify(value));
  } catch {
    // Private mode: they'll just type their number next time.
  }
}

function forgetRemembered() {
  try {
    window.localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Nothing to do.
  }
}

function parseRemembered(raw: string): Remembered | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Remembered>;
    return typeof value.phone === "string" && normalizeSAPhone(value.phone)
      ? { phone: value.phone, firstName: value.firstName ?? null }
      : null;
  } catch {
    return null;
  }
}

/** "0712345678" → "071 *** 5678" */
const maskPhone = (phone: string) => `${phone.slice(0, 3)} *** ${phone.slice(6)}`;

function supportLink(phone: string): string | null {
  const number = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  if (!number) return null;
  const text = `Hi PayLink, I forgot my PIN. My number is ${phone ? formatSAPhone(phone) : "…"}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// ---- Form ----

interface Errors {
  phone?: string;
  pin?: string;
  pinConfirm?: string;
  form?: string;
}

export interface LoginFormProps {
  /** Open on the "create account" tab, e.g. from the landing page. */
  initialMode?: Mode;
}

export function LoginForm({ initialMode = "signin" }: LoginFormProps) {
  const router = useRouter();

  // Read the remembered number after hydration; the server renders without it.
  const rememberedRaw = useSyncExternalStore(noSubscription, readRemembered, () => "");
  const remembered = useMemo(() => parseRemembered(rememberedRaw), [rememberedRaw]);
  const [ignoreRemembered, setIgnoreRemembered] = useState(false);
  const known = ignoreRemembered ? null : remembered;

  const [mode, setMode] = useState<Mode>(initialMode);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const creating = mode === "create";
  const phoneValue = known && !creating ? known.phone : phone;

  function switchMode(next: Mode) {
    setMode(next);
    setPin("");
    setPinConfirm("");
    setErrors({});
  }

  function switchToAnotherNumber() {
    forgetRemembered();
    setIgnoreRemembered(true);
    setPin("");
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const found: Errors = {};
    const phoneError = validatePhone(phoneValue, { required: true });
    if (phoneError) found.phone = phoneError;
    const pinError = creating ? validateNewPin(pin) : validatePin(pin);
    if (pinError) found.pin = pinError;
    if (creating && !pinError && pin !== pinConfirm) {
      found.pinConfirm = "The two PINs don't match.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      const result = creating
        ? await createAccount(phoneValue, pin, pinConfirm)
        : await signIn(phoneValue, pin);

      if (!result.ok) {
        setErrors({ form: result.error });
        setPin("");
        setPinConfirm("");
        setLoading(false);
        return;
      }

      const { next, phone: savedPhone, firstName }: SignedIn = result.data;
      saveRemembered({ phone: savedPhone, firstName });
      router.replace(next);
      router.refresh();
    } catch {
      setErrors({ form: "Couldn't reach PayLink. Check your signal and try again." });
      setLoading(false);
    }
  }

  const help = supportLink(phoneValue);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {(!known || creating) && (
        <div role="tablist" aria-label="Sign in or create account" className="grid grid-cols-2 gap-1 rounded-2xl bg-sand p-1">
          {(["signin", "create"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`min-h-12 rounded-[12px] text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-jade-600 ${
                mode === m ? "bg-white text-jade shadow-sm" : "text-muted"
              }`}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
      )}

      <Card className="space-y-5">
        {known && !creating ? (
          <div className="space-y-1">
            <p className="font-display text-[21px] font-bold tracking-[-0.02em] text-ink">
              Welcome back{known.firstName ? `, ${known.firstName}` : ""}
            </p>
            <p className="text-[15px] text-muted">
              Signing in as {maskPhone(known.phone)}.{" "}
              <button
                type="button"
                onClick={switchToAnotherNumber}
                className="font-semibold text-jade-600 underline underline-offset-2"
              >
                Not you?
              </button>
            </p>
          </div>
        ) : (
          <TextField
            id="phone"
            label="Cellphone number"
            type="tel"
            inputMode="tel"
            autoComplete="username"
            value={phone}
            maxLength={PHONE_INPUT_MAX}
            onChange={(e) => {
              setPhone(cleanPhoneInput(e.target.value));
              if (errors.phone) setErrors({ ...errors, phone: undefined });
            }}
            placeholder="071 234 5678"
            error={errors.phone}
            hint={creating ? "This is how you'll sign in. We don't send SMSes." : undefined}
          />
        )}

        <TextField
          id="pin"
          label={creating ? "Choose a 6-digit PIN" : "PIN"}
          type="password"
          inputMode="numeric"
          autoComplete={creating ? "new-password" : "current-password"}
          maxLength={6}
          value={pin}
          onChange={(e) => {
            setPin(cleanPinInput(e.target.value));
            if (errors.pin) setErrors({ ...errors, pin: undefined });
          }}
          placeholder="••••••"
          className="tracking-[0.4em]"
          autoFocus={Boolean(known) && !creating}
          error={errors.pin}
          hint={creating ? "Not your bank PIN. Avoid easy ones like 123456." : undefined}
        />

        {creating && (
          <TextField
            id="pin-confirm"
            label="Type the PIN again"
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={pinConfirm}
            onChange={(e) => {
              setPinConfirm(cleanPinInput(e.target.value));
              if (errors.pinConfirm) setErrors({ ...errors, pinConfirm: undefined });
            }}
            placeholder="••••••"
            className="tracking-[0.4em]"
            error={errors.pinConfirm}
          />
        )}

        {errors.form && <Notice tone="error">{errors.form}</Notice>}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={loading}
          loadingText={creating ? "Creating account…" : "Signing in…"}
        >
          {creating ? "Create account" : "Sign in"}
        </Button>

        {!creating && help && (
          <a
            href={help}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses({ variant: "ghost", fullWidth: true })}
          >
            Forgot your PIN? WhatsApp us
          </a>
        )}
      </Card>

      {known && !creating && (
        <p className="text-center text-[15px] text-muted">
          New to PayLink?{" "}
          <button
            type="button"
            onClick={() => {
              switchToAnotherNumber();
              switchMode("create");
            }}
            className="font-semibold text-jade-600 underline underline-offset-2"
          >
            Create an account
          </button>
        </p>
      )}
    </form>
  );
}
