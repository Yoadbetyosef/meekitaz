/** Delivery promise: a made-to-order ring arrives within 21 days of the order. */
export const ARRIVAL_DAYS = 21;
export function arrivalDate(from = new Date()): Date { const d = new Date(from); d.setDate(d.getDate() + ARRIVAL_DAYS); return d; }
export const arrivalLabel = (from = new Date()) => arrivalDate(from).toLocaleDateString("en-US", { month: "long", day: "numeric" });
/** Shop Pay Installments messaging (US): 4 interest-free payments for $50–$999.99, monthly plans from $150 up to $17,500. The exact terms are shown by Shop Pay at checkout. */
export function installments(total: number): string | null {
  if (total >= 50 && total < 1000) return `or 4 interest-free payments of $${(total / 4).toFixed(2)} with Shop Pay`;
  if (total >= 150 && total <= 17500) { const m = total >= 3000 ? 12 : total >= 1000 ? 6 : 3; return `or from $${Math.ceil(total / m).toLocaleString("en-US")}/mo with Shop Pay`; }
  return null;
}
