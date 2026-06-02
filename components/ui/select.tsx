import * as React from "react";

import { cn } from "@/lib/utils";

/** Lightweight native select, styled to match the design system. */
const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "border-input bg-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
