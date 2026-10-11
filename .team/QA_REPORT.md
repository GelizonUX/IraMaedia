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

## Round 3 (build r3 = v2 redesign, tested 2026-10-11)
Matrix:
- Root and the `/IraMaedia/` sub-path.
- Widths 320, 375, 768, 1024x600, 1024x700, 1440 and 1920.
- JS off, reduced motion, and vendor scripts aborted or hanging (`assets/vendor/*`).

New harness checks: readability per text node, preloader timeline, Lenis anchors with focus and hash, keyboard scrolling, Tab into view, a pin/overlap/overflow wheel scan, bottom bar, form v2, and perf. Raw results: `.team/qa/round3-results.json`, summary `.team/qa/sum3.txt`. Screenshots: `.team/shots/round3-*.png` (1440/375/320/768 viewport and full, every section, `-hero-mid`, `-services-mid`, `-work-pin2/50/98`, preloader 300/600/1200ms, form errors and success, bottom bar, menu, reduced, no-JS, vendor failure).

**Passed**
- **Readability.** Over 365 text nodes at 1440 and 375, the only fonts are Fraunces and Plus Jakarta Sans; Bodoni and Hanken are gone.
  - Fraunces is never below 28px. Nothing readable is below 15px. Labels are 13px with tracking of .12em or less.
  - **0 AA failures** on any surface, including the form card, the packages table, the bento and the stacking cards. The about text-fill statement is fully opaque once scrolled past.
  - Body copy reaches 6.6–13.7:1. 11 style groups are AA but not AAA (Info), e.g. the hero lead at 6.58 and mist on brand green at 5.2. Those are the spec's chosen colours.
- **Preloader.**
  - It unblocks at about 1.9s after navigation (about 1.6s after DOMContentLoaded) at 1440 and 375, on root and sub-path.
  - Click, Esc and wheel skip it in 100–480ms. It does not return on reload in the same session.
  - It never shows under reduced motion, with JS off, or with vendor scripts aborted. The skip link can be focused and works while it shows, and nothing is inert.
- **Anchors (Lenis).** All nav, CTA and skip links land with the section top at 88px (desktop) or 72px (mobile). Focus moves into the target and the hash updates. This holds at 1440, 375, sub-path and reduced motion.
- **Keyboard and focus.**
  - PageDown, Space, Arrow, End and Home all scroll.
  - Tabbing into the pinned gallery centres each of the 8 items in turn, at 1440 and 1024x700.
  - All 37 tab stops have a visible ring.
- **Pinning.**
  - The gallery pins at 1440, 1920 and 1024x700, travels through all 8 items, and unpins with no gap or cross-section overlap.
  - No pin at 1024x600, 768, 375, 320 or reduced motion: those get a contained swipe row with 8 of 8 items reachable.
  - Stacking cards are sticky at 768 and up, and the last card is never covered. Reduced motion shows a plain list.
  - **No horizontal overflow** at any width at any scroll step, including mid-gallery and the hero fan-out.
- **Mobile menu.** It stops page scrolling while open and restores it on close. Esc and link clicks close it. The bottom bar hides while it is open.
- **Bottom bar.** Hidden at load, shown after the hero CTAs, hidden on input focus and once contact is in view, and never covers footer text.
- **Form v2.**
  - Empty submit marks 3 fields `aria-invalid`, shows an error summary (`role=alert`, 3 links) and moves focus to it.
  - Chips and radios work by keyboard (Space, Arrow) and show a ✓, so state is not colour-only.
  - The "Opening your email…" loading state shows, a correct mailto is built, and focus moves to the success heading "Almost there.".
  - Package CTAs prefill "Hi Ira, I'm interested in the Signature package."
- **Fallbacks.** With vendor scripts aborted (1440 and 375): no page errors, all content visible after scrolling, anchors, form and mobile menu work, sections are solid and nothing pins. With JS off: 0 invisible elements, no preloader. Reduced motion: no Lenis, no pins, solid sections.
- **Basics.** No console errors, page errors or 404s on either base. Heading order, landmarks and links are OK, and there are no duplicate IDs or unlabeled inputs.

**Issues**
14. **[High] Package numbers stay at "0".** `initCounters()` sets `.count[data-to]` to `0` and only counts up in a ScrollTrigger `onEnter`. That never fires when you arrive by the nav "Packages" link, by an instant or programmatic jump, by a deep link, or at 375 (tested with wheel scrolling). The cards then read "Platforms 0 · Posts per month 0 · Reels 0", "Up to 0", "0+" (see `round3-1440-packages.png`, `round3-375-packages.png`). It only works when you wheel-scroll slowly at desktop.
    - Repro: load 1440, click nav "Packages", wait 3s.
    - Expected: the final values are always shown (1/12, 2/16/4/1, Up to 3/20+/8/2). Either don't zero the text until the tween actually starts, or use `ScrollTrigger.create({... onEnter, onEnterBack})` plus a check like `if (st.progress > 0 || st.isActive)` after refresh. Simplest: tween from 0 with `gsap.from` in `onEnter`, and leave the HTML value in place.
