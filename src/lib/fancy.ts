// Fancy-colour jewellery: catalogue products whose stone is already a coloured diamond, read from the title.
export const FANCY_COLORS = ["Yellow", "Pink", "Blue", "Green"] as const;
export type FancyColor = (typeof FANCY_COLORS)[number];
const RE = /\b(?:fancy\s+)(?:light\s+|intense\s+|vivid\s+)?(yellow|pink|blue|green)\b|\b(?:light\s+|intense\s+|vivid\s+)?(yellow|pink|blue|green)\s+(?:lab[- ]grown\s+|lab\s+created\s+)?(?:diamonds?)\b|\b(canary)\b/i;
/** "Fancy Yellow Diamond Oval Ring" → "Yellow"; "Yellow gold Round Diamond Ring" → "" (the colour must describe the diamond, not the gold). */
export function fancyColorOf(title: string): FancyColor | "" {
  const m = title.match(RE); if (!m) return "";
  const c = (m[1] || m[2] || (m[3] ? "yellow" : "")).toLowerCase(); if (!c) return "";
  return (c.charAt(0).toUpperCase() + c.slice(1)) as FancyColor;
}
/** Colour of a VDB fancy stone from its description ("Fancy Vivid Yellow", "Fancy Intense Pink Purplish"). */
export function fancyColorOfStone(fancy: string | null): FancyColor | "" {
  const t = (fancy || "").toLowerCase();
  return FANCY_COLORS.find(c => t.includes(c.toLowerCase())) || "";
}
/** Shopify product search for every catalogue piece set with a coloured diamond. */
export const FANCY_QUERY = [...FANCY_COLORS.map(c => `title:'${c} Diamond'`), ...FANCY_COLORS.map(c => `title:'Fancy ${c}'`), "title:canary"].join(" OR ");
/** Where "Choose this setting" leads for a fancy-colour setting: the fancy stones, in that colour and shape. */
export const fancyStonesUrl = (color: string, shape: string) => `/fancy-colors?color=${encodeURIComponent(color)}&sh=${encodeURIComponent(shape)}&build=1`;
/** Where "Choose this diamond" leads for a fancy stone with no setting yet: the fancy settings, in that colour and shape. */
export const fancySettingsUrl = (color: string, shape: string) => `/fancy-colors?color=${encodeURIComponent(color)}&style=${encodeURIComponent(shape)}&build=1&to=settings`;
