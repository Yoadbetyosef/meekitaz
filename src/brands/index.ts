/** Multi-brand config. The brand is chosen at build time with NEXT_PUBLIC_BRAND (meekitaz | tg).
 *  Everything that differs between the sites — name, logo, colours, fonts, film — lives here; the rest of the code is shared. */
export type Brand = {
  key: string;
  name: string;            // "MEEKITAZ"
  wordmark: string;        // text wordmark used when there is no logo image
  logo?: { src: string; width: number; height: number; alt: string; color?: string }; // optional image wordmark (nav + footer); with color, the image is used as a mask and painted in that colour
  title: string;           // <title>
  description: string;
  display: string;         // name as written in running text ("Meekitaz")
  email: string;
  phone?: { display: string; tel: string };
  /** Showroom: `in` = "in our ___ showroom", `short` = back-label, `line` = booking option sub-line, `address` = footer lines. */
  showroom: { in: string; short: string; line: string; address: string[] };
  domain: string;
  themeColor: string;
  fonts: "meekitaz" | "tg";
  colors: Record<string, string>; // CSS custom properties (without the leading --)
  film: { src: string; poster: string; headline: string; copy: string };
  /** Per-slide overrides for the home hero (same order as lib/data slides). Omit to keep the shared images. */
  heroSlides?: Partial<{ desktop: string; mobile: string; pos: string; posM: string; zoomM: number; small: string; big: string }>[];
  /** Image per hamburger-menu tile, keyed by href (/engagement-rings, /diamonds, …). Omit to keep the shared images. */
  menuTiles?: Record<string, { img: string; pos?: string; posM?: string }>;
  /** Image per "Shop by category" tile on the home page, keyed by href. Omit to keep the shared images. */
  categoryTiles?: Record<string, { img: string }>;
  /** Images of the NEW block layers (yellow / pink / green) and the footer "hush" card. Omit to keep the shared images. */
  newCard?: { fancy?: string; pink?: string; green?: string };
  hushImg?: string;
  /** "Shop the look" photo (16:9) and where each piece sits on it, as [x%, y%]. focusX = which part of the photo stays in frame on phones (0 left … 1 right). */
  /** "Our designers" section on the home page (after House codes). No links by design. Omit to hide the section. */
  /** Private Clients photo: wide image for desktop, portrait for phones. Omit to keep the shared showroom image. */
  showroomImg?: { desktop: string; mobile: string; alt: string };
  /** House codes card images, keyed by href. Omit to keep the shared images. */
  houseCodes?: Record<string, { img: string }>;
  /** Real customer reviews (shown as text cards, no photos). Omit to keep the shared sample reviews. */
  reviews?: { source: string; rating: number; count: number; asOf: string; items: { name: string; text: string; date: string; photos?: string[] }[] };
  /** "Follow us on Instagram" reel (after Private Clients): short muted looping clips from the brand's own feed. Omit to hide. */
  instagram?: { handle: string; url: string; items: { video: string; poster: string }[] };
  designers?: { eyebrow: string; title: string; intro: string; items: { name: string; tag: string; text: string; img: string; alt: string }[] };
  shopLook?: { img: string; alt: string; focusX: number; points: Record<"earrings" | "necklaces" | "bracelets" | "rings", [number, number]> };
};

const meekitaz: Brand = {
  key: "meekitaz",
  name: "MEEKITAZ",
  display: "Meekitaz",
  showroom: { in: "Fifth Avenue", short: "Fifth Avenue", line: "Fifth Avenue, New York", address: ["Fifth Avenue, New York"] },
  wordmark: "MEEKITAZ",
  title: "MEEKITAZ — Serious diamonds, worn lightly.",
  description: "Lab-grown diamond jewelry. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
  email: "hello@meekitaz.com",
  domain: "meekitaz.com",
  themeColor: "#C4DEEE",
  fonts: "meekitaz",
  colors: {},
  film: { src: "/media/meekitaz-film.mp4", poster: "/media/meekitaz-film-poster.jpg", headline: "How we do diamonds", copy: "Every Meekitaz stone is IGI or GIA certified, grown above ground and set in our Fifth Avenue atelier. Same fire. Lighter footprint." },
};

