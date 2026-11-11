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

## How to add one
When a design is replaced, tag the last commit before the change: `git tag design/<name> <commit>^ && git push origin --tags`,
and add a line here.
