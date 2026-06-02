import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

/** Read-only star rating display. */
export function Stars({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={cn(
              "size-4",
              n <= rounded
                ? "fill-warning text-warning"
                : "text-muted-foreground/40",
            )}
          />
        ))}
      </span>
      <span className="text-muted-foreground text-sm">
        {value.toFixed(1)}
        {count !== undefined && ` (${count})`}
      </span>
    </span>
  );
}
