// src/app/not-found.tsx
// Any address that doesn't exist, including a mistyped profile link.
// Most visitors who hit this are customers, so it speaks to them.
import { PublicMessage } from "@/components/ui/PublicShell";

export default function NotFound() {
  return (
    <PublicMessage title="This link doesn't go anywhere">
      Check that it was typed correctly, or ask the person who sent it for a new link.
    </PublicMessage>
  );
}
