"use client";

import {
  Activity,
  BarChart3,
  Building2,
  ContactRound,
  Handshake,
  LifeBuoy,
  ListTodo,
  type LucideIcon,
  MapPinned,
  Megaphone,
  PieChart,
  Route,
  ScrollText,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENTITY_REGISTRY } from "@/lib/crm/registry";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const baseNavItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/accounts", label: "Accounts", icon: Building2 },
  { href: "/deals", label: "Deals", icon: Handshake },
  { href: "/leads", label: "Leads", icon: Route },
  { href: "/orders", label: "Orders", icon: ScrollText },
  { href: "/areas", label: "Areas", icon: MapPinned },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/activities", label: "Activities", icon: Activity }
];

const REGISTRY_ICONS: Record<string, LucideIcon> = {
  ListTodo,
  LifeBuoy,
  Megaphone,
  PieChart
};

const registryNavItems: readonly NavItem[] = ENTITY_REGISTRY.filter(
  (entity) => !baseNavItems.some((item) => item.href === entity.route)
)
  .filter((entity) => entity.iconName in REGISTRY_ICONS)
  .map((entity) => ({
    href: entity.route,
    label: entity.listLabel,
    icon: REGISTRY_ICONS[entity.iconName]
  }));

const reportsItem: NavItem = {
  href: "/reports",
  label: "Reports",
  icon: PieChart
};

const navItems: readonly NavItem[] = [
  ...baseNavItems,
  ...registryNavItems,
  reportsItem
];

export interface SidebarNavProps {
  mobile?: boolean;
  "data-testid"?: string;
}

export function SidebarNav({ mobile = false, "data-testid": testid }: SidebarNavProps = {}) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        mobile ? "flex gap-1 overflow-x-auto p-2" : "flex flex-col gap-1 p-4"
      )}
      aria-label="Primary"
      data-testid={testid}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            data-testid={`nav-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all demo-stable",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5",
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
