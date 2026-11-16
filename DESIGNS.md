# Meekitaz — the design archive

Every design we replace stays here, so it can come back. Each one is a git tag on the repo: to see it, check out the tag; to bring
a piece back, restore its files from the tag (or revert the commit that replaced it). Standalone HTML previews of the options we
showed live in the chat outputs (meekitaz-*.html).

| Tag | What it is | Saved copy of the site |
|---|---|---|
| `design/cover-changing-slides` (7225c81) | The original cover: full-screen photos changing every 2 s like stories (Necklaces, The Tennis, The Studs, Engagement rings) | https://meekitaz-9j8w2p5yu-webc-charles-projects.vercel.app |
| `design/opening-dancer` (d2b2e44) | Blue intro → the white-dress dancer, "Take your shot." / the line + hand & fries + signature over the black button | — |
| `design/opening-film-corner` (bfcb834) | After the blue: the brand film in the corner/left column, the line written letter by letter, the hand with fries, the button | — |
| `design/opening-daily-ticket` (6f43d8a) | After the blue: the whole Daily section (statement, numbers, badges, reviews, white plan ticket) beside the film | — |
| `design/opening-daily-coin` (fa26a96) | After the blue: the film + the still pink coin, the passing row of pieces, one button, Q1 promises (current, 2026-11-10) | — |
| `design/find-your-thing-drawings` (9ca8f40) | Find your thing: the cobalt category drawings beside the feed reel (before Shop by category came back) | — |
| `design/rts-black-cards` (7a710ed) | Ready to ship: the black fanned-card strip | — |
| `design/rts-arch` (b5f0182) | Ready to ship: the bicycle film in the arch window (V2) | — |
| `design/footer-pink-shhh` (cb01f23) | Footer: the pink "Shhh." with the woman and the giant white wordmark | — |
| `design/home-lavender-brand-stories` (138d9a1) | Lavender grounds, with Brand stories (the three EVERY DAY cards) | — |
| `design/intro-blue-w1` (f0252dd) | The blue intro (W1): our M / Meekitaz flicker with his six ink drawings, faint grid, 000→100 counter, ending on the big watermark | — |
| `design/opening-phone-coin` (f0252dd) | Phones: the wide film band on top, the statement, the still pink coin, the passing row of pieces, Q1 promises | — |
| `design/ground-butter-fef5d9` (af4edb5) | The whole site on the butter ground #FEF5D9 | — |
| `design/opening-desktop-coin` (92eaa0a) | Computers: the film at 30% on the left, the statement, the still pink coin, the passing row of pieces, Q1 promises | — |
| `design/grey-red-x1` (a0c9bca) | Pearl-grey ground #E2E1E3, the red-satin story photos, and the X1 slot-machine opening on phones (tall see-through Meekitaz) | — |
| `design/intro-v3-pink-window` (aad7b25) | The opening V3: cream, a pink window, the drawings bursting over its top, a huge white Meekitaz watermark (phones and computers) | — |
| `design/plan-orb-floating` (ba3a2dd) | The plan as a floating white circle at the bottom-left with + and − and a panel | — |
| `design/colours-before-system-a` (a379544) | All the section colours before the one colour language: sky/mist/lavender grounds, pink builder panels, shadows between sections | — |

## How to add one
When a design is replaced, tag the last commit before the change: `git tag design/<name> <commit>^ && git push origin --tags`,
and add a line here.

