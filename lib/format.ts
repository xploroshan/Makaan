/** Locale-aware formatting helpers (India-first defaults). */

export function formatPrice(
  value: number | null | undefined,
  currency = "INR",
  locale = "en-IN",
): string {
  if (value == null) return "Price on request";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatArea(sqft: number | null | undefined): string {
  if (sqft == null) return "—";
  return `${new Intl.NumberFormat("en-IN").format(sqft)} sq ft`;
}

const TRANSACTION_LABEL: Record<string, string> = {
  rent: "For rent",
  lease: "For lease",
  coliving: "Co-living",
  sale: "For sale",
};

export function transactionLabel(type: string): string {
  return TRANSACTION_LABEL[type] ?? type;
}
