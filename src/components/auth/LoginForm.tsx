"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(
        "Could not send the link. Check your email address and try again.",
      );
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center space-y-3">
        <div className="text-4xl">📬</div>
        <h2 className="font-semibold text-gray-900">Check your email</h2>
        <p className="text-sm text-gray-500">
          We sent a sign-in link to <strong>{email}</strong>. Tap it to
          continue.
        </p>
        <button
          onClick={() => {
            setSent(false);
            setError(null);
          }}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sipho@gmail.com"
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
          autoFocus
          required
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors"
      >
        {loading ? "Sending…" : "Send me a sign-in link"}
      </button>

      <p className="text-xs text-center text-gray-400">
        No password needed. We&apos;ll email you a link.
      </p>
    </form>
  );
}