- design/diamond-first-before-a (2026-11-13): starting from a diamond before A — no "next" line under Choose this diamond, rings page bar "now choose a setting", ring page said "Choose this setting · next: your diamond".
- design/rings-stone-card-before-wow-a (2026-11-14): before "A" — the white "Your diamond" card under the Engagement Rings hero, the shapes row still shown, ring-page pip as a square photo.
- design/your-ring-appointment-button (2026-11-14): Your ring panel had "Book a private appointment" under Add to bag (replaced by five stars + signature).
- design/home-open-and-fonts-before-new-language (2026-11-14): commit b8ec38f — the centred home opening and the Marcellus / Cormorant type as the default, before "A · index" and the new type became the site.
- design/home-shop-by-category-tiles (2026-11-14): commit eb84df5 — Home "Shop by category" as black-and-white poster tiles that wake in colour, before the film row.
- design/home-feed-reel-under-categories (2026-11-14): commit f0b8acf — the tall 9:16 feed reel under Shop by category on the home page (removed; component FeedReel.tsx kept).
- design/ready-to-ship-on (2026-11-14): Ready to ship switched off with RTS_ON=false in src/lib/flags.ts (home section, film tile in the rings grid, /ready-to-ship and /reel pages). Set to true to restore.
- design/bag-button-drawing (2026-11-14): commit ecc4177 — the round bag button with the bag drawing and a yellow count dot, before the word BAG with a line under it (option B).
- design/home-new-fancy-rounded-card (2026-11-14): commit 130db70 — the NEW / Fancy colors block as a rounded card with a soft shadow, the bobbing white NEW badge in the corner and three dots, before the print frame (option B).
- design/home-one-of-one-cards (2026-11-14): commit 05d4123 — Home One of One with the blue dot label, "Never again." in blue italic and the pieces as round white cards, before "A · index" (line on top, fine italic, numbered list).
- design/hero-button-jump-and-sheet (2026-11-14): commit 3e23fd5 — "Find yours at your price" glided down to Shop by category and opened the small Choose-your-plan card from the pill (K3), before the full-screen price moment (A). The pill card itself is unchanged and still opens from the pill.
- design/site-opening-day-with-her (2026-11-14): commit 0d8bb50 — the cream opening "S1 · a day with her" (huge see-through white Meekitaz, his drawings 8 AM → 11 PM), before "Less than your…" (blue, faint grid, rolling word + drawing, mono meter $50 → $01). Still plays live with ?intro=day; the first blue (W1) with ?intro=blue.
- design/site-opening-less-than-words (2026-11-14): commit a0c27ba — the blue opening with six rolling words and drawings (heels → fries) and the white mono meter, before "4 · cream, the hand and the fries". Still plays live with ?intro=words.
- design/shop-card-one-of-one-still (2026-11-14): commit 9487acb — the One of One card in Shop by category as a still (/media/home/one-of-one-scarf.webp at 50% 22%), before her film (one-film / one-film-desktop).
- trial/system-layer (2026-11-14): the "system" layer (lime signal colour, status bar, decoding mono labels, pointer dot, ticker, giant moving Meekitaz, shape signs) is a trial behind the private System switch (body.sys2) — off for everyone. To remove it entirely: delete SystemLayer.tsx, SysBits.tsx and the "system trial" block at the end of globals.css, and their four insertions (layout, page, PhoneStory, Categories).
- trial/new-new-colours (2026-11-14): "New New" — one colour language (bone #F1F0EA, stone #E4E3DB, ink #141413, lime #D9F24B) behind the private New New switch (html.nn), off for everyone. The stylesheet colours were rewritten as var(--k-HEX,#HEX) (same paint when nothing is set; checked on five pages). To drop the trial: remove the "New New" block at the end of globals.css and the switch in SystemLayer.tsx — the var() wrappers can stay.
- removed (2026-11-14): the three private switches (New language / System / New New) and the System and New New trials. The new type is simply the site now. Everything is intact at commit fcc3c1d if it is wanted again (LookSwitch.tsx is still in the repo, unmounted).
- trial/plum-colours (2026-11-14): "Plum" — a whole-site colour language (plum #3A1634, cream #FBF4EA, peach #F8D8C8, lilac #E3D6F7, apricot #FFC9A0, tangerine #F0592B) behind one small round private switch bottom-left (html.mi; PaletteSwitch.tsx), off for everyone. To drop it: remove the "Plum" block at the end of globals.css and PaletteSwitch from layout.tsx.
- trial/bold-look (2026-11-14): replaces the Plum trial. "Bold" — white + bone, ink, hot pink #E95FB4 buttons/brackets/underlines, lime #E1FF4F and sky #A9C0DC blocks, cobalt #3A3EB5; heavy condensed headlines (src/fonts/cond-800.woff2) and a wide sans (src/fonts/wide-var.woff2); rounded cards and rounded-rect pink buttons. Behind the small round private switch (html.mi), off for everyone. Plum is at commit a35e41a.
- trial/bold-look sections (2026-11-14): BoldBits.tsx adds three home sections (promise blocks, the statement across a photo, 120 days) and colours the reviews, press row and feed band — all only under html.mi.
- trial/bold-look on grey (2026-11-15): the trial page colour moved from white to "their grey" #BDBCB8 (white big headlines, lime brackets). White-page version: commit 77511c5.
- design/home-feed-dark-band (2026-11-15): commit f7533ae — the dark "Worn · reel · lightly." feed band (FeedBand.tsx, .fb styles still in globals.css), before the lime band with five reels in a row and shimmering squares (option A, .fd styles).
- design/home-feed-lime-five (2026-11-15): commit 41bdb53 — the lime feed band with five reels in a row, before option C (the reel fills the band, lime squares sweep across, words on lime tags).
- design/bag-circle-pink-count (2026-11-15): commit 7c1e6d8 — the BAG circle always pink glass with a tiny white count, before lime-when-full with a "+1" flash on add.
| (2026-11-15) before commit "Bag: checkout button always live" | Bag: with a ring size missing the checkout button was grey and disabled, reading "Select your ring size to continue" (wallet icons disabled too) | return to commit 38fd01e |
- design/footer-couture-drawings (2026-11-15): commit 1bbd07a — the footer with the Golden Couture drawings banner on cream and "Shhh." in a line above it, before the woman came back on a soft pink band with lime squares (option 6).
- design/bold-colour-switch (2026-11-15): commit 7aac499 — the round "Bold" colour switch (grey page, pink, cobalt, lime; PaletteSwitch.tsx, html.mi rules and BoldBits sections are still in the code, only the switch is unmounted), before the 0·1·2·3 section-size switch replaced it.
- design/home-sizes-before-rhythm (2026-11-15): commit 7aac499 — the home page section sizes before "Big / small" (category heading 90px on two lines, smaller category films, Fancy colors boxed at 1180px, reviews heading 54px, 100px section padding).
- design/home-size-switch-3-rhythms (2026-11-15): commit 1bde583 — the private 0·1·2·3 switch with all three trial rhythms (1 Big / small — chosen, 2 Statements, 3 Quiet).
- design/home-phone-sizes-before-rhythm (2026-11-15): commit 8779d03 — the phone sizes of the home page before the phone "Big / small" rhythm (category films 84vw at 4:5, the floating diamond full width, "Worn lightly" at 64px).
- design/home-phone-switch-3-rhythms (2026-11-15): commit 9f57220 — the private 0·1·2·3 switch with all three trial phone rhythms (1 Big / small — chosen, 2 Statements, 3 A screen each).
- design/footer-6-no-watermark (2026-11-15): commit 9b360a5 — the footer with her and the lime squares, before the soft Meekitaz watermark was added along the bottom of the band.
- design/footer-no-swallow (2026-11-15): commit caa08ee — the footer before the swallow with the pink box lands on "Shhh."; on phones "Shhh." sat a little higher (5% from the top of the band, now 13% to leave her room under the menu).
- trial/scroll-fx-switch (2026-11-15): commit before it f67f461 (67f4611) — the private "Scroll FX" on/off switch (meekitaz.com/?look=1) with three trial scroll effects: the house line filling with ink after the opening, Shop by category passing sideways while locked, and the lime-squares curtain into Fancy colors and the reviews. Off for every visitor.
- trial/scroll-fx-switch (2026-11-15): commit bdf32a4 — REJECTED and removed: the private "Scroll FX" switch with three trial scroll effects (the house line filling with ink after the opening, Shop by category passing sideways while locked, the lime-squares curtain into Fancy colors and the reviews). The code is in that commit (FxTrial.tsx, Categories.tsx).
- trial/scroll-fx-2-switch (2026-11-15): added after commit 2c57bff — the private "Scroll FX" on/off switch (meekitaz.com/?look=1), second round: home headings rising line by line with pictures moving inside their frames, and the swallow crossing the screen into Floating, One of One and the reviews (FxTrial2.tsx). Off for every visitor.
- trial/scroll-fx-2-switch: REJECTED and removed (2026-11-15); the code is in commit 45af516 (FxTrial2.tsx).
- trial/midi-scroll-switch (2026-11-15): added after commit cd5452e — the private three-way "FX" switch (meekitaz.com/?look=1): "on existing" turns the Shop by category and Fancy colors counters into lime pixel meters; "added" adds two sections (daily price counting up with a lime pixel grid and a mono strip; a giant headline the photograph rises behind) (MidiTrial.tsx). Off for every visitor.
- trial/midi-number-photo (2026-11-15): commit 21c7edd — the trial number section with the ring-hand film poster (rings-film-desktop-poster.jpg) behind it, before his own photo (woman in black, emerald-cut ring) replaced it.
- trial/midi-number-photo-black (2026-11-15): commit fd6bcfc — the trial number section with the woman in black (daily-number.jpg, still in the repo), before the dusty-rose blouse photo (daily-number-2.jpg); on phones the number sat over the photo, now it sits under it on ink.
- trial/midi-headline-photo-one (2026-11-15): commit d351034 — the trial giant-headline section with the One of One film poster behind it and the blue drawing card on phones, before the dusty-rose blouse photo (daily-number-2.jpg); the number section went back to the woman in black.
- design/home-categories-order (2026-11-15): commit de87b23 — Shop by category with Diamonds second and Bands sixth, before the two swapped places.
- design/home-category-arrow-white-circle (2026-11-15): commit 8b78de6 — the white round arrow on the Shop by category film cards (blue on hover), before the pink rounded-square arrow.
