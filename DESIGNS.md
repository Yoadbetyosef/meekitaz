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
