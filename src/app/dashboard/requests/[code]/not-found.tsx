// src/app/dashboard/requests/[code]/not-found.tsx
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Surface";

export default function RequestNotFound() {
  return (
    <Card className="py-10 text-center">
      <h1 className="font-heading text-[26px] text-ink">Job not found</h1>
      <p className="mt-2 text-sm text-muted">
        This job doesn&apos;t exist, or it belongs to a different PayLink account.
      </p>
      <LinkButton href="/dashboard" variant="secondary" fullWidth className="mt-6">
        Back to jobs
      </LinkButton>
    </Card>
  );
}
