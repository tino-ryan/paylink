// src/app/pay/[code]/page.tsx
import { notFound } from "next/navigation";
import { getPaymentPage } from "@/lib/public-data";
import { formatRand } from "@/lib/utils";
import { PaymentOptions } from "@/components/pay/PaymentOptions";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function PayPage({ params }: Props) {
  const { code } = await params;
  const page = await getPaymentPage(code.toUpperCase());

  if (!page) notFound();

  const { request, provider } = page;
  const firstName = provider.full_name.split(" ")[0];

  if (request.status === "expired") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-3xl mb-3">⏰</p>
          <h1 className="font-semibold text-gray-900 mb-2">
            This link has expired
          </h1>
          <p className="text-sm text-gray-500">
            Ask {firstName} to send you a new payment link.
          </p>
        </div>
      </main>
    );
  }

  if (request.status === "paid") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-3xl mb-3">✅</p>
          <h1 className="font-semibold text-gray-900 mb-2">Paid</h1>
          <p className="text-sm text-gray-500">
            {firstName} has confirmed this payment of{" "}
            {formatRand(request.amount_cents)}. Thank you!
          </p>
        </div>
      </main>
    );
  }

  const initials = provider.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-sm mx-auto px-4 py-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-sm">
              {initials}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{provider.full_name}</p>
              <p className="text-xs text-gray-400">{provider.trade}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">{request.description}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatRand(request.amount_cents)}
            </p>
          </div>
        </div>

        <PaymentOptions provider={provider} request={request} />

        <p className="text-center text-xs text-gray-400 pb-4">
          Powered by PayLink · No app needed
        </p>
      </div>
    </main>
  );
}
