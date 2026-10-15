"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl hover:bg-emerald-700 transition-colors"
    >
      Print / Save as PDF
    </button>
  );
}
