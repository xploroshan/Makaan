/** A slim progress bar showing the share of beds occupied (0..1). */
export function OccupancyBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  return (
    <div>
      <div className="bg-secondary h-2.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-muted-foreground mt-1 text-xs">{pct}% occupied</div>
    </div>
  );
}
