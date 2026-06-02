"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/db/supabase-browser";
import { cn } from "@/lib/utils";

export function AccountMenu({
  email,
  isAdmin,
}: {
  email: string | null;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email ?? "U").charAt(0).toUpperCase();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const items: { href: string; label: string }[] = [
    { href: "/account/saved", label: "Saved homes" },
    { href: "/account/profile", label: "Profile & security" },
    { href: "/account/alerts", label: "Saved searches & alerts" },
    { href: "/account/activity", label: "Activity" },
    { href: "/chats", label: "Messages" },
    { href: "/owner/dashboard", label: "Owner dashboard" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin console" }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-brand-gradient text-primary-foreground shadow-soft flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-transform hover:scale-105"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="animate-in fade-in zoom-in-95 bg-popover shadow-lift absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border p-1.5">
          <div className="text-muted-foreground truncate px-3 py-2 text-xs">
            {email ?? "Signed in"}
          </div>
          <div className="bg-border my-1 h-px" />
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => setOpen(false)}
              className="hover:bg-accent hover:text-accent-foreground block rounded-lg px-3 py-2 text-sm"
            >
              {it.label}
            </Link>
          ))}
          <div className="bg-border my-1 h-px" />
          <button
            onClick={signOut}
            className={cn(
              "block w-full rounded-lg px-3 py-2 text-left text-sm",
              "text-destructive hover:bg-destructive/10",
            )}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
