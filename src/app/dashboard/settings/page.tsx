// src/app/dashboard/settings/page.tsx
import { siteUrl } from "@/lib/site";
import { redirect } from "next/navigation";
import { getMyProvider, getSessionUser } from "@/lib/auth/session";
import { PushToggle } from "@/components/pwa/PushToggle";
import { CopyButton } from "@/components/ui/CopyButton";
import { Card, CardTitle, PageHeader } from "@/components/ui/Surface";
import { SettingsForm } from "./_components/settings-form";
import { SignOutButton } from "./_components/sign-out-button";
import { ChangePinForm } from "./_components/change-pin-form";
import { authEmailToPhone } from "@/lib/auth/pin";
import { formatSAPhone } from "@/lib/validation";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const provider = await getMyProvider();
  if (!provider) redirect("/onboarding");

  const signInPhone = authEmailToPhone(user.email);
  const appUrl = siteUrl();
  const profileUrl = `${appUrl}/${provider.slug}`;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" />

      <PushToggle showTest />

      <SettingsForm provider={provider} />

      <Card>
        <CardTitle description="Your permanent link. It can't be changed, so printed cards keep working.">
          Your PayLink address
        </CardTitle>
        <div className="flex items-center gap-2 rounded-2xl bg-cream py-1.5 pr-1.5 pl-4">
          <p className="min-w-0 flex-1 truncate text-sm text-ink">
            {profileUrl.replace(/^https?:\/\//, "")}
          </p>
          <CopyButton value={profileUrl} label="your PayLink address" />
        </div>
      </Card>

      <Card className="space-y-3">
        <CardTitle
          description={
            signInPhone
              ? `You sign in with ${formatSAPhone(signInPhone)} and your PIN. This is also your WhatsApp number on PayLink.`
              : "You're signed in with an older email account."
          }
        >
          Account
        </CardTitle>
        {signInPhone && <ChangePinForm />}
        <SignOutButton />
      </Card>
    </div>
  );
}
