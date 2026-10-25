/** One source for the /faq page and for Mia's knowledge. Answers may use [text](/link) links. */
export type FaqItem = { q: string; a: string };
export type FaqSection = { id: string; title: string; items: FaqItem[] };

export const FAQ: FaqSection[] = [
  { id: "custom", title: "Custom design & changes", items: [
    { q: "Can I change something in a ring I like?", a: "Yes, anything. Tell us what you'd like to change and we'll send you a 3D CAD model of your ring for approval. You can ask for changes until you love it, and once you're happy you place your order and we make your ring." },
    { q: "I love two different rings. Can you combine them?", a: "Yes. Send us both designs and tell us what you love about each; we'll design one ring that combines them and send you a 3D CAD model for approval. You can request changes until it's exactly right, then order and we make it for you." },
    { q: "Can the band be thicker or thinner?", a: "Yes. When you place your order, write the band width you'd like in the order notes and we'll make the change at no extra cost." },
    { q: "Can I engrave my ring?", a: "Yes, we can engrave initials, a date or a short message. Add it to your order notes or tell us in chat." },
    { q: "Can I request a completely custom design?", a: "Yes. Share a sketch, photo or idea and we'll create a 3D CAD model for your approval, with changes until you love it. Ask in chat or email us to start." },
  ] },
  { id: "diamonds", title: "Diamonds & certificates", items: [
    { q: "Do you have large diamonds, like a 4 ct radiant?", a: "Yes. Choose any setting you like and add the diamond you want: shape, carat, color and clarity. [Browse settings](/engagement-rings) or [browse diamonds](/diamonds), or ask in chat and we'll send you options." },
    { q: "Do you offer natural diamonds?", a: "Yes. Most of our pieces feature lab-grown diamonds, and natural diamonds are available too. Book an appointment with a diamond specialist and we'll show you a selection of natural stones side by side." },
    { q: "Are your diamonds certified?", a: "Yes. Every center diamond comes with a grading report from GIA or IGI, so its quality is independently verified. You can see the certificate on each diamond's page." },
    { q: "What's the difference between lab-grown and natural diamonds?", a: "Lab-grown diamonds are real diamonds, chemically and optically identical to natural ones; they're grown in a lab instead of mined, so you get a bigger, brighter stone for your budget. Natural diamonds formed in the earth over millions of years." },
    { q: "Can I buy a loose diamond?", a: "Yes. Every diamond in our [diamond search](/diamonds) can be bought loose or set in any of our settings." },
    { q: "Can I upgrade my diamond later?", a: "Yes, we offer a diamond upgrade program. Contact us for details." },
  ] },
  { id: "sizing", title: "Ring size & resizing", items: [
    { q: "Do you resize rings?", a: "Yes. Your first resize is free. Additional resizes are $25 for gold rings and $50 for platinum rings, or included in our warranty packages. Eternity bands and some delicate styles can't be resized traditionally and may need to be remade." },
    { q: "I don't know my ring size. What should I do?", a: "Order your best guess; your first resize is free. You can also visit our showroom to be measured, or ask in chat and we'll help you find it." },
  ] },
  { id: "shipping", title: "Shipping & delivery", items: [
    { q: "Is shipping free?", a: "Yes. Every order ships free, fully insured and tracked, with FedEx or UPS. A signature is required on delivery, so your package goes only into your hands." },
    { q: "How long does it take?", a: "Our standard production time is about 2–3 weeks; custom designs may take a little longer. You'll get email updates throughout production and a tracking number when it ships." },
    { q: "Do you ship internationally?", a: "Yes. Delivery times vary by destination, and duties or taxes at customs are paid by the customer. International orders are final sale." },
  ] },
  { id: "returns", title: "Returns", items: [
    { q: "What is your return policy?", a: "Free 30-day returns on U.S. orders: return any item in its original, unworn condition, with its certificate, for a full refund or exchange. Custom pieces and rings built to order may not be eligible for a full refund. [Full return policy](/return-policy)." },
  ] },
  { id: "warranty", title: "Warranty & care", items: [
    { q: "Do you offer a warranty?", a: "Yes. Every piece comes with our free lifetime Manufacturer Warranty against manufacturing defects, plus one free resize. For ongoing care (cleanings, prong tightening, rhodium re-plating, stone re-setting) we offer 3-Year and Lifetime warranty packages. [See the warranty](/warranty)." },
    { q: "What if I lose a stone?", a: "Stone loss caused by a manufacturing defect is covered by our Manufacturer Warranty. Loss from normal wear can be repaired at cost, or is covered by our warranty packages (the Lifetime package replaces lost side stones once a year). A warranty is not insurance, so we recommend insuring your jewelry." },
    { q: "How do I clean my jewelry?", a: "Soak it in warm water with a little mild dish soap for 15–20 minutes, brush gently with a soft brush, rinse and dry with a lint-free cloth. Avoid harsh chemicals." },
  ] },
  { id: "showroom", title: "Showroom & appointments", items: [
    { q: "Can I see the jewelry in person?", a: "Yes. Book an appointment at our Fifth Avenue showroom in New York, or a video call with a diamond specialist." },
  ] },
  { id: "offers", title: "Offers", items: [
    { q: "What is the free studs offer?", a: "Sign up for our emails and get a pair of 0.5 ct lab-grown diamond studs in sterling silver free with a first order of $1,000 or more. Use code FREESTUDS at checkout. One pair per customer." },
  ] },
];

/** Plain text of the FAQ, for Mia's instructions. */
export const FAQ_TEXT = FAQ.map(s => `## ${s.title}\n` + s.items.map(i => `Q: ${i.q}\nA: ${i.a.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 (https://www.meekitaz.com$2)")}`).join("\n")).join("\n\n");
