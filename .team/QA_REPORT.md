# QA Report — IraMaedia

## Round 1 (build r1, tested 2026-10-11)
Tested at root `http://localhost:8080/` and at the GitHub Pages sub-path `http://localhost:8081/IraMaedia/`, at 320/375/768/1024/1440/1920, with JS off and with reduced motion on. Harness: `.team/qa/qa.js`; raw results: `.team/qa/round1-results.json`. Screenshots: `.team/shots/round1-*.png`.

**Passed**
- No console errors, page errors or 4xx/5xx responses on either base. No root-absolute URLs, so the sub-path works.
- No horizontal overflow at 320, 375, 768, 1024, 1440 or 1920, including with the mobile menu open.
- All 27 `#anchor` links resolve. No empty or `#` hrefs. External links have `rel` set.
- No duplicate ids, unlabeled inputs or unnamed buttons.
- One h1, no skipped heading levels. header/nav/main/footer landmarks present. Skip link works. `lang`, title, meta description, favicon and og:image all set.
- Focus: 35 tab stops, all with a 2px outline (rose on dark, plum on light). Hidden checkbox chips show a visible ring on their label.
- Mobile menu: `aria-expanded` toggles, focus is trapped, Esc closes and returns focus to the toggle, a link click closes it and scrolls, body scroll is locked.
- FAQ and services accordions work with mouse and Enter. `aria-expanded` and the panel toggle together.
- Form: empty submit gives inline errors for the 3 required fields, focuses the first one, and shows a status message. Valid submit opens a mailto with subject and body and shows a success message.
- After scrolling through, all content ends at opacity 1 at every width. The only exception is off-screen cards in the mobile work carousel, which reveal on swipe (verified).
- Anchor jumps (#services, #contact, #faq…) reach full opacity within about 3s, and the target heading is not hidden under the header.
- With JS disabled, 0 elements are invisible. With reduced motion, everything is visible once scrolled into view, and the marquee and cursor are off.
- Layout shift 0.04 (desktop), largest paint about 1.1–1.5s. Weight: about 238KB local plus about 408KB Google Fonts, 18 requests.
- No lorem ipsum, TODO, undefined or doubled words.

**Issues**
1. **[Medium] Contrast: service numbers fail AA.** `.svc__num` (01–09 in Services) is gold #C9A96E on #2E6353 = **3.1:1** at 12px (needs 4.5).
   Repro: Services section, any row number.
   Expected ≥4.5:1. Even lighter golds don't get there (#E0C99C = 4.3), so use blush at ≥.85 alpha (4.88) or a pale champagne you verify at ≥4.5.
2. **[Medium] Contrast: eyebrows on green fail AA.** `rgba(251,236,241,.78)` on #2E6353 = **4.41:1** at 12px. Affects the hero eyebrow, "Services", "Also on the menu" and "Packages".
   Expected ≥4.5:1. Alpha .82 gives 4.67 and .85 gives 4.88.
3. **[Medium] Contrast: About value numerals.** `.num` (01/02/03 italic, About section) is #8A6D36 on #FBECF1 = **4.25:1** at 18px regular (needs 4.5).
   Expected ≥4.5:1. #7A5F2E gives 5.24.
4. **[Medium] Scrolled header looks muddy grey over light sections.** `.nav::before` is `rgba(20,48,42,.72)` plus blur. Over blush or cream sections this renders as a dull grey-green bar, and the marquee and headings ghost through it. See `shots/round1-desktop-at-about.png` and `round1-mobile-at-about.png`; compare with `round1-desktop-at-faq.png`, where it reads as clean forest green.
   Expected: a consistent forest bar over any section, e.g. alpha ≥.9 or solid `--forest-900`. Designer to confirm.
5. [Low] Phone mockup overlay text is low-contrast on some tints, e.g. "POV: your 7am class" cream on sage at about 2:1. It is decorative inside `role=img` with an aria-label, so it is optional to fix.
6. [Low] Copy voice: the "HOW WE WORK" eyebrow uses "we" while the rest of the site speaks as "I". The FAQ "Do you work with brands outside my city?" reads oddly; maybe "outside your city?" or "…in other cities?".
7. [Low] The testimonial mixes a curly decorative “ glyph with straight `"…"` quotes, and apostrophes are straight throughout. Designer has already flagged this.
8. [Low] Specific invented figures: package prices ($450/$850/$1,400), "20-minute chat", "two business days". Not banned by the brief but they are hard claims, so confirm with the client or keep them clearly editable.
9. [Low] Google Fonts transfer about 408KB. Trim unused Bodoni Moda / Hanken weights and italics if possible.
10. [Low] Reveal stagger after anchor jumps: some items in long lists (e.g. service 02, contact big links) are still at opacity 0 1.5s after landing and take about 3s to finish. Consider capping `--i` or the delay.
11. [Info] With reduced motion, reveals still wait for IntersectionObserver (200ms fade). That's acceptable. Showing everything at once would be stricter.

Note for designer: the "Skip to content" pill and the header partway down the round-1 full-page shots were **a QA harness artifact**: the screenshot was taken during the page's smooth scroll back to top. The harness is fixed and the shots have been retaken. In the live page the skip link sits at top:-71px until focused.

## Round 2 (build r2, tested 2026-10-11)
Same matrix as round 1: root and /IraMaedia/ sub-path; widths 320, 375, 768, 1024, 1440 and 1920; JS off; reduced motion. Raw results: `.team/qa/round2-results.json`. Screenshots: `.team/shots/round2-*.png`.

**Re-verified round-1 items**
- #1 FIXED: `.svc__num` and `.pkg__from` on dark are #EBD9B4. The contrast scan now finds **0 AA failures** on the whole page.
- #2 FIXED: dark-section eyebrows are rgba(251,236,241,.86), about 4.9:1.
- #3 FIXED: `.num` is #7A5F2E on blush, 5.24:1.
- #4 FIXED: the scrolled nav is a solid-reading forest bar over light sections with no ghosting (`round2-desktop-at-about.png`).
- #5 FIXED: the sage tint uses forest ink.
- #6 FIXED: "How it works" and "Do you work with brands in other cities?".
- #7 FIXED: curly quotes and apostrophes.
- #8 accepted by designer; prices stay as placeholders.
- #10 mostly fixed (see 12).
- #11 FIXED: with reduced motion, all content shows at load (0 invisible without scrolling).

**Designer items checked**
- The mobile hero eyebrow "Content creator · Manager" stays on one line at 320 and 375.
- No hero title indent on mobile: every line starts at left 20px.
- At 320 the work filter chips sit on one row and scroll inside that row (row scrollWidth 360 > 288). The page itself stays at 320 with no sideways scroll, before and after filtering.
- 1440x900: the front phone's like bar ends at y=808, above the fold.
- The contact column shows the availability chip.

**Still passing:** 0 console errors and 0 404s on both bases; no overflow at any width, including with the menu open; 0 invisible elements after scrolling at any width, and the mobile carousel is fine too. Also:
- all links and anchors resolve, the heading order is valid, and landmarks are present;
- all 35 focus stops show an outline;
- the mobile menu traps focus and closes on Esc and on link click;
- the FAQ works with mouse and keyboard;
- form validation and the mailto open correctly;
- content is visible with JS off;
- layout shift 0.01 on desktop.

**Remaining issues**
12. [Low] After a direct anchor jump (e.g. `#services`, `#contact` at 1440x900), items sitting in the bottom ~10% of the viewport (y≈813–886 of 900) stay at opacity 0 until the user scrolls a little. The likely cause is a negative bottom rootMargin or threshold on the IntersectionObserver. Optional: reveal anything already inside the viewport on load or on hashchange.
13. [Low] Google Fonts transfer is still about 408KB as measured, so the weight trimming didn't show a measurable drop. Check the css2 URL axes or subset with `&text=` for the display face.

**Round 2 result: 0 High, 0 Medium, 2 Low → QA PASS.**
