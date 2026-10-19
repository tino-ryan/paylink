// src/components/brand/Logo.tsx
//
// The PayLink identity, from the Brand Kit:
// - The mark: two rounded corners (provider and customer) holding an apricot
//   dot (the moment money moves). 64-unit grid, stroke 8.5, dot r7.
// - The wordmark: "paylink", lowercase, Bricolage ExtraBold, tracked −4.5%,
//   with the apricot dot on the i.
// Strokes thicken as the mark shrinks so the corners never break up.

const CORNERS = "M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9";

export type MarkTone = "jade" | "white" | "ink";

/** Stroke and dot size tuned per rendered size, as in the Brand Kit. */
function weights(px: number): { stroke: number; dot: number } {
  if (px <= 14) return { stroke: 12, dot: 9 };
  if (px <= 24) return { stroke: 10, dot: 8 };
  if (px <= 40) return { stroke: 9, dot: 7.5 };
  return { stroke: 8.5, dot: 7 };
}

const STROKE: Record<MarkTone, string> = {
  jade: "var(--color-jade)",
  white: "#ffffff",
  ink: "var(--color-ink)",
};

export interface LogoMarkProps {
  /** Rendered width and height in px. */
  size?: number;
  /** Corner colour. The dot is always apricot. */
  tone?: MarkTone;
  className?: string;
  /** Set when the mark stands alone and needs a name for screen readers. */
  title?: string;
}

/** The corners-and-dot mark on its own, no background. */
export function LogoMark({ size = 32, tone = "jade", className = "", title }: LogoMarkProps) {
  const { stroke, dot } = weights(size);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`shrink-0 ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={CORNERS} fill="none" stroke={STROKE[tone]} strokeWidth={stroke} strokeLinecap="round" />
      <circle cx="32" cy="32" r={dot} fill="var(--color-apricot)" />
    </svg>
  );
}

/** The mark on a jade tile: app icon, favicon, avatar spots. */
export function LogoTile({
  size = 40,
  round = false,
  className = "",
}: {
  size?: number;
  /** Circle instead of rounded square (WhatsApp profile style). */
  round?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center bg-jade ${className}`}
      style={{ width: size, height: size, borderRadius: round ? 9999 : size * 0.25 }}
    >
      <LogoMark size={Math.round(size * 0.66)} tone="white" />
    </span>
  );
}

export type WordmarkTone = "jade" | "white" | "ink";

const WORD_COLOUR: Record<WordmarkTone, string> = {
  jade: "text-jade",
  white: "text-white",
  ink: "text-ink",
};

/**
 * "paylink" with the apricot dot standing in for the dot of the i.
 * Size it with a text-* class (e.g. text-2xl); everything scales in em.
 */
export function Wordmark({
  tone = "jade",
  className = "text-2xl",
}: {
  tone?: WordmarkTone;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="PayLink"
      className={`inline-flex items-baseline font-display font-extrabold leading-none tracking-[-0.045em] ${WORD_COLOUR[tone]} ${className}`}
    >
      <span aria-hidden="true">payl</span>
      <span aria-hidden="true" className="relative inline-block">
        {/* Dotless i (U+0131) so the brand dot replaces the font's own. */}
        ı
        <span
          className="absolute rounded-full bg-apricot"
          style={{ left: "50%", top: "0.015em", width: "0.19em", height: "0.19em", marginLeft: "-0.0725em" }}
        />
      </span>
      <span aria-hidden="true">nk</span>
    </span>
  );
}

/** Mark + wordmark side by side, for headers. */
export function Lockup({
  tone = "jade",
  className = "",
}: {
  tone?: "jade" | "white";
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={28} tone={tone} />
      <Wordmark tone={tone} className="text-2xl" />
    </span>
  );
}
