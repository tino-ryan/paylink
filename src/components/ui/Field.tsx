// src/components/ui/Field.tsx
//
// Labelled form controls. Every control gets a real <label>, an optional hint,
// and an inline error that screen readers announce (aria-describedby +
// aria-invalid). Pass a unique `id` per field.
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

// Big, soft inputs: 56px tall, 2px border, a mint glow when focused.
const CONTROL =
  "block w-full rounded-2xl border-2 bg-white px-4 text-[17px] text-ink min-h-14 " +
  "placeholder:text-muted/60 transition-[border-color,box-shadow] " +
  "focus:outline-none focus:border-jade focus:shadow-[0_0_0_4px_var(--color-mint)] " +
  "disabled:bg-cream disabled:text-muted";

const controlBorder = (invalid: boolean) =>
  invalid
    ? "border-failed-dot focus:border-failed-dot focus:shadow-[0_0_0_4px_var(--color-failed-soft)]"
    : "border-line";

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5v.5" />
    </svg>
  );
}

interface FieldShellProps {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}

export function FieldShell({ id, label, optional, hint, error, children }: FieldShellProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[15px] font-bold text-ink">
        {label}
        {optional && <span className="font-medium text-muted"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex gap-1.5 text-sm font-semibold text-failed">
          <ErrorIcon />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string | null, hint?: ReactNode) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  /** Fixed text shown inside the field before the input, e.g. "R" or "paylink.co.za/". */
  prefix?: string;
}

export function TextField({
  id,
  label,
  optional,
  hint,
  error,
  prefix,
  className = "",
  ...input
}: TextFieldProps) {
  const invalid = Boolean(error);
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      {prefix ? (
        <div
          className={`flex min-h-14 items-stretch overflow-hidden rounded-2xl border-2 bg-white transition-[border-color,box-shadow] ${
            invalid
              ? "border-failed-dot focus-within:shadow-[0_0_0_4px_var(--color-failed-soft)]"
              : "border-line focus-within:border-jade focus-within:shadow-[0_0_0_4px_var(--color-mint)]"
          }`}
        >
          <span className="flex items-center whitespace-nowrap pl-4 text-base font-semibold text-muted">
            {prefix}
          </span>
          <input
            id={id}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy(id, error, hint)}
            className={`w-full min-w-0 bg-transparent pr-4 pl-1.5 text-[17px] font-bold text-ink placeholder:font-medium placeholder:text-muted/60 focus:outline-none ${className}`}
            {...input}
          />
        </div>
      ) : (
        <input
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${CONTROL} ${controlBorder(invalid)} ${className}`}
          {...input}
        />
      )}
    </FieldShell>
  );
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string | null;
  placeholder?: string;
  options: readonly string[];
}

export function SelectField({
  id,
  label,
  optional,
  hint,
  error,
  placeholder,
  options,
  className = "",
  ...select
}: SelectFieldProps) {
  const invalid = Boolean(error);
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={`${CONTROL} ${controlBorder(invalid)} appearance-none pr-10 ${className}`}
          {...select}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-jade"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </div>
    </FieldShell>
  );
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

/** Large tappable segmented choice (radio group). */
export function ChoiceGroup<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  legend: string;
  options: readonly ChoiceOption<T>[];
  value: T | "";
  onChange: (value: T) => void;
  error?: string | null;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-2.5 block text-[15px] font-bold text-ink">{legend}</legend>
      <div className={`grid gap-2 ${options.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl border-2 px-3 text-center text-[15px] font-bold transition-colors has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-jade-600 ${
                checked
                  ? "border-jade bg-mist text-jade"
                  : "border-line bg-white text-ink"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="flex gap-1.5 text-sm font-semibold text-failed">
          <ErrorIcon />
          {error}
        </p>
      )}
    </fieldset>
  );
}

/** A tappable checkbox row with a title and a short description. */
export function CheckboxCard({
  id,
  checked,
  onChange,
  title,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-[18px] border-2 p-4 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-jade-600 ${
        checked ? "border-jade bg-mist" : "border-line bg-white"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded accent-jade"
      />
      <span className="min-w-0">
        <span className="block text-[17px] font-bold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}
