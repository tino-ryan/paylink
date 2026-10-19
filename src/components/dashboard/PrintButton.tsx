// src/components/dashboard/PrintButton.tsx
"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="secondary" size="lg" fullWidth onClick={() => window.print()}>
      Save as PDF or print
    </Button>
  );
}
