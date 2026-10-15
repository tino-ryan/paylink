// src/app/[slug]/page.tsx
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/public-data";
import { StaticProfilePage } from "@/components/pay/StaticProfilePage";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProviderProfilePage({ params }: Props) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) notFound();

  return <StaticProfilePage profile={profile} />;
}
