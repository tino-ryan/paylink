// src/app/dashboard/card/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CardPreview } from "@/components/dashboard/CardPreview";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { ShareLinks } from "@/components/dashboard/ShareLinks";
import { Card, CardTitle, PageHeader } from "@/components/ui/Surface";

export default async function CardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("providers")
    .select("full_name, trade, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) redirect("/onboarding");
  const provider = data as { full_name: string; trade: string; slug: string };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set in .env.local");
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
