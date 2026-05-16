"use client";

import {
  Activity,
  BarChart3,
  Building2,
  ContactRound,
  Handshake,
  MapPinned,
  Route,
  ScrollText
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/leads", label: "Leads", icon: Route },
  { href: "/orders", label: "Orders", icon: ScrollText },
  { href: "/areas", label: "Areas", icon: MapPinned },
  { href: "/activities", label: "Activities", icon: Activity }
];

export function SidebarNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        mobile ? "flex gap-1 overflow-x-auto p-2" : "flex flex-col gap-1 p-4"
      )}
      aria-label="Primary"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              mobile && "min-w-fit"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
