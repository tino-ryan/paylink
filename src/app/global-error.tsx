// src/app/global-error.tsx
// Last resort when the root layout itself fails. Must render its own <html>
// and <body>, and can't rely on the app's fonts or components, so it's plain.
"use client";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "#F7F3EA",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#11201A",
        }}
      >
        <title>Something went wrong · PayLink</title>
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            background: "#fff",
                        borderRadius: 22,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block", margin: "0 auto 16px" }}>
            <path d="M12 30V21a9 9 0 0 1 9-9h9M52 34v9a9 9 0 0 1-9 9h-9" fill="none" stroke="#0E4D3C" strokeWidth="8.5" strokeLinecap="round" />
            <circle cx="32" cy="32" r="7" fill="#EE9259" />
          </svg>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 8px" }}>PayLink couldn&apos;t load</h1>
          <p style={{ fontSize: 14, color: "#4A5A52", margin: "0 0 24px", lineHeight: 1.5 }}>
            Check your signal, then try again. Your jobs and payments are safe.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              width: "100%",
              minHeight: 56,
              border: 0,
              borderRadius: 16,
              background: "#0E4D3C",
              boxShadow: "inset 0 -3px 0 #08261D",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#4A5A52", marginTop: 24 }}>Error code {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
