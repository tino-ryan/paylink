// src/app/dashboard/card/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CardPreview } from "@/components/dashboard/CardPreview";
import { PrintButton } from "@/components/dashboard/PrintButton";
import Link from "next/link";

export default async function CardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: provider } = await supabase
    .from("providers")
    .select("full_name, trade, slug")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/onboarding");

  const payUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${provider.slug}`;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 py-4 print:hidden">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 text-sm"
          >
            ← Back
          </Link>
          <h1 className="font-semibold text-gray-900">Your PayLink card</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        {/* Instructions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 print:hidden">
          <p className="text-sm font-medium text-gray-900 mb-1">
            How to use your card
          </p>
          <p className="text-sm text-gray-500">
            Print this card and hand it to customers, stick it on your vehicle,
            or show your phone screen. They scan the QR code and pay instantly.
          </p>
        </div>

        {/* Card preview */}
        <CardPreview
          fullName={provider.full_name}
          trade={provider.trade}
          slug={provider.slug}
          payUrl={payUrl}
        />

        {/* Action buttons */}
        <div className="space-y-3 print:hidden">
          <PrintButton />
          <p className="text-xs text-center text-gray-400">
            In the print dialog, choose &ldquo;Save as PDF&rdquo; to download. Print on A4
            and cut out — or take to any Clicks or PnP print kiosk.
          </p>
        </div>
      </div>
    </main>
  );
}
