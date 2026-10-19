// src/app/dashboard/_components/bottom-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (path: string) => boolean;
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-6 w-6",
  "aria-hidden": true,
};

const ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Jobs",
    isActive: (p) => p === "/dashboard" || p.startsWith("/dashboard/requests"),
    icon: (
      <svg {...iconProps}>
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
  {
    // The main action: take payment from a customer in front of you.
    // "Send a payment link" (/dashboard/new) lives under the same tab.
    href: "/dashboard/charge",
    label: "Charge",
    isActive: (p) => p === "/dashboard/charge" || p === "/dashboard/new",
    icon: (
      <svg {...iconProps}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/card",
    label: "My card",
    isActive: (p) => p === "/dashboard/card",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    isActive: (p) => p.startsWith("/dashboard/settings"),
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

/** Thumb-reach navigation, like a native app. Fixed to the bottom of the screen. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] print:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const isNew = item.href === "/dashboard/charge";
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[13px] font-bold focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-jade-600 ${
                  active ? "text-jade" : "text-muted"
                }`}
              >
                {isNew ? (
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-ink shadow-[inset_0_-2px_0_var(--color-apricot-deep)] ${
                      active ? "bg-apricot brightness-95" : "bg-apricot"
                    }`}
                  >
                    {item.icon}
                  </span>
                ) : (
                  <>
                    {/* Apricot dot marks where you are, echoing the logo. */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-1.5 h-1.5 w-1.5 rounded-full bg-apricot ${active ? "" : "invisible"}`}
                    />
                    {item.icon}
                  </>
                )}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