15. **[Medium] Footer nav links can't be clicked at 1440.** `svg.footer__globe` sits on top of "Services", "Process", "Packages" and "FAQ" in the footer (elementFromPoint hits the svg, and Playwright's click times out because the svg intercepts pointer events). The same happens under reduced motion.
    - Repro: scroll to the bottom at 1440 and click the footer "Services".
    - Expected: the links work. Give `.footer__globe` `pointer-events:none` (and/or `z-index` below the nav row).
16. **[Medium] Desktop deep links to lower sections land in the wrong place.** Loading `/#faq` or `/#contact` at 1440x900 parks at scrollY 13731 for both: FAQ top ends up at 350px and contact top at **1197px**, i.e. below the fold. The likely cause is that the hash scroll runs before the gallery pin-spacer (+2989px) exists. `/#packages`, `/#work` and all mobile hash loads are fine, and clicking the links works.
    - Repro: open `http://localhost:8080/#contact` at 1440x900.
    - Expected: the section lands at 88px. Run `lenis.scrollTo(hash, {immediate:true})` after the pin is created, `ScrollTrigger.refresh()` and `document.fonts.ready`, or re-apply it on the ScrollTrigger `refresh` event once.
17. **[Medium] A focused form field can be invisible.** At 375 (normal and reduced motion), tabbing onto `#f-name` when it sits near the bottom of the viewport (y≈750 of 812) focuses it while it is still at **opacity 0**, because its reveal hasn't triggered and focusing doesn't scroll. The same bottom-edge lag leaves the "Your name" label, an FAQ question, and the "@iramaedia on Instagram" link at opacity 0 just after anchor jumps to #contact or #faq.
    - Expected: anything focused, or inside the viewport, is visible. Add a `focusin` handler that force-reveals the closest `.reveal`, and/or reduce the IntersectionObserver/ScrollTrigger bottom margin so items already in the viewport reveal at once.
18. [Low] With vendor scripts that *hang* (not fail), the preloader is shown (the head script adds `motion-ok` before GSAP is confirmed) and blocks content until the CSS failsafe, about **2.9s** after navigation. That is above the 2.4s cap and the 2.5s target. Aborted vendor scripts are fine. Option: start the CSS failsafe at about 2.0s, or only show the preloader once `gsap-live` is set.
19. [Low] "Back to top" (`#top`) doesn't move focus or update the hash. Spec V2.6-6 says focus should go to the skip-link target.
20. [Low] At 1440, the last gallery panel's "See more on Instagram ↗" link is partly off-screen when focused by Tab (left 946px, width 625px, so the right edge is at about 1571px). Centre it in the pin like the work items, or let it wrap.
21. [Low] Layout-shift total is **1.96 during the desktop scroll**: two shifts of about 1.0 attributed to `DIV.work__pin` at pin start and end. I saw no visible jump in the frames. This is the usual effect of `position:fixed` pinning, but Lighthouse and the Chrome UX Report will count it. Consider `pinType:'transform'` (Lenis drives the scroll anyway) and re-measure. CLS on load is 0.014.
22. [Low] Bottom bar: with a form field centred in the viewport (contact clearly in view, before focusing), the bar is still **shown** and covers about 72px of the form. It only hides once the field has focus or `#contact` is about 50% visible. The spec says hide when ≥25% of `#contact` is visible; on a tall mobile section, use a viewport-based check rather than the section's own intersection ratio.
23. [Low] The submit loading state doesn't set `disabled` or `aria-busy`, so a double-tap can open two mailto windows.
24. [Low] Performance at 375 with 4x CPU throttling: total blocking time is 882ms on load (11 long tasks, longest 265ms, mostly GSAP setup and splitting). Desktop: 90ms. Scroll at 1440 averages about 40fps with occasional 100–200ms frames around pin refresh (headless and approximate); 1920 was worse (21% of frames over 34ms). Consider deferring non-visible ScrollTrigger setup with `requestIdleCallback`.
25. [Info] With reduced motion, below-fold sections still fade in (opacity, 200ms) when they reach the viewport (163 elements at opacity 0 before scrolling). The v2 spec allows this, and everything is visible on arrival.
26. [Info] The logo wordmark "IRAMAEDIA" (12px, .32em) is exempt by spec but isn't `aria-hidden`, so screen readers read "IMD IRAMAEDIA". This is fine. The signature "Ira" italic is allowed by spec.
27. [Info] Google Fonts (Fraunces with opsz, wght, SOFT and WONK, plus Jakarta) transfer about 590KB. Fallback fonts would only appear if Google Fonts were blocked, and they weren't in this run.
28. [Info] The copy-email button label didn't change to "Copied ✓" in headless Chromium. Clipboard permissions here are unreliable, so please verify by hand.

