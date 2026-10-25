/** One source for the /faq page and for Mia's knowledge. Answers may use [text](/link) links. */
export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; items: FaqItem[] };

export const FAQ: FaqSection[] = [
  { id: "about", title: "Why Meekitaz", items: [
    { q: "What makes Meekitaz different from other jewelers?", a: "Transparent pricing, ethical sourcing, and real craftsmanship and customization. We source our diamonds directly and craft our jewelry in New York, which lets us offer very competitive prices, backed by a Price Match Guarantee." },
    { q: "I'm not sure where to start with choosing an engagement ring.", a: "We're here to help. Book a free one-on-one consultation (video call or showroom) with a diamond specialist, or ask Mia in chat. We'll walk you through diamonds, settings, customization and budget." },
    { q: "Do you have a physical store?", a: "We have a showroom on Fifth Avenue in New York, by appointment. Most of our business is online, which lets us offer a wide selection at better prices." },
    { q: "Can I see the jewelry in person?", a: "Yes. Book an appointment at our Fifth Avenue showroom, or a video call with a diamond specialist." },
    { q: "Do you price match?", a: "Yes. If you find a comparable item for less at another authorized U.S. retailer, contact us and we'll look at matching it." },
  ] },
  { id: "custom", title: "Custom design & changes", items: [
    { q: "Can I change something in a ring I like?", a: "Yes, anything. Tell us what you'd like to change and we'll send you a 3D CAD model of your ring for approval. You can ask for changes until you love it, and once you're happy you place your order and we make your ring." },
    { q: "I love two different rings. Can you combine them?", a: "Yes. Send us both designs and tell us what you love about each; we'll design one ring that combines them and send you a 3D CAD model for approval. You can request changes until it's exactly right, then order and we make it for you." },
    { q: "Can the band be thicker or thinner?", a: "Yes. When you place your order, write the band width you'd like in the order notes and we'll make the change at no extra cost." },
    { q: "Can I request a completely custom design?", a: "Yes. Share a sketch, photo or idea and we'll create a 3D CAD model for your approval, with changes until you love it. Ask in chat or email us to start." },
    { q: "Can I design my own engagement ring?", a: "Yes. Choose any setting, then add the diamond you want: shape, carat, color, clarity and metal. [Start with a setting](/engagement-rings) or [start with a diamond](/diamonds)." },
    { q: "Do you offer engraving?", a: "Yes, we can engrave initials, a date or a short message on most pieces. Add it to your order notes or tell us in chat." },
    { q: "Which metals do you offer?", a: "Sterling silver, 10K, 14K and 18K yellow, white and rose gold, and platinum." },
    { q: "What's the difference between white gold and platinum?", a: "White gold is gold alloyed with white metals and coated with rhodium for a bright white finish. Platinum is naturally white, doesn't need plating, and is more durable, but heavier and more expensive." },
    { q: "What is rhodium plating, and does my jewelry need it?", a: "Rhodium plating gives white gold its bright white shine. Over time it can wear off; re-plating is included in our care packages." },
  ] },
  { id: "diamonds", title: "Diamonds & certificates", items: [
    { q: "Do you have large diamonds, like a 4 ct radiant?", a: "Yes. Choose any setting you like and add the diamond you want: shape, carat, color and clarity. [Browse settings](/engagement-rings) or [browse diamonds](/diamonds), or ask in chat and we'll send you options." },
    { q: "Do you offer natural diamonds?", a: "Yes. Most of our pieces feature lab-grown diamonds, and natural diamonds are available too. Book an appointment with a diamond specialist and we'll show you a selection of natural stones side by side." },
    { q: "What's the difference between lab-grown and natural diamonds?", a: "Lab-grown diamonds are real diamonds, chemically and optically identical to natural ones; they're grown in a lab instead of mined, so you get a bigger, brighter stone for your budget. Natural diamonds formed in the earth over millions of years." },
    { q: "Are your diamonds certified?", a: "Yes. Every center diamond comes with a grading report from GIA or IGI, so its quality is independently verified. You can see the certificate on each diamond's page." },
    { q: "Are your diamonds laser inscribed?", a: "Many of our diamonds carry a laser inscription on the girdle with their certificate number. If it matters to you, ask us about a specific stone." },
    { q: "Are your diamonds conflict-free?", a: "Yes. Lab-grown diamonds are conflict-free by nature, and our natural diamonds follow the Kimberley Process." },
    { q: "Can I buy a loose diamond?", a: "Yes. Every diamond in our [diamond search](/diamonds) can be bought loose or set in any of our settings." },
    { q: "Do you offer other gemstones, like sapphires or emeralds?", a: "Our focus is diamonds, but we do offer select pieces with other gemstones. Contact us for availability and custom requests." },
    { q: "Can I upgrade my diamond later?", a: "Yes, we offer a diamond upgrade program: trade in your diamond toward a larger or higher-quality stone. Terms apply; contact us for details. We don't offer a general buy-back." },
  ] },
  { id: "sizing", title: "Ring size & resizing", items: [
    { q: "How do I find my ring size?", a: "Visit our showroom to be measured, ask Mia in chat for help, or order your best guess: your first resize is free." },
    { q: "Do you resize rings?", a: "Yes. Your first resize within the first year is free. After that, or for additional resizes, it's $25 for gold and $50 for platinum, or included in our care packages." },
    { q: "Can an eternity band be resized?", a: "Usually not. Because the diamonds go all the way around, eternity bands and some delicate styles can't be resized traditionally and may need to be remade in your new size." },
  ] },
  { id: "shipping", title: "Shipping & delivery", items: [
    { q: "Is shipping free?", a: "Yes. Every order ships free, fully insured and tracked, with FedEx or UPS. A signature is required on delivery, so your package goes only into your hands." },
    { q: "How long does it take?", a: "Our standard production time is about 2–3 weeks; custom designs may take a little longer. You'll get email updates throughout production and an estimated delivery date at checkout." },
    { q: "How can I track my order?", a: "Once your order ships you'll get a tracking number by email." },
    { q: "Do you ship internationally?", a: "Yes. Delivery times vary by destination, and duties or taxes at customs are paid by the customer. International orders are final sale." },
    { q: "Does it come gift-ready?", a: "Always. Every piece arrives in our signature pink Meekitaz box, with a velvet box for your piece and its certificate in a drawer below." },
  ] },
  { id: "payment", title: "Payment & financing", items: [
    { q: "Which payment methods do you accept?", a: "All major credit cards (Visa, Mastercard, American Express, Discover and more), plus Shop Pay, PayPal, Apple Pay and Google Pay." },
    { q: "Do you offer financing or payment plans?", a: "Yes. You can pay over time with options such as Affirm, Klarna and Afterpay, chosen at checkout." },
    { q: "Do you charge sales tax?", a: "Sales tax is applied to orders shipped to states where it's required by law, and is calculated at checkout." },
  ] },
  { id: "returns", title: "Returns & order changes", items: [
    { q: "What is your return policy?", a: "Free 30-day returns on U.S. orders: return any item in its original, unworn condition, with its certificate, for a full refund or exchange. Custom pieces and rings built to order may not be eligible for a full refund. [Full return policy](/return-policy)." },
    { q: "What if my ring arrives and I don't love it?", a: "Send it back within 30 days in its original, unworn condition for a full refund or exchange." },
    { q: "Can I change my order after placing it?", a: "We start on your order right away, so contact us as soon as possible and we'll do our best. Changes may not be possible once production has started, especially on custom or engraved pieces." },
    { q: "Can I cancel my order?", a: "Orders can be canceled within a short window after they're placed. Once an order is in production or has shipped it may not be cancelable; contact us right away." },
    { q: "What if my item arrives damaged or incorrect?", a: "Contact us right away and we'll arrange a return or exchange and cover the shipping." },
  ] },
  { id: "warranty", title: "Warranty & care", items: [
    { q: "Do you offer a warranty?", a: "Yes. Every piece comes with our free lifetime Manufacturer Warranty against manufacturing defects, plus one free resize in the first year. For ongoing care (cleanings, prong tightening, rhodium re-plating, stone re-setting) we offer 3-Year and Lifetime care packages. [See the warranty](/warranty)." },
    { q: "What if my jewelry needs a repair?", a: "Manufacturing defects are repaired free under our Manufacturer Warranty. Other repairs are done at cost, and we'll tell you the price before we start. Contact us to begin." },
    { q: "What if I lose a stone?", a: "Stone loss caused by a manufacturing defect is covered. Loss from normal wear can be repaired at cost, or is covered by our care packages (the Lifetime package replaces lost side stones once a year)." },
    { q: "Do you offer cleanings and inspections?", a: "Yes, free every six months with our care packages. Regular inspections keep prongs and settings secure and reduce the risk of losing a stone." },
    { q: "Do you insure jewelry?", a: "We don't provide insurance, and a warranty isn't insurance: loss or theft of the whole piece isn't covered. We recommend insuring your jewelry with a trusted provider." },
    { q: "Do you provide appraisals?", a: "Yes, we provide appraisal documents on request, useful for insurance." },
    { q: "How do I clean my jewelry at home?", a: "Soak it in warm water with a little mild dish soap for 15–20 minutes, brush gently with a soft brush, rinse and dry with a lint-free cloth. Avoid harsh chemicals and ultrasonic cleaners unless recommended for your piece." },
    { q: "How should I store my jewelry?", a: "In a fabric-lined box or soft pouch, each piece separately to avoid scratches and tangles, away from harsh chemicals. Take rings off for heavy physical activity." },
  ] },
  { id: "jewelry", title: "Our jewelry", items: [
    { q: "Do you sell wedding bands?", a: "Yes, for women and men: classic metal bands, diamond bands and eternity bands." },
    { q: "Do you sell earrings, necklaces and bracelets?", a: "Yes. Diamond studs, hoops, pendants, tennis necklaces and bracelets, and more." },
  ] },
  { id: "offers", title: "Offers & contact", items: [
    { q: "What is the free studs offer?", a: "Sign up for our emails and get a pair of 0.5 ct lab-grown diamond studs in sterling silver free with a first order of $1,000 or more. Use code FREESTUDS at checkout. One pair per customer." },
    { q: "How can I contact you?", a: "Chat with Mia anytime (a real person can join), email us, or book a showroom or video appointment." },
  ] },
];

/** Plain text of the FAQ, for Mia's instructions. */
export const FAQ_TEXT = FAQ.map(s => `## ${s.title}\n` + s.items.map(i => `Q: ${i.q}\nA: ${i.a.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 (https://www.meekitaz.com$2)")}`).join("\n")).join("\n\n");
