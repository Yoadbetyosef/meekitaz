/* Meekitaz Daily — a PREVIEW layer, shown only to people who unlock it (?daily=CODE). It never changes prices in Shopify:
   every daily figure is worked out from the regular price on the fly, so turning it off brings the site back exactly as it was. */
export const DAILY = {
  enabled: true,     // Preview layer on again (Oct 27, 2026) — visible only with ?daily=CODE; set false to park it.
  perDay: 15,        // the headline: $15 a day
  maxDays: 180,      // never longer than 6 months; above that the daily amount goes up
  shipDay: 0,        // message: it ships right away
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

/* The ladder (decided Oct 27, 2026): the customer picks a round daily amount, the days follow.
   An amount is offered only if (1) the plan is 180 days or less and (2) by ship day 21 the payments plus the $49
   account fee cover the piece's cost (price ÷ 6, the minimum markup). If no amount passes (very top of the range),
   the $30 plan is offered and the piece ships on the day its cost is covered instead of day 21. */
export const LADDER = [10, 15, 20, 25, 30];
export const DAILY_RULES = { fee: 49, markup: 6, shipDay: 21, maxDays: 180, maxPrice: 4500 };
export type DailyOption = { amt: number; days: number; last: number; ship: number; ok: boolean };
export function dailyOptions(price: number): DailyOption[] {
  const p = Math.max(0, Math.round(price)), cost = p / DAILY_RULES.markup;
  const opts = LADDER.map(amt => {
    const days = Math.max(1, Math.ceil(p / amt));
    const ship = Math.max(DAILY_RULES.shipDay, Math.ceil((cost - DAILY_RULES.fee) / amt));
    const ok = days <= DAILY_RULES.maxDays && ship === DAILY_RULES.shipDay;
    return { amt, days, last: p - amt * (days - 1), ship, ok };
  });
  if (!opts.some(o => o.ok)) { const top = opts[opts.length - 1]; if (top.days <= DAILY_RULES.maxDays) top.ok = true; }
  return opts;
}
/** The lowest daily amount a price can have. */
export const lowestDaily = (price: number) => dailyOptions(price).find(o => o.ok) || null;
