"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  ["/admin", "Overview"],
  ["/admin/users", "Users"],
  ["/admin/listings", "Listings"],
  ["/admin/verifications", "Verifications"],
  ["/admin/reports", "Reports"],
  ["/admin/forms", "Form templates"],
  ["/admin/geo", "Geography"],
  ["/admin/config", "Config & flags"],
  ["/admin/audit", "Audit log"],
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "rounded-md px-3 py-2 text-sm whitespace-nowrap",
            pathname === href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
