"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api/client";

interface Notif {
  id: string;
  title: string;
  url: string | null;
  read_at: string | null;
  created_at: string;
}

export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    apiFetch<{ items: Notif[]; unread: number }>("/api/v1/me/notifications")
      .then((d) => {
        if (!active) return;
        setItems(d.items);
        setUnread(d.unread);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      apiFetch("/api/v1/me/notifications/read", { method: "POST" }).catch(
        () => {},
      );
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="text-muted-foreground hover:bg-accent hover:text-foreground relative flex size-9 items-center justify-center rounded-full"
        aria-label="Notifications"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="animate-in fade-in zoom-in-95 bg-popover shadow-lift absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border">
          <div className="border-b px-4 py-2.5 text-sm font-semibold">
            Notifications
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-muted-foreground px-4 py-6 text-center text-sm">
                You&apos;re all caught up. Save a search to get alerts on new
                homes.
              </p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.url ?? "#"}
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent block border-b px-4 py-3 text-sm last:border-0"
                >
                  <div className="font-medium">{n.title}</div>
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
