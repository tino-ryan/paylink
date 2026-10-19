// src/app/pay/[code]/page.tsx
import { notFound } from "next/navigation";
import { getPaymentPage } from "@/lib/public-data";
import { formatRand } from "@/lib/utils";
import { PaymentOptions } from "@/components/pay/PaymentOptions";
import { Receipt } from "@/components/pay/Receipt";
import { ProviderHero, ProviderSummary } from "@/components/pay/ProviderHero";
import { PublicMessage, PublicShell } from "@/components/ui/PublicShell";

interface Props {
  params: Promise<{ code: string }>;
}

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Johannesburg",
  });

export default async function PayPage({ params }: Props) {
  const { code } = await params;
  const page = await getPaymentPage(code.toUpperCase());

  if (!page) notFound();

  const { request, provider } = page;
  const firstName = provider.full_name.split(" ")[0];
  const summary = (
    <ProviderSummary
      name={provider.full_name}
      detail={`${request.description} · ${formatRand(request.amount_cents)}`}
    />
  );

  if (request.status === "expired") {
    return (
      <PublicMessage title="This link has expired" icon="expired" context={summary}>
        It stopped working on {formatDay(request.expires_at)}. Ask {firstName} to send you a fresh
        link, then pay from that one.
      </PublicMessage>
    );
  }

  // Once the provider confirms payment, the same link becomes the receipt.
  if (request.status === "paid") {
    return <Receipt provider={provider} request={request} />;
  }

  return (
    <PublicShell>
      <ProviderHero
        name={provider.full_name}
        trade={provider.trade}
        description={request.description}
        amountCents={request.amount_cents}
        note={`Link open until ${formatDay(request.expires_at)}`}
        verified={provider.verified_at !== null}
      />
      <PaymentOptions provider={provider} request={request} />
    </PublicShell>
  );
}