const tg: Brand = {
  key: "tg",
  name: "TG Jewellers",
  display: "TG Jewellers",
  showroom: { in: "Vancouver", short: "Vancouver", line: "Granville Street, Vancouver", address: ["#622-736 Granville", "Vancouver, BC V6Z 1G3", "Canada"] },
  wordmark: "TG JEWELLERS",
  logo: { src: "/brands/tg/logo.png", width: 2089, height: 230, alt: "TG Jewellers", color: "#E9E4F5" },
  title: "TG Jewellers — Custom rings & fine jewellery.",
  description: "Custom rings and fine jewellery with lab-grown diamonds. IGI / GIA certified. Engagement rings, diamonds, earrings, necklaces, bracelets and bands.",
  email: "hello@tgjewellers.com",
  phone: { display: "+1 604-446-8438", tel: "+16044468438" },
  domain: "tgjewellers.com",
  themeColor: "#9B7BE0",
  fonts: "tg",
  // Amethyst: purple page, lavender logo on a glass nav, lilac-mist CTAs with ink text (chosen 2026-10-21).
  // --red = accent text on light surfaces, --cta = button background, --on-cta = text on buttons, --on-ink = text on dark chips, --ivory = light surface.
  colors: {
    "blue-light": "#9B7BE0",  // page background (Amethyst)
    "blue": "#E6D9FF",        // light accent (desktop hero button, dots, checks)
    "pink": "#F7D3DA",        // blush
    "rose": "#7B5BC4",        // menu overlay
    "sage": "#DCE9D9",
    "red": "#4A3A6B",         // accent text on light surfaces (prices, labels, active states)
    "cta": "#F3EFF9",         // every button background (Lilac mist)
    "on-cta": "#2B2733",      // text on buttons (ink)
    "on-ink": "#FFFFFF",      // text on dark ink chips / selected options
    "ivory": "#FBF9F6",       // light surface (drawer, product & category pages)
    "ink": "#2B2733",         // body text
    "gold": "#E9E4F5",
  },

  // Hero: natural-colour lifestyle set in the Meekitaz style (studs slide kept lilac) — 2026-10-21 (desktop 16:9 / mobile 3:4)
  heroSlides: [
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153756_96e7714b-5de1-4c62-b4ae-0f9e3b08a9c6.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153756_12e9df29-f3b8-4f69-95d4-b17a233c22e9.png", pos: "50% 40%", posM: "50% 30%", zoomM: 1 },
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154018_b03ef699-4829-4217-bff4-332735682612.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154018_effb8adb-3f95-43ca-a1b7-38da7d4ab07a.png", pos: "50% 50%", posM: "50% 50%", zoomM: 1 },
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153242_17e2e977-1d6f-41b7-bea7-22b97cbe6c9a.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153239_c6ee0f36-f298-427e-b1b5-d43c368a3de5.png", pos: "50% 40%", posM: "50% 40%", zoomM: 1 },
    { desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153734_d0ab09f9-2ce6-47e9-bfc9-c3f5fa6d24ae.png", mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_153735_6f065dcf-113e-457d-8069-33948f4e7e2f.png", pos: "50% 50%", posM: "50% 50%", zoomM: 1 },
  ],
  // Hamburger menu tiles — natural editorial set, 2026-10-21
  menuTiles: {
    "/engagement-rings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154431_f37ca43a-0469-454b-88e8-b4b9b1d7a9a0.png" },
    "/diamonds": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154432_22a49aac-88bd-4e16-aaed-3aa810297ea0.png" },
    "/earrings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154430_6b07bcf4-c4b0-42bd-a6e6-2d28d59157fa.png" },
    "/necklaces": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154432_8b206341-d43d-4585-856b-313018d2461c.png" },
    "/bracelets": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154431_cbceb330-b0d6-4e68-94dc-ed071a1e696d.png" },
    "/bands": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154431_58183e72-566b-487c-a138-6bf3d3c7b276.png" },
  },
  // Shop by category — black & white studio set, 2026-10-21
  categoryTiles: {
    "/engagement-rings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154804_b3e86786-0e3a-4d70-b96b-cbf20f8dc575.png" },
    "/diamonds": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154803_5fd76d05-22b1-444a-b3e8-deac63b751a4.png" },
    "/earrings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154802_9c5d7e3d-da5f-4e88-a1b2-a315d3e7db75.png" },
    "/necklaces": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154804_3138d189-e2c3-4b28-b05c-6b73a7f8865b.png" },
    "/bracelets": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154805_cfbfaebb-7bb7-4d13-a5a3-08ce555ad115.png" },
    "/bands": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154803_b84a6343-8d4a-40c7-b39a-f5f64c03c316.png" },
  },
  // NEW block layers + footer hush card, 2026-10-21
  newCard: { fancy: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_155309_58f13e5a-5ca7-4919-bb35-bb0042ca2f3f.png", pink: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_155310_917dfe5d-2b3a-48ee-b69b-702698b5eccd.png", green: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_162704_f128b38b-3639-4705-a7f8-2d6e34dc0d56.png" },
  hushImg: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_154916_7791fcbf-a9cd-41de-bf8c-2ef949b7ff95.png",
  // Private Clients: the Vancouver showroom, restyled lilac-and-white with the gold computer (2026-10-21)
  showroomImg: {
    desktop: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_163631_e2cb8d0a-6a41-4670-8801-051d7172e450.png",
    mobile: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_163631_d0bf4047-114f-48cc-8bab-9fc6d56ff636.png",
    alt: "TG Jewellers showroom in Vancouver: marble floor, brass and glass display cases with lilac velvet trays, white chairs and a plush white rug",
  },
  // House codes — quiet flex / statement weight / effortless cool (2026-10-21)
  houseCodes: {
    "/necklaces": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_164215_56dfb432-0442-4156-b2f6-84f4ed506511.png" },
    "/bracelets": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_164216_0ed69b0c-5d97-4e1e-aeda-b6ac9c14046a.png" },
    "/engagement-rings": { img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_164214_4a53f759-9ee6-4c65-9638-4b942046f5d6.png" },
  },
  // Real Google reviews of TG Jewellers (verbatim, reviewer shown as first name + initial; photos = the reviewer's own Google uploads, hot-linked). Pulled 2026-10-21 from the Google Business Profile: 5.0 · 102 reviews.
  reviews: {
    source: "Google", rating: 5, count: 102, asOf: "Oct 2026",
    items: [
      { name: "Lidia P.", text: "I was looking for a tennis necklace and was really impressed by their selection! They have so many beautiful options at great prices. The staff were also super friendly and helpful throughout the process. Definitely recommend checking them out!", date: "Oct 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLcIQnnzh33MesbTS50A9D5rOUixxpf2r3uAtB5-Lol2iXCsqsZnKzW0mNOc9pK_iLKIFd6awS243lRoj2mHdZMh62htZBUMGYPw5W3NaBBvdNn8Rhr7_IamLvmHh_FF_8JMeMiZm-gdkx61=w900-k-no"] },
      { name: "Altynay P.", text: "I received a beautiful set of diamond earrings and a pendant for my birthday specially made for me by TG Jewellers. The set is even more beautiful than I expected! I will definitely be back for more pieces in the future. Thank you so much, TG Jewellers!", date: "Oct 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLcpzyRXxrA2Da3FDF8SvSbIraGP6fjbC05qySej-qVobq0Tah7RziHCLvjg5XvnpcId_fmrUw4idNP5UUoIa8woce2ZPkSTW5MIG5xDtgcR0AoQA1crdC-nzfP9IUHxyvuZ0HgVq4L36Fc=w900-k-no"] },
      { name: "Adiya B.", text: "Me and my now husband chose  TG Jewellers for our wedding bands and really appreciated Tatiana's knowledge and guidance. Having someone knowledgeable help us with such a meaningful decision made the experience special. We're very happy with our rings and look forward to wearing them for years to come. Thank you for being part of our wedding journey!", date: "Oct 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLd2y_lzWgU8uCM9Z3s1Z_MHcAGEjrBaFmpPdeTKYpDGslz9MVQX70MQudqbEPalLX2N3WaR0UR6FbNwDN0545WQOmKSEboaUYCKJSkXRDB1weKXfHYOIWgk2C7ECUokTwbuvjdKvO--5azm=w900-k-no"] },
      { name: "Dani L.", text: "We were visiting Vancouver for the 2026 FIFA World Cup, and it also happened to be our 20th wedding anniversary. I wanted to surprise my wife with something special, so I found TG Jewellers through a Google search. From the moment we walked in, we were impressed by the exceptional service, beautiful selection, and outstanding craftsmanship. I purchased a stunning tennis bracelet, and my wife absolutely loved it. We were so happy with our experience that we came back later that week to buy a few more gifts to take home. Thank you, Tatiana and the entire TG Jewellers team, for making our anniversary even more memorable. We will definitely be ordering more pieces in the future and highly recommend TG Jewellers to anyone looking for beautiful jewellery and outstanding customer service!", date: "Jul 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLde7a1cSGDiP_nCL3Ba2SHffGIHLwOuSQ2gQJngLhkFD0X3EliKPelgLZ7GaoLVkbXgLVpsz-vD02rPx0Pcy1XRTy6cSG6NHcc8arkX63FJYuW_PelHcMmKf0T2cuXnIaGDJkimh6ri6WNw=w900-k-no", "https://lh3.googleusercontent.com/grass-cs/AABkmLe0U1JXGOh7YzgiVogYlRxaAXOMQI3dFbJzrc6b-0muRmoBelNAtXbFCOpTsESIHin7M9aYVU-LDPfZz-rNfjPkvL7Hj5c_EaJWvL4W6vuJqIAIOdIKGSMhutJPcObsrJo42VQNMUo4mj69=w900-k-no"] },
      { name: "Adam E.", text: "It was an absolute pleasure working with Tatiana! We had been shopping for an engagement ring for quite some time, and we’re so glad we found TG Jewellers. From the moment we walked in, Tatiana made the entire experience enjoyable and stress-free. She listened to what we wanted, guided us through every step, and created the perfect ring. We couldn’t be happier with the final result. If you’re looking for beautiful custom jewellery and exceptional customer service, we highly recommend TG Jewellers!", date: "Jul 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLdCS8icNuQLZArug4ATnHwHitfsnVdIlW4eYwNrvFoDrn72xHwzA_4Ii1vnfPzMjWW3A8xbXA3z0Prk8qRJkeby41cDjxzs7nvIg4xmjFQjwYmpekeqpneGMjoHdGz7cVvIrVIANcDRWn9M=w900-k-no", "https://lh3.googleusercontent.com/grass-cs/AABkmLfyzvf4Sbnjf-D9IJnbX3NaScl4A4ah2O3mqiNL1VtYAtxLdOME9UMkugPBukr1a3ODNps6-SYc2t3kuwFb2xcMsUvOU7IEGj7tFEqSE5U3a6reGizNdgpzHbe60vklVIKek9VHHmJ7CKnD=w900-k-no"] },
      { name: "Ilya K.", text: "Working with Tatiana to create the perfect engagement ring was an incredible experience. She guided us through the entire process, helping us find the perfect stones and carefully refining the design until it was exactly what we had envisioned. Tatiana's expertise, creativity, and patience made what could have been a stressful decision feel easy, enjoyable, and exciting. We truly appreciated her attention to detail and the care she put into every step of the process. We couldn't be happier with the final ring and are so grateful for all of Tatiana's help. We highly recommend TG Jewellers to anyone looking for exceptional craftsmanship and outstanding customer service.", date: "Jul 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLekrPsNR2MUGqZwq1J1oNx4gIdQMQTM9BMJaxdelgCypd2fP5jIHDFlxo-0LQXfaNTXXqxOPsUiS1B5vnWDU3vYEGtp52J6gwBgYawivHjmzqw7z8d-rnYgtrSGn_2U9tNrg1WDFu84ExzB=w900-k-no"] },
      { name: "Larisa T.", text: "I can't recommend TG Jewellers enough! I've been buying and creating my jewelry with them for over 10 years, and I wouldn't go anywhere else. Tatiana, Avi, and the whole family are amazing, kind, and always make the experience enjoyable. Their prices are unbeatable, and the quality and craftsmanship are exceptional. If you're looking for beautiful jewelry and outstanding service, TG Jewellers is the place to go!", date: "Jul 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLfBBRv6UyxpiGw4z-G36X5gWNbi8nGS2dkcoDaietJF9BBpLaMoR7BePYpuWfmg7DJIa831YP5904dbHV0PuyoOfmnCfcIAS0lXuXk1in5DD_jbPtP1jaR3ehVcfBG08ucf4PMo-FVXtHH4=w900-k-no"] },
      { name: "Dana S.", text: "I had the most wonderful experience creating my custom jewelry pieces at TG Jewellers. From start to finish, the team was incredibly professional, knowledgeable, and patient throughout the design process.", date: "Feb 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLc8Z_gw8xn0YQD9N5cjn3Fri9tfNh90Lpwg86YEQ5uHmHygW7XLX93f3rNN9T6yaIHu_yyN1HQFfJ4tCOB-GfzzcsMG4bIaQrHsrNDy4ym6BbugkYDSyGhP_Dba8Nsi8I7xop-Uy9A7RuUb=w900-k-no", "https://lh3.googleusercontent.com/grass-cs/AABkmLc7CaKZdLldktA7TiXTD5iqtNeD_kpSBEuv93_gystUMWR3OFtazUZJThEM_CDdgwC680tK_S_GkeZnJX4c-4hYmQ2XwmngD2BTeQ5tj-iFNTU36kEM-bqEb34KEgAjR25zLdnACtgpYeo=w900-k-no"] },
      { name: "Anya E.", text: "I’ve been buying jewelry from TG Jewellers on a regular basis, and it’s truly never a disappointment. Working with Tatiana is an absolute pleasure ,she is incredibly knowledgeable, honest, and genuinely cares about her clients. Every piece I’ve purchased has been stunning, beautifully crafted, and exactly what I was hoping for (if not better). The entire experience always feels personal and special. I wouldn’t trust anyone else with my jewelry. Highly, highly recommend Tatiana and TG Jewellers.", date: "Feb 2026", photos: ["https://lh3.googleusercontent.com/grass-cs/AABkmLdzLvQbSWc42ufAmroWfRfshSXiqWDizw3sgFQ6e68dUKYFmuPkS64IALA2Oze0M1cwhAClwgCk4ONnDXPqf4-eIzavw8zksrdT97RqkwB5hXQcwEmxRXUs2JzB__jk7L8J2Zah2ggsdjd3=w900-k-no"] },
      { name: "Nader N.", text: "Very happy with my custom design order for my partner. Perfect timing, great design and very professional. Thank you 🙏🏼", date: "Oct 2026" },
      { name: "Yulia N.", text: "So happy with my purchase and overall experience! I needed to have custom pins made, and nobody could make them except for TG Jewellers. When I picked them up, I couldn’t believe how amazing they looked, beyond my expectations! Love my pins and will only be going to TG going forward! Thank you!", date: "Oct 2026" },
      { name: "Jordan R.", text: "Amazing experience with TG Jewellers! Got such a beautiful engagement ring. Tatiana was so helpful in choosing the perfect ring. Would recommend 10/10!", date: "Jul 2026" },
      { name: "Josh H.", text: "The diamond is beautiful and was perfectly made with the help of Tatiana! She was very helpful with the entire process of getting a ring that was perfect for my soon to be fiancée.", date: "Jul 2026" },
      { name: "Jill K.", text: "Working with Tatiana was wonderful! She created exactly what I wanted, providing guidance throughout the process. My rings are beautiful. Looking forward to more.", date: "Apr 2026" },
      { name: "Janet G.", text: "Beautiful craftsmanship and such a great experience from start to finish. The attention to detail is amazing and you can really feel the care that goes into each piece. I’m so happy with my jewelry and would highly recommend Tatiana!!", date: "Mar 2026" },
    ],
  },
  // Instagram reel: six clips from TG's own feed (copied from tgjewellers.com into our media storage on 2026-10-21 so they don't depend on the old site's backend)
  instagram: {
    handle: "tgjewellers", url: "https://www.instagram.com/tgjewellers/",
    items: [
      { video: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/c4796725-3ce4-485b-9fcd-142b27c70a99.mp4", poster: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/bf1d9b11-be27-4153-beab-ffdb1700f62c.png" },
      { video: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/8aff6efe-cfaa-4c09-b6ac-d0e93ac57a2f.mp4", poster: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/75d5acd1-a1f5-4a00-9fdd-02a7ddab9d47.png" },
      { video: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/23f89dae-24a9-4fac-8428-a839c4dc30dd.mp4", poster: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/dd99e355-4d96-4584-978b-a3501dd1809a.png" },
      { video: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/f1483273-7a87-4234-8acf-5fd815a4d082.mp4", poster: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/b309e388-a62a-4404-9a28-c160233b702f.png" },
      { video: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/f1800ff2-1b67-4464-a0d4-8729ba1589fc.mp4", poster: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/51ff9807-42d8-492f-8ff1-9d90450b497f.png" },
      { video: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/3c810c7b-86f8-4ded-9983-115c0aed67f0.mp4", poster: "https://d2ol7oe51mr4n9.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/d8d049ec-849c-4ac1-b55f-967c4a77c645.png" },
    ],
  },
  // Our designers — two houses TG carries; mood photography generated 2026-10-21 (swap for the houses' own campaign images if licensed)
  designers: {
    eyebrow: "Our designers",
    title: "The houses we trust",
    intro: "Alongside our own custom work, TG Jewellers carries collections from design houses we have worked with for years.",
    items: [
      { name: "A.JAFFE", tag: "Est. 1892 · New York", text: "A New York house with more than a century behind it. The Quilts collection draws on 19th-century American quilting, where every patch tells a story, and the Classic collection is made for brides who prefer quiet detail.", img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_162314_526809a6-ccb0-441b-bd94-16338f801e54.png", alt: "Black and white photo of a bride's hand with a slim diamond band on a groom's tuxedo lapel" },
      { name: "CROWNRING", tag: "Since 1999", text: "Founded in 1999 by longtime friends Thierry Bellisha and Haimy Mann to mark life's biggest moments. Bridal jewellery and men's bands, built to be worn every day after the day itself.", img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_162252_8e8aa88c-69ae-40e8-8edc-12d99491180a.png", alt: "A men's rose gold and black wedding band with black diamonds on navy velvet" },
    ],
  },
  // Shop the look: lilac diner. Points are estimates from a screenshot — fine-tune with TG-shop-the-look-picker.html
  shopLook: {
    img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_160306_8baa115a-f754-4dea-a755-bc9091a9f9ad.png",
    alt: "Woman in a lilac diner booth, chin on her hand, wearing round diamond studs, a diamond tennis necklace, an oval diamond ring and two stacked tennis bracelets",
    focusX: 0.32,
    points: { earrings: [31, 34], necklaces: [36, 57], bracelets: [46, 54], rings: [48, 29] },
  },
  film: { src: "/media/meekitaz-film.mp4", poster: "/media/meekitaz-film-poster.jpg", headline: "How we do diamonds", copy: "Every TG Jewellers stone is IGI or GIA certified, grown above ground and set by hand in our workshop. Same fire. Lighter footprint." },
};

const brands: Record<string, Brand> = { meekitaz, tg };
export const brand: Brand = brands[process.env.NEXT_PUBLIC_BRAND || "meekitaz"] || meekitaz;

/** Inline CSS that overrides the :root tokens from globals.css for this brand. */
export const brandCss = Object.entries(brand.colors).map(([k, v]) => `--${k}:${v}`).join(";");
