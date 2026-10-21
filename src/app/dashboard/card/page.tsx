// src/app/dashboard/card/page.tsx
import { siteUrl } from "@/lib/site";
import { redirect } from "next/navigation";
import { getMyProvider } from "@/lib/auth/session";
import { CardPreview } from "@/components/dashboard/CardPreview";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { Card, CardTitle, PageHeader } from "@/components/ui/Surface";

export default async function CardPage() {
  const provider = await getMyProvider();
  if (!provider) redirect("/onboarding");

  const appUrl = siteUrl();
  const profileUrl = `${appUrl}/${provider.slug}`;

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <PageHeader
          title="My card"
          description="Your permanent PayLink. Customers scan it, enter the amount, and pay."
        />
      </div>

      <CardPreview
        fullName={provider.full_name}
        trade={provider.trade}
        payUrl={profileUrl}
      />

      <Card className="print:hidden">
        <CardTitle description="Put it in your WhatsApp status or business profile.">
          Share your link
        </CardTitle>
        <ShareLinks
          url={profileUrl}
          message={`You can pay ${provider.full_name} here, no app needed:`}
        />
      </Card>

      <Card className="print:hidden">
        <CardTitle description="Print on A4 and cut out, or choose “Save as PDF” to keep a copy.">
          Print it
        </CardTitle>
        <PrintButton />
      </Card>
    </div>
  );
}
