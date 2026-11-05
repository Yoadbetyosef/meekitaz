/** Search copy written for Meekitaz, one entry per design (the NS code). It sits in the site, not in Shopify: the product page, the schema.org data and the
 *  Google/Meta feed read it first and fall back to the Shopify text for a design that has no entry yet. Nothing in Shopify changes.
 *  Placeholders: {stone} = the center stone as the product title names it ("Cushion", "Fancy Blue Cushion Cut"), {metal} = the metal in lower case.
 *  Only facts that are in the product's own title and tags go in; the shape sentences are general knowledge about the cut. */
type Entry = { title: string; desc: string };

const COPY: Record<string, Entry> = {
  "NS-2248": { title: "{Stone} Hidden Halo Solitaire Engagement Ring in {Metal}", desc: "A {stone} lab-grown diamond on a polished {metal} band, with a row of small diamonds tucked beneath the stone where only the side view gives it away. From the top it reads as a clean solitaire; from the side it catches the light twice." },
  "NS-2122": { title: "{Stone} Hidden Halo Solitaire Engagement Ring in {Metal}", desc: "A {stone} lab-grown diamond held in a prong setting, with a hidden halo of small diamonds beneath the center stone. The top stays a clean solitaire, and the halo shows from the side. Crafted in {metal}." },
  "NS-2177": { title: "Classic {Stone} Solitaire Engagement Ring in {Metal}", desc: "One {stone} lab-grown diamond on a plain {metal} band, nothing added. A classic, minimalist solitaire that puts the whole attention on the stone." },
  "NS-2125": { title: "{Stone} Solitaire Engagement Ring with Pavé Band in {Metal}", desc: "A {stone} lab-grown diamond solitaire on a {metal} band set with pavé diamonds. The small stones carry the sparkle down the band, so the ring shines from every angle, not only from the top." },
  "NS-2231": { title: "East-West {Stone} Bezel Solitaire Ring in {Metal}", desc: "A {stone} lab-grown diamond set east to west across the finger in a {metal} bezel, a metal rim that wraps the edge of the stone. The horizontal setting sits low and secure, and it looks different from the usual north-south solitaire." },
  "NS-2127": { title: "{Stone} Engagement Ring with Marquise Side Stones in {Metal}", desc: "A {stone} lab-grown diamond center stone with marquise-shaped diamonds on either side, in {metal}. The pointed side stones give the ring a floral, petal-like line." },
  "NS-2190": { title: "{Stone} Three-Stone Ring with Pear Side Stones in {Metal}", desc: "A three-stone ring: a {stone} lab-grown diamond in the center between two pear-shaped diamonds, in {metal}. A floral-inspired design in which the side stones frame the center one." },
  "NS-2138": { title: "{Stone} Three-Stone Ring with Tapered Baguette Side Stones in {Metal}", desc: "A {stone} lab-grown diamond in the center with a tapered baguette diamond on each side, in {metal}. The tapered stones narrow toward the center and lead the eye to it." },
  "NS-2158": { title: "{Stone} Three-Stone Ring with Trillion Side Stones in {Metal}", desc: "A three-stone ring in {metal}: a {stone} lab-grown diamond between two triangular trillion-cut diamonds. The angular side stones give the center stone a sharper frame." },
  "NS-2200": { title: "{Stone} Three-Stone Ring with Half Moon Side Stones in {Metal}", desc: "A {stone} lab-grown diamond in the center with a half-moon diamond on each side, in {metal}. The curved side stones sit flat against the center stone like a crescent." },
  "NS-2211": { title: "{Stone} Three-Stone Ring with Step-Cut Side Stones in {Metal}", desc: "A {stone} lab-grown diamond in the center with a step-cut diamond on each side, in {metal}. Step-cut stones have long, clear facets, which give the ring a calmer, more architectural look." },
  "NS-2126": { title: "{Stone} Three-Stone Ring with Heart Side Stones in {Metal}", desc: "A {stone} lab-grown diamond in the center with a heart-shaped diamond on each side, in {metal}. A romantic three-stone ring." },
  "NS-2219": { title: "{Stone} Three-Stone Ring with Tapered Baguette and Round Side Stones in {Metal}", desc: "A {stone} lab-grown diamond in the center, with tapered baguette and round diamonds on each side, in {metal}. The two shapes step down from the center stone along the band." },
};

const SHAPE_LINE: Record<string, string> = {
  Round: "The round brilliant is the classic cut, faceted to send back as much light as possible.",
  Oval: "An oval has the brilliance of a round with a longer line, which lengthens the finger.",
  Cushion: "A cushion cut has soft, rounded corners and a pillowy outline.",
  Emerald: "The emerald cut is a step cut: long, clean facets that flash like mirrors rather than sparkle.",
  Pear: "A pear shape tapers from a rounded end to a point and can be worn point up or down.",
  Princess: "The princess cut is square with sharp corners and brilliant faceting.",
  Radiant: "The radiant cut has trimmed corners and brilliant faceting: the outline of an emerald with the sparkle of a round.",
  Marquise: "A marquise is a long, pointed oval, and it makes a stone look larger for its carat weight.",
  Asscher: "An Asscher is a square step cut with cropped corners and an art-deco feel.",
  Heart: "A heart-shaped diamond is a pointed oval with a cleft: a romantic and less common cut.",
};

const METALS = ["White gold", "Yellow gold", "Rose gold", "Platinum", "Silver"];

/** The new search title and description for a product, or null when its design has no entry yet or its title does not follow the pattern. */
export function copyFor(p: { title: string; tags: string[] }): Entry | null {
  const code = p.tags.find(t => /^NS-\d+$/.test(t)); const e = code && COPY[code]; if (!e) return null;
  const metal = METALS.find(m => p.title.startsWith(m + " ")); if (!metal) return null;
  const m = /^(?:Three[- ]Stone )?(.+?) Diamond /.exec(p.title.slice(metal.length + 1)); if (!m) return null;
  const stone = m[1], metalLc = metal.toLowerCase();
  const art = /^[aeiou]/i.test(stone) ? "An" : "A";
  const fill = (s: string) => s.replace(/\bA \{stone\}/g, `${art} {stone}`).replace(/\{Stone\}/g, stone).replace(/\{stone\}/g, stone.toLowerCase())
    .replace(/\{Metal\}/g, metalLc.replace(/\b\w/g, c => c.toUpperCase())).replace(/\{metal\}/g, metalLc);
  const shape = Object.keys(SHAPE_LINE).find(sh => new RegExp(`(^| )${sh}( |$)`).test(stone));
  return { title: fill(e.title), desc: `${fill(e.desc)}${shape ? " " + SHAPE_LINE[shape] : ""} Made for you in New York.` };
}
