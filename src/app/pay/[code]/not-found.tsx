// src/app/pay/[code]/not-found.tsx
import { PublicMessage } from "@/components/ui/PublicShell";

export default function PaymentNotFound() {
  return (
    <PublicMessage title="Payment link not found">
      This link may have been typed incorrectly. Ask the person who sent it to send it again.
      Nothing has been paid.
    </PublicMessage>
  );
}
