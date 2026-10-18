// Product copy imported from another store sometimes names that store or its supplier. Show Meekitaz instead.
const RULES: [RegExp, string][] = [
  [/https?:\/\/(?:www\.)?naturesparkle\.com\S*/gi, "https://meekitaz.com"],
  [/\bnaturesparkle\.com\b/gi, "meekitaz.com"],
  [/\bRenaissance\s+Jewel(?:s|ry)?\b/gi, "Meekitaz"],
  [/\bNature[\s-]?Sparkle(?:\s+Fine\s+Jewelers)?\b/gi, "Meekitaz"],
];
export const brandify = (s: string) => RULES.reduce((t, [re, to]) => t.replace(re, to), s || "");

// Products we must not sell (licensed by someone else). They are archived in Shopify; this is a second lock.
const BLOCKED_TAGS = ["fifa world cup 2026"];
export const isBlocked = (tags: string[]) => tags.some(t => BLOCKED_TAGS.includes(t.toLowerCase()));
