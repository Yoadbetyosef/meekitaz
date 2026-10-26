/* Meekitaz Daily — a PREVIEW layer, shown only to people who unlock it (?daily=CODE). It never changes prices in Shopify:
   every daily figure is worked out from the regular price on the fly, so turning it off brings the site back exactly as it was. */
export const DAILY = {
  perDay: 15,        // the headline: $15 a day
  maxDays: 180,      // never longer than 6 months; above that the daily amount goes up
  shipDay: 21,       // the piece ships after ~3 weeks of payments
  cookie: "mk_daily",
};
/** Days and daily amount for a price: $15 a day, as many days as it takes (so cheaper pieces finish sooner), capped at 180 days. */
export function dailyPlan(price: number, days?: number) {
  const p = Math.max(0, Math.round(price));
  const d = days ? Math.max(1, days) : Math.min(DAILY.maxDays, Math.max(1, Math.ceil(p / DAILY.perDay)));
  const perDay = days ? Math.ceil(p / d) : (Math.ceil(p / DAILY.perDay) > DAILY.maxDays ? Math.ceil(p / DAILY.maxDays) : DAILY.perDay);
  const n = days ? d : Math.ceil(p / perDay);
  return { perDay, days: n, last: p - perDay * (n - 1), total: p, months: Math.max(1, Math.round(n / 30)) };
}
