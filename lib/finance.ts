/** Pure home-finance helpers (India-first). Unit-tested. */

/**
 * Equated Monthly Installment for a reducing-balance loan.
 * @param principal loan amount (₹)
 * @param annualRatePct annual interest rate, e.g. 8.5
 * @param months loan tenure in months
 */
export function emi(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

/** Total amount repaid over the life of the loan. */
export function totalPayable(monthlyEmi: number, months: number): number {
  return monthlyEmi * months;
}

/**
 * Suggested affordable monthly rent from gross monthly income. The common
 * rule of thumb is ~30% of income; we also surface a 40% stretch ceiling.
 */
export function affordableRent(monthlyIncome: number): {
  recommended: number;
  ceiling: number;
} {
  const safe = Math.max(0, monthlyIncome);
  return {
    recommended: Math.round(safe * 0.3),
    ceiling: Math.round(safe * 0.4),
  };
}
