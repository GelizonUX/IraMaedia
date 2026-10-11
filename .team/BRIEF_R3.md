# Round 3 brief — "cooler, more advanced UI/UX, readable fonts" (client feedback)

Client feedback, verbatim: "can you make more cooler and advance UI design and UX? also the font is not readable"

## 1. Readability (MUST fix — top priority)
Diagnosis: Bodoni Moda is a hairline Didone. Its thin strokes disappear on the green background, at small sizes and in italic
(work titles 19-20px italic, quotes, signature, numerals). The 12px tracked uppercase labels and blush-at-.86 text on green also strain the eye.
Requirements:
- Replace the display face with a sturdier, still-feminine serif with low-to-medium contrast and real stroke weight,
  e.g. Fraunces (variable, use SOFT/WONK axes sparingly), Gloock, DM Serif Display, Young Serif, or Instrument Serif ONLY at very large sizes.
  The designer picks one and justifies it. The display face is used ONLY at >= 28px. Anything smaller uses the sans.
- The body/UI sans must be highly legible (keep Hanken Grotesk, or switch to e.g. Inter Tight / Manrope / Plus Jakarta Sans / General Sans-like).
  Body >= 17-18px desktop, 16-17px mobile, line-height 1.6, measure 60-70ch, weight 400-450 on light and 400-500 on dark.
- Labels/eyebrows >= 13px, letter-spacing <= .14em, weight 600. Body text on green must be near-solid blush (alpha >= .92) or cream.
- Italic accents: one word per headline max, display size only.
- Contrast: all text WCAG AA, aim for AAA on body copy.

## 2. Cooler, more advanced UI/UX
Make it feel like an award-site (Awwwards/Godly level) while staying minimal and feminine. Pick what fits; don't do everything badly.
Candidate ideas:
- Intro/preloader: the IMD logo assembling (letters + tracked wordmark), a counter, then a curtain wipe into the hero. Under 1.8s, skippable, once per session.
- Smooth scrolling (Lenis, pinned version from jsdelivr/unpkg) + GSAP 3.12.5 + ScrollTrigger (cdnjs) for scroll-driven choreography.
- Hero: split-text headline reveal, a soft animated gradient-mesh/aurora in brand greens and blush behind it, and a 3D phone stack that
  responds to cursor (tilt) and scroll (fans out / rises).
- Scroll-driven text fill for the about statement (words go from 20% to 100% opacity as you scroll).
- Selected work as a pinned horizontal-scroll gallery on desktop (vertical/swipe on mobile), with a custom cursor that turns into a "View" pill over items.
- Services as a bento grid with hover reveals or sticky stacking cards; process as sticky stacking cards or a progress-line timeline.
- Animated number counters for outcomes, a velocity-reactive marquee, magnetic buttons, link underline draws, image-mask reveals.
- Section background color transitions on scroll (green -> blush -> cream) instead of hard cuts.
- UX: a clear sticky "Book a call" CTA (bottom bar on mobile), active nav state, scroll progress, a short "who I help" qualifier near the top,
  a packages comparison that's easy to scan, a contact form with service chips + budget selector, and visible success/error states.
- Keep everything: prefers-reduced-motion fallback (no smooth scroll, no pinning, simple fades), works with JS off, no horizontal page overflow,
  performant (transform/opacity only, no layout thrash), and relative URLs for the /IraMaedia/ sub-path.

## 3. Process (same loop as before)
designer updates DESIGN.md (v2 section at top: fonts, type scale, the chosen "cool" features with exact motion specs)
-> developer rebuilds -> qa runs the full harness + adds checks for: preloader not blocking content/forever, Lenis/ScrollTrigger
not breaking anchors/keyboard/focus, pinned section on mobile, font readability (computed sizes/weights/contrast of all text nodes, flag < 15px body or display font < 28px)
-> designer reviews screenshots -> repeat until QA PASS + DESIGN SIGN-OFF (max 4 rounds). Screenshots: round3-*, round4-* ...
Do not git commit/push.