**Round 3 result: 1 High (14), 3 Medium (15–17), 7 Low, 4 Info → not a pass. Retest in round 4.**
Developer deviation (V2.5-J body colour swap replaced by gradient seams): this passes QA with no contrast failures and solid section backgrounds. The designer is to rule on it.

## Round 4 (build r4, tested 2026-10-11)
Same matrix as round 3: root and `/IraMaedia/`; widths 320–1920 plus 1024x600 and 1024x700; reduced motion; JS off; vendor scripts aborted or hanging. Also new: the rounded "sheet" section-edge probe, and a targeted re-check script `.team/qa/diag9.js` for #14–23. Raw results: `.team/qa/round4-results.json`, summary `.team/qa/sum4.txt`. Screenshots: `.team/shots/round4-*.png`, plus `round4-1440-work-seemore-focus.png` and `round4-375-form-centred-bar.png`.

**Re-verified**
- **#14 Packages counters: FIXED.** All 10 values (1,12 / 2,16,4,1 / Up to 3, 20+, 8, 2) are correct immediately and 3s later. Tested via nav click, instant jump, `/#packages` deep link and wheel at 1440; wheel and instant at 375; and reduced motion.
- **#15 Footer links: FIXED.** At 1440, normal and reduced motion, Services, Process, Packages and FAQ are clickable and land at 88px with the hash set. 0 focus stops are covered anywhere (round 3 had 4).
- **#16 Desktop deep links: FIXED.** At 1440, `/#faq`, `#contact`, `#process`, `#packages` and `#work` all land with the section top at 88px. At 375 they land at 72px.
  - The `hash-1440 #work ok=False` flag in the harness is a false positive: the section top is 88, but the H2 sits inside the pin intro at 3415px. The same flag appeared in round 3.
- **#17 Focus or viewport reveal: FIXED.** Anchor jumps leave 0 invisible items in view at every config (round 3 had "@iramaedia on Instagram", "Your name *" and an FAQ question). `#f-name` is no longer focused while at opacity 0. Focus problems: 0.
- **#18 Hanging vendor scripts: FIXED.** The preloader unblocks at 1675ms (was 2.9s).
- **#19 Back to top: FIXED.** Focus moves to `main#main` and scrollY is 0. The hash is cleared rather than set to `#top`, which is fine.
- **#20 "See more on Instagram" focus: FIXED.** The link sits at 671–1296 of 1440 when focused.
- **#22 Bottom bar: FIXED.** With `#f-name` centred at 375 (before focus), the bar is hidden.
- **#23 Double submit: FIXED.** `aria-busy` and `aria-disabled` are set, and a second submit returns early through the guard.

**Sheet edges (new check):** 0 problems at 320, 375, 768, 1024x600, 1024x700, 1440, 1920 and reduced motion (1440 and 375). All 7 pairs, from about→services through faq→contact, overlap by exactly the radius (40px desktop and tablet, 24px mobile). No text from the previous section sits under an edge. No section has its own text inside its curved band. z-order is OK.

**Still passing:** No console errors, page errors or 404s on either base. No overflow at any width or scroll step. Pins and stacking behave as in round 3. Keyboard scrolling works (`ok:true` on every config). The form v2 flow works, including the package prefill. JS off and vendor abort work. The preloader unblocks at about 1.85s, skips in 150–440ms, and never shows under reduced motion. Readability flags are identical to round 3, and all of them are exempt by spec: the logo wordmark at 12px/.32em, the "Ira" signature italic, and 15px secondary text as Info. The 20 contrast entries are the about text-fill words at opacity 0.18 before they are scrolled past, which is by design, as in round 3.

**Remaining**
21. [Low, open] CLS during the desktop scroll is still 2.0, from two shifts on `DIV.work__pin` at pin start and end. CLS on load is 0.015.
24. [Low, open] At 375 with 4x CPU throttling, total blocking time is 895ms on load (longest task 248ms). Desktop scroll averages about 42fps.
29. [Info] For the designer: in `round4-1440-services-mid.png`, the top of the rearmost dimmed stacking card reads as a flat grey (about #9A9F9C) rather than green. In the packages and process shots, a dark rounded corner shows at the top-right under the header, from the next sheet's corner. Both are cosmetic.

**Round 4 result: 0 High, 0 Medium, 2 Low (21, 24) → QA PASS.**
