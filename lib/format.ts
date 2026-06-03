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

/** Compact India-style price for tight spaces like map pins (₹25k, ₹1.2Cr). */
export function formatPriceShort(value: number | null | undefined): string {
  if (value == null) return "POA";
  if (value >= 1e7) {
    const cr = value / 1e7;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)}Cr`;
  }
  if (value >= 1e5) {
    const l = value / 1e5;
    return `₹${l % 1 === 0 ? l : l.toFixed(1)}L`;
  }
  if (value >= 1e3) return `₹${Math.round(value / 1e3)}k`;
  return `₹${value}`;
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
