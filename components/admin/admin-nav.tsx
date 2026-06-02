"use client";

import {
  BadgeCheck,
  Building2,
  FileText,
  Flag,
  LayoutDashboard,
  MapPin,
  ScrollText,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/users", "Users", Users],
  ["/admin/listings", "Listings", Building2],
  ["/admin/verifications", "Verifications", BadgeCheck],
  ["/admin/reports", "Reports", Flag],
  ["/admin/forms", "Form templates", FileText],
  ["/admin/geo", "Geography", MapPin],
  ["/admin/config", "Config & flags", SlidersHorizontal],
  ["/admin/audit", "Audit log", ScrollText],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(([href, label, Icon]) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-brand-gradient text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
