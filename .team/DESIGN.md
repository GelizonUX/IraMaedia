# IraMaedia — Design Spec v2 (round 3: "cooler, more advanced, and readable")

Owner: designer. v2 overrides v1 wherever they disagree. Anything v2 doesn't mention (logo construction, phone-mockup art, section copy not listed under §9, a11y checklist) stays as in v1 below.

Client said: *"can you make more cooler and advance UI design and UX? also the font is not readable."* So we have two jobs, in this order:
1. **Readable first.** Body text must be easy to read on her phone at night. Pretty but unreadable doesn't count.
2. **Cooler second.** Motion that feels expensive. One idea per section, each one done properly, rather than a pile of effects done badly.

Concept stays "The Green Room": deep velvet green, blush paper, confident and slow. v2 adds **depth** (3D phones, stacked cards, a pinned gallery) and **choreography** (preloader into hero, background colour changes, scroll-driven text). The surface gets *quieter* (fewer hairlines, fewer tiny labels) so the motion has room.

---

## V2.1 Fonts: Fraunces + Plus Jakarta Sans (Bodoni Moda and Hanken Grotesk are removed)

**Display: Fraunces (variable: opsz 9–144, wght, SOFT, WONK).**
- Why: Fraunces is a "soft" old-style serif. Its contrast is low to medium, and at weight 400 its thinnest strokes are still about 3× as thick as Bodoni's hairlines, so they survive on green, in italic, and on a 375px screen. Its optical-size axis thickens serifs and opens counters as text gets smaller, which is exactly where Bodoni fell apart. The `SOFT` axis rounds the terminals, which gives us "feminine" through the letterforms rather than through thinness. Its italic is warm and a little quirky (WONK), so the one accent word per headline still feels sexy.
- Why not the others: Gloock, DM Serif Display and Young Serif each come in a single weight with no optical sizing, so we'd lose control at 28–40px. Instrument Serif is too thin below about 60px, which is the same problem we already have.
- Settings: `font-optical-sizing: auto`. Roman: `font-variation-settings: "SOFT" 50, "WONK" 0`. Italic accent word: `"SOFT" 100, "WONK" 1`.
- **Rule: Fraunces only at ≥ 28px computed.** Below that, use the sans. QA enforces this.

**Text/UI: Plus Jakarta Sans (variable, 400–800).**
- Why: tall x-height, open apertures, and distinct letter shapes (a, g, l/I/1). It reads well at 15–18px on dark backgrounds. Its round geometry sits nicely next to Fraunces's soft serifs. Hanken Grotesk at 400 on green looked grey and spindly in the round 2 shots; Jakarta at 450 has more ink.
- Weights: body 400 on light, **450 on dark** (light-on-dark text looks thinner than it is). UI and nav 500. Buttons, labels and card titles 600. Logo "IMD" 800.
- Numerals: `font-variant-numeric: tabular-nums` on counters, the preloader counter and prices.

**Google Fonts URL (one request, keep the preconnects):**
```
https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..600,0..100,0..1;1,9..144,300..600,0..100,0..1&family=Plus+Jakarta+Sans:wght@400..800&display=swap
```
Fallback stacks: `"Fraunces", "Iowan Old Style", Georgia, serif` and `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif`.

## V2.2 Type scale (replaces v1 §2)

The steps are at least 1.25× apart. Sizes are clamped between 375px and 1440px.

| Token | Size (min → max) | Font / weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|
| `--fs-mega` | `clamp(3.25rem, 1.4rem + 7.9vw, 8.75rem)` (52 → 140px) | Fraunces 400 | .94 | -0.03em | Hero H1 and the contact headline |
| `--fs-d1` | `clamp(2.5rem, 1.35rem + 4.9vw, 5.5rem)` (40 → 88px) | Fraunces 400 | 1.0 | -0.025em | Section H2s |
| `--fs-d2` | `clamp(2rem, 1.4rem + 2.6vw, 3.5rem)` (32 → 56px) | Fraunces 400 | 1.12 | -0.015em | About text-fill statement, prices, service card names |
| `--fs-d3` | `clamp(1.75rem, 1.45rem + 1.3vw, 2.5rem)` (28 → 40px) | Fraunces 400 (opsz auto) | 1.2 | -0.01em | Testimonial quote, outcome lines, process numerals, signature |
| `--fs-title` | `clamp(1.25rem, 1.15rem + .45vw, 1.5rem)` (20 → 24px) | Jakarta 600 | 1.3 | -0.01em | FAQ questions, work titles, package names, step titles, "also on the menu" names |
| `--fs-lead` | `clamp(1.1875rem, 1.1rem + .4vw, 1.375rem)` (19 → 22px) | Jakarta 400 light / 450 dark | 1.55 | 0 | Hero lead, section intros |
| `--fs-body` | `clamp(1.0625rem, 1.03rem + .15vw, 1.125rem)` (17 → 18px) | Jakarta 400 light / 450 dark | 1.65 | 0 light / .005em dark | All paragraphs, FAQ answers, card text |
| `--fs-small` | `0.9375rem` (15px) | Jakarta 500 | 1.5 | .005em | Meta, client lines, form hints, footnotes. **Nothing readable goes below 15px.** |
| `--fs-label` | `0.8125rem` (13px) | Jakarta 600, UPPERCASE | 1.3 | **.12em** (max .14em) | Eyebrows, tags, chip-status. Use sparingly, at most one per section header |
| `--fs-btn` | `1rem` (16px) | Jakarta 600 | 1 | .01em | Buttons, form chips |
| `--fs-nav` | `0.9375rem` (15px) | Jakarta 500 | 1 | 0 | Nav links, sentence case |

- Measure: paragraphs `max-width: 64ch`, leads `max-width: 34ch` at desktop. Headlines use `text-wrap: balance`, paragraphs `text-wrap: pretty`.
- **Italic:** at most one word per headline, and only at display size (`--fs-d1` or larger, or the signature). No italic in body, quotes, titles or work captions.
- Exempt from the scan (decorative, `aria-hidden="true"`): text inside `.phone__screen` mockups, the footer giant wordmark, and the tracked "IRAMAEDIA" in the logo lockup (logo: 12px Jakarta 600, .32em; it's a logo, not a label).
- Removed: all 11–12px tracked caps, the `.32em` tracking, Bodoni numerals in Process and pricing (now Fraunces `--fs-d3`/`--fs-d2`), and the italic work titles (now Jakarta 600 `--fs-title`).

## V2.3 Colour: text on green (amends v1 §1)

Measured contrast:

| Text colour | on brand green #2E6353 | on forest-800 #1E4237 | on forest-900 #14302A |
|---|---|---|---|
| `--petal` **#FFF7F9** (new) | 6.6 AA | 10.5 AAA | 13.4 AAA |
| `--blush-50` #FBECF1 | 6.1 AA | 9.7 AAA | 12.4 AAA |
| `--mist` **#D5E2DD** (new, muted text on dark) | 5.2 AA | 8.3 AAA | 10.6 AAA |
| `--rose-200` **#F2C9D6** (new, accent on brand green) | 4.7 AA (large only) | 7.5 | 9.5 |
| `--rose-300` #E8B4C4 | 3.9 (display ≥ 40px only) | 6.2 | 7.9 |
| `--champagne-200` #EBD9B4 | 5.0 | 8.0 | 10.2 |
| `--sage-300` #98B2AB | 3.1 **not for text** | 4.9 | 6.3 |

Rules:
1. **Text on brand green #2E6353** uses `--petal` #FFF7F9 at **alpha 1** for headlines, body and nav. No alpha below 1 for anything readable (the brief allows .92, but we don't need it). Muted text uses `--mist`, never sage, and never blush at .8 or .86.
2. **Long-form copy prefers the deeper greens.** Service cards, packages cards, contact form and footer sit on forest-800/900, where petal is AAA. Brand green #2E6353 stays the hero, section and drenched surface (brand-correct) and carries headlines, leads and short paragraphs (AA 6.6).
3. Accent italic word: `--rose-200` on brand green, `--rose-300` on forest-800/900, `--berry-700` #7A3A52 on blush or cream.
4. **On light:** body `--ink-900` #1A2622 (13.7), muted `--ink-700` **#3D4C47** (new, 7.9 AAA, replaces ink-600 for text). Small gold text on light stays `#7A5F2E`.
5. Sage #98B2AB is for strokes, globe art and hairlines only.
6. Lines: `--line-on-dark: rgba(213,226,221,.22)`, `--line-on-light: rgba(46,99,83,.20)`.

Surface map (also the background-transition sequence, see V2.5-J):

| # | Section | Surface | Text |
|---|---|---|---|
| 1 | Hero + qualifier band | `#2E6353` + aurora | petal / mist |
| 2 | Marquee | `#FBECF1` blush | green-700 |
| 3 | About + text-fill statement | `#FBECF1` blush | ink |
| 4 | Services (stacking cards) | `#1E4237` forest-800 | petal |
| 5 | Work (pinned gallery) | `#14302A` forest-900 | petal |
| 6 | Process | `#F7F1EA` cream | ink |
| 7 | Results + kind words | `#FBECF1` blush | ink |
| 8 | Packages | `#2E6353` brand green | petal |
| 9 | FAQ | `#F7F1EA` cream | ink |
| 10 | Contact | `#2E6353` + aurora (reprise) | petal |
| 11 | Footer | `#14302A` | petal / mist |

---

## V2.4 Libraries and motion tokens

Load at the end of `<body>`, deferred, pinned versions:
- `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`
- `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js`
- `https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js` (plus the Lenis CSS rules inlined into style.css: `html.lenis, html.lenis body {height:auto} .lenis.lenis-smooth {scroll-behavior:auto !important} .lenis.lenis-stopped {overflow:hidden}`)

**Progressive enhancement contract:** the page renders fully and readably with no JS, or when a CDN fails. Everything animated must default to its *final* state in CSS. Hidden "before" states apply only under `html.js.motion-ok`. JS adds `motion-ok` only if `matchMedia('(prefers-reduced-motion: no-preference)')` matches **and** `window.gsap` loaded. If GSAP is missing, the site falls back to the existing vanilla IntersectionObserver reveals.

Easing tokens (CSS and GSAP equivalents):
```
--ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);     /* GSAP "expo.out"    : entrances, reveals, word masks */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);     /* GSAP "power3.out"  : hovers, small UI, bottom bar */
--ease-in-out:    cubic-bezier(0.87, 0, 0.13, 1);    /* GSAP "expo.inOut"  : curtain wipe, big on-screen moves */
--ease-soft:      cubic-bezier(0.65, 0, 0.35, 1);    /* GSAP "power2.inOut": background colour, accordion */
--d-press: 140ms; --d-ui: 240ms; --d-base: 400ms; --d-reveal: 900ms; --d-hero: 1100ms;
```
No bounce or elastic anywhere. Animate only `transform`, `opacity` and `clip-path`, plus the body `background-color` for V2.5-J. `will-change` only while animating.

---

## V2.5 The "cool, advanced" features (chosen set, with exact specs)

### A. Preloader: "IMD assembles, then the curtain lifts"
- Markup: `<div class="preloader" aria-hidden="true">` at the top of `<body>`. CSS default `display:none`; it shows only under `html.js.motion-ok:not(.intro-seen)`. A CSS fail-safe on `.preloader` (`animation: pl-failsafe 0s linear 2.6s forwards` → `visibility:hidden; pointer-events:none`) hides it even if JS dies. Content behind it is never `inert`, and the skip link stays reachable.
- Look: forest-900 full screen. Centre: "IMD" in Jakarta 800, `clamp(4.5rem, 14vw, 9rem)`, petal. Below it, "IRAMAEDIA" in Jakarta 600, 13px, .32em, mist. Behind them, the globe SVG at 40vmin, sage stroke, opacity .25. Bottom-right: counter `000`→`100`, Jakarta 600 15px tabular, mist. Bottom-left: `Content with intention`, 15px, mist.
- Timeline (t = 0 at DOMContentLoaded):
  - 0ms: globe opacity 0→.25, scale .92→1, 900ms expo.out.
  - 80ms: I, M, D each rise from a mask (`yPercent 110→0`), 700ms expo.out, stagger 90ms.
  - 420ms: wordmark letters opacity 0→1 and `y 8→0`, 500ms power3.out, stagger 22ms.
  - 0–1150ms: counter tweens 0→100 (power2.inOut). It holds at 99 until `document.fonts.ready` resolves or 1150ms passes, whichever is later.
  - ~1200ms: curtain. The preloader animates `clip-path: inset(0 0 0 0)` → `inset(0 0 100% 0)`, **750ms expo.inOut**. At the same time the logo group moves `y 0 → -40px` and opacity →0 over 400ms.
  - 1350ms: hero sequence starts (V2.5-C), overlapping the curtain.
  - Done by about **1.8s**. **Hard cap 2.4s**: at that point JS kills the timeline and removes the preloader no matter what.
- Skippable: any click, keydown, wheel or touchstart sends the timeline straight to the curtain at 2× speed.
- Once per session: `sessionStorage.setItem('imd-intro','1')` (wrapped in try/catch). On a repeat visit, add `html.intro-seen` in the inline head script so there's no flash, and the hero sequence plays immediately.
- Reduced motion: no preloader at all.
- During the preloader `lenis.stop()` runs; `lenis.start()` runs when the curtain finishes. Native scrolling is never blocked by `overflow:hidden` on body; we only stop Lenis.

### B. Smooth scroll (Lenis) + GSAP ScrollTrigger
- `new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, wheelMultiplier: 1 })`. Touch scrolling stays native.
- Hook it up: `lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t*1000)); gsap.ticker.lagSmoothing(0);`
- **Anchors:** intercept `a[href^="#"]` (except `#` alone). Call `lenis.scrollTo(target, { offset: -88 /* -72 on mobile */, duration: 1.2, easing: t => 1 - Math.pow(1 - t, 4) })`. On complete: `history.pushState(null,'','#id')`, then `target.setAttribute('tabindex','-1')` (if it isn't focusable) and `target.focus({preventScroll:true})`. The skip link goes to `#main` the same way. When the page loads with a hash: run `lenis.scrollTo(hash, {immediate:true})` after `ScrollTrigger.refresh()`.
- Targets inside the pinned gallery or stacking cards resolve to the **section start**.
- Keyboard: arrows, PageUp/PageDown, Space and Home/End must keep working. Lenis listens to native scroll, so don't call `preventDefault` on keys. Tab focus into off-screen elements must scroll them into view (native behaviour, then Lenis resyncs; verify).
- Mobile menu open: `lenis.stop()`; on close `lenis.start()`.
- Off entirely under reduced motion (native scroll + `scroll-behavior: auto`).

### C. Hero: word-mask headline, aurora mesh, 3D phone stack
**Layout desktop (≥1024):** a 12-col grid. The headline sits on cols 1–8, three lines (copy unchanged). The lead and CTAs sit under it on cols 1–5. The phone stack sits on cols 8–12, vertically centred against the headline and lead, overlapping the headline's right edge by up to one column (phones sit *behind* the headline: z-index lower). **Mobile:** headline, lead, CTAs, then a 2-phone mini stack (280px tall) below the fold. The headline must fit 3–4 lines at 375px with no word broken.

**Headline split:** split by **word** (not by character; it keeps kerning and stays screen-reader friendly). Each word is `<span class="w"><span>word</span></span>`; the outer span has `overflow:hidden; padding-bottom:.08em; margin-bottom:-.08em` so descenders aren't clipped. The inner span animates `yPercent 105→0, rotate 3deg→0` (origin left bottom), **1100ms expo.out, stagger 70ms**. "stop" (italic, rose-200) is last, then its hand-drawn underline draws (`stroke-dashoffset 1→0`, 800ms power2.inOut, +150ms). The eyebrow, lead, chip-status and CTAs follow from +500ms: opacity 0→1, `y 20→0`, 800ms expo.out, stagger 70ms. The nav fades in at +200ms (600ms).

**Aurora mesh** (replaces the single glow, sits behind everything in the hero, `aria-hidden`):
- Three absolutely positioned discs, each `width: 70vmax; aspect-ratio: 1; border-radius: 50%`, filled with `radial-gradient(closest-side, COLOR, transparent 70%)`, `mix-blend-mode: normal`. Colours: `#467E5C` at α .9 (top-right), `#E8B4C4` at α .28 (bottom-left), `#98B2AB` at α .35 (centre-right). **No CSS `filter: blur`** (it's expensive); the gradient falloff is the blur.
- Drift: CSS keyframes animating `transform: translate3d() scale()` along 3 waypoints, `alternate infinite`, durations 22s / 28s / 34s, `ease-in-out`, with different delays. Max travel 12vmax.
- `animation-play-state: paused` when the hero is off-screen or `document.hidden`.
- The grain overlay from v1 stays (opacity .06).
- Reduced motion: discs static at their first waypoint.
- The globe SVG stays but drops to opacity .10 and is centred behind the phones.

**3D phone stack:**
- The wrapper has `perspective: 1600px`; the inner `.stack` has `transform-style: preserve-3d` and base `rotateY(-14deg) rotateX(6deg)`.
- Three phones: back-left `translate3d(-22%, 4%, -160px) rotateZ(-7deg)`, back-right `translate3d(22%, 8%, -110px) rotateZ(6deg)`, front `translate3d(0,0,0)`. Shadow on the front phone only: `0 50px 90px -30px rgba(10,28,23,.6)`.
- **Entrance** (with the headline, +300ms): each phone from `y +80px, rotateX 20deg, opacity 0` to rest, 1400ms expo.out, stagger 120ms (back phones first).
- **Cursor tilt** (fine pointer, hero in view): pointer position normalised to -1..1 sets the targets `rotateY = -14deg + nx*8deg` and `rotateX = 6deg - ny*6deg`. Ease toward the target each frame with `gsap.quickTo(stack, 'rotationY', {duration: .9, ease: 'power3.out'})` (spring-like, interruptible). Phones also parallax on z: the front one shifts `nx*10px`, the back ones `nx*-6px`. On pointerleave, return to base over 1.2s.
- **Scroll fan-out** (ScrollTrigger, trigger hero, `start: 'top top'`, `end: 'bottom top'`, `scrub: 0.6`): the left phone goes to `x -38%, rotateZ -12deg`, the right to `x 38%, rotateZ 11deg`, the front to `y -14%, scale 1.04`, and the whole stack to `y -8vh`. The headline words drift `y -6vh` at 0.5× (subtle depth). At 1024–1279 use 70% of these values; on mobile use 50%, with no tilt.
- Phone screens keep the v1 CSS art. The front reel's 2px progress bar loops 6s linear.
- Reduced motion: static fanned layout, no tilt and no scroll transforms.

### D. Qualifier band "Who I help" (new, bottom of the hero, same green surface)
A full-width band at the bottom of the hero, separated by a top hairline, padding 32px block.
- Left: label `WHO I HELP`.
- Middle (`--fs-lead`, petal): `Small brands with good taste and no time to post.`
- Right: an inline list of 6 **non-interactive** tags (1px `--line-on-dark` pill, 15px Jakarta 500, mist text): `Cafés & restaurants` `Boutiques` `Salons & beauty` `Wellness studios` `Coaches` `Makers & e-commerce`.
- Mobile: stacked; the tags wrap (no horizontal scroll).
- The tags reveal with stagger 40ms, opacity and `y 10→0`, 600ms expo.out, at `top 90%`.

### E. Velocity-reactive marquee (amends v1 §5.3)
- One row only now (cleaner): Fraunces 400 at `--fs-d2`, green-700 on blush, gold `✦` separators at 0.5em. Row 2 (tiny caps) is **removed**.
- Driven by `gsap.ticker`: `x -= (base + boost) * dt`, wrapped with `gsap.utils.wrap(-groupWidth, 0)`. Base 60px/s. `boost = clamp(0, 600, |lenis.velocity| * 18)`, eased back to 0 with `gsap.quickTo` over .6s. Direction follows the scroll direction: scrolling up reverses it, and it keeps the last direction when idle.
- The words between stars get a hover lift only (no pause needed). Keep `aria-hidden` on the duplicate group.
- Paused when off-screen. Reduced motion: static, centred, wraps over two lines, no duplicates.

### F. About: arch mask reveal + **scroll-driven text fill**
- Keep the arch portrait and rotating badge. Arch reveal: `clip-path: inset(100% 0 0 0 round 999px 999px 24px 24px)` → `inset(0 ...)`, 1300ms expo.inOut at `top 80%`, while the inner content scales 1.15→1 at the same time.
- Headline (one italic word): `Your brand, but a little more` *`lovely.`*
- **New text-fill statement**: full width, below the about grid, Fraunces `--fs-d2`, ink-900 on blush, max-width 22ch per line (`text-wrap: balance`), block padding 15vh:
  > `Pretty is the baseline. Every post I make has a job: stop the scroll, start the conversation, and bring the right people to your door.`
- Split it into words. ScrollTrigger: `trigger: statement, start: 'top 75%', end: 'bottom 40%', scrub: true`. Each word's **colour** tweens from `rgba(26,38,34,.18)` to `#1A2622` (use opacity on the word spans, `.18→1`, stagger evenly across the scrub). The words "job" and "door" end in berry-700.
- Final state is fully opaque. Reduced motion or no JS: fully opaque from the start. (**QA: scan this element after scrolling past it, or treat the in-progress state as exempt.**)

### G. Services: **sticky stacking cards** (replaces the index list for the 4 core services)
- Section header (forest-800 surface): label `SERVICES`, H2 `Everything your feed` *`needs.`*, lead `Hire me for the full package or just the piece you're missing. Most clients start with management and add the rest as they grow.`
- 4 cards in an `<ol>`. Each card is full container width, `min-height: min(72vh, 620px)`, radius 32px, padding `clamp(28px, 4vw, 56px)`. Inside is a 2-col layout: left has the number (`01`, Fraunces `--fs-d3`, champagne), name (Fraunces `--fs-d2`), description (`--fs-body`, ≤ 44ch) and the "What's included" list (tags 15px, always visible, no accordion); right has a small CSS-art visual (reuse a phone, or a 3×3 grid tile for Strategy, at 260px).
- Card surfaces alternate for rhythm: 1 **blush** #FBECF1 (ink text, berry accents), 2 **brand green** #2E6353 (petal), 3 **rose** #F2C9D6 (ink text, contrast 12:1), 4 **cream** #F7F1EA (ink). On the forest-800 section, the light cards glow.
- **Stacking (≥ 768px, motion-ok):** each card `position: sticky; top: calc(96px + var(--i) * 20px)`. The `<ol>` has a gap of `12vh`. For card *i* (not the last): ScrollTrigger `trigger: card[i+1], start: 'top bottom', end: 'top top+=' + (96 + (i+1)*20), scrub: true` tweens card *i* to `scale: 1 - (n-1-i)*0.04` (origin top centre) and an `::after` overlay (forest-900) from opacity 0→.35. Only transform and opacity animate.
- **< 768px or reduced motion:** a normal stacked list with a 16px gap, no sticky, no scaling. Cards reveal with opacity and `y 24→0`.
- "Also on the menu" (5 other services) sits below as a **2×3 bento** on desktop (the first item spans 2 rows, giving varied sizes, not identical cards): each cell is 1px line, radius 24, a Jakarta 600 `--fs-title` name plus a 15px mist description. The last cell is the CTA cell: `Not sure what you need?` + `Book a free call →` (blush pill). Mobile: a single column.
- Hover (fine pointer): the cell background goes to `rgba(255,247,249,.04)` and the arrow moves `x 4px`, 240ms power3.out.

### H. Selected work: **pinned horizontal gallery** + "View" cursor
- Filter chips are **removed** (8 items don't need filtering, and they fight the pin).
- **Desktop (≥ 1024px wide, ≥ 680px tall, motion-ok):** the section pins (`pin: true, start: 'top top', end: () => '+=' + distance, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true`), where `distance = track.scrollWidth - innerWidth + gutter`. The track translates on x.
  - Panel 0 (intro, 36vw): label `SELECTED WORK`, H2 `A peek at the` *`grid.`*, lead, then `Scroll to browse` with a 40px line that grows.
  - Then 8 work items, each 300px wide phone (9:16) plus a caption below: tag label (rose-300 on forest-900) and title (Jakarta 600 `--fs-title`, petal), then the client line (15px mist). Gap 6vw. Items alternate `y` offset 0 / 64px.
  - Inside each phone, the screen art parallaxes against the track: `x` from 8% to -8% using `containerAnimation`.
  - Progress: a 2px line plus a `01 / 08` counter (15px tabular, mist), bottom-left, scrubbed.
  - Last panel: `See more on Instagram ↗` as a big Fraunces `--fs-d2` link.
  - **Keyboard:** each item is focusable (`tabindex="0"`, `role="img"` with aria-label as in v1, or wrap in the IG link). On `focusin`, scroll the window so the item is centred: `lenis.scrollTo(st.start + (item.offsetLeft - innerWidth/2 + item.offsetWidth/2) / (track.scrollWidth - innerWidth) * (st.end - st.start), {duration: .6})`.
- **Mobile, tablet, short viewports, reduced motion:** no pin. A native horizontal scroll-snap row inside the container (`overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain`), items 74vw (max 300px), with the next item peeking, and a progress bar under it. The row scrolls, never the page (`body` keeps `overflow-x: clip`).
- **Custom cursor** (fine pointer, motion-ok only, native cursor stays visible):
  - Default: 10px petal dot, `mix-blend-mode: normal`, following the pointer with `gsap.quickTo(x/y, {duration: .35, ease: 'power3.out'})`.
  - Over links and buttons: a 40px ring with a 1px petal border and transparent fill, `scale` 240ms power3.out.
  - Over `.work__item`: an 88px blush disc with `View` (Jakarta 600 15px, forest-900) inside, scale .6→1 and opacity, 300ms expo.out. On light sections the dot uses green-700.
  - Hidden on touch, under reduced motion, and while the pointer is outside the window.

### I. Process: scroll-scrubbed progress line
- Cream surface. Label `HOW IT WORKS`, H2 `Simple, from` *`hello`* `to posted.`
- Desktop: 4 steps in a row with a 1px gold line across their tops. A second line (2px, green-700) scales on `scaleX 0→1`, scrubbed (`start: 'top 70%', end: 'bottom 60%'`). Each step's 12px dot fills (border → solid green-700, scale 1→1.25) when the line passes its x (callbacks at 0, .33, .66, 1), 300ms power3.out. **Step text is always full contrast**; only the dot and numeral colour change.
- Numerals: Fraunces `--fs-d3` (28–40px) in gold `#7A5F2E`. Titles: Jakarta 600 `--fs-title`. Body: `--fs-body`, ink-700.
- Mobile: vertical, with the line on the left scrubbing `scaleY`.
- Reduced motion: line fully drawn, dots filled.

### J. Background colour transitions between sections
> **Round 3 review ruling (final):** gradient seams rejected (green↔cream mixes read as grey bands). Sections keep solid backgrounds, and each section after the hero (except the marquee and footer) is a rounded "sheet" (`border-radius: 40px 40px 0 0`, 24px below 768, `margin-top: -40px/-24px`, increasing z-index) laid over the previous one. Footer: straight edge with a hairline.
> *Earlier round 3 ruling, superseded:* each section keeps its own solid background. A static 64–112px gradient seam, blending from the previous section's colour, sits inside the top padding of each section and never runs under text. `html[data-theme]` still flips per section (for the nav and cursor). Reason: with a single body colour, text sat on the wrong surface during transitions, and readability is the client's #1 complaint.
- With motion-ok, sections that take part get `background: transparent` (class `.bgfx` on html), and `body` carries the colour.
- One ScrollTrigger per section (`start: 'top 55%'`, `end: 'bottom 55%'`). On `onEnter`/`onEnterBack`: `gsap.to(body, {backgroundColor: section.dataset.bg, duration: .8, ease: 'power2.inOut', overwrite: true})`, and set `html[data-theme]` to `dark` or `light` (used by the nav, cursor and bottom bar).
- Each section still sets its own text colour, so at rest the contrast is exactly as in the V2.3 surface map.
- Without JS or with reduced motion, the sections keep their own solid backgrounds (hard cuts, still fine).
- The aurora (hero, contact) and the stacking cards keep their own backgrounds.

### K. Counters (packages only; no invented results)
- The numbers in the package comparison (posts per month 12 / 16 / 20, Reels 0 / 4 / 8, shoots 0 / 1 / 2) count up from 0 to their value once, 1200ms power2.out, at `top 80%`. Prices do **not** count (counting money feels gimmicky).
- The HTML contains the final numbers (no-JS and reduced motion show them as is). Use `tabular-nums` so the width doesn't jitter.

### L. Micro-interactions (keep from v1, retimed)
- Magnetic CTAs: max 10px, label 1.3×, return 600ms expo.out. Fine pointer only.
- Buttons: `:active` scale .97, 140ms. Arrow icon `x 4px` on hover, 240ms power3.out.
- Links: the underline draws from left (`scaleX 0→1`, origin left, 400ms expo.out); on leave it exits to the right (origin right).
- Section H2 reveals: the same word mask as the hero (`yPercent 105→0`), 900ms expo.out, stagger 50ms, at `top 85%`.
- Generic `.reveal`: opacity 0→1, `y 24→0`, 900ms expo.out, stagger 60ms (cap 300ms), once. **No blur** (perf and readability).
- Scroll progress: a 2px rose-300 line at the top, `scaleX` scrubbed.

### Reduced motion: summary
`prefers-reduced-motion: reduce` means: no preloader, no Lenis, no pins, no sticky stacking, no tilt or fan, no marquee motion, no aurora drift, no custom cursor, no magnetic effect, no counters (final values). Reveals become opacity only, 200ms. Background colour changes become hard section backgrounds. Hover colour feedback stays.

---

## V2.6 UX improvements

1. **Nav:** height 72px. Links (15px Jakarta 500, petal) get an **active state** via ScrollTrigger: `aria-current="true"` plus a 4px rose dot under the link and a 1px underline drawn in. Scrolled state: `rgba(20,48,42,.92)` + hairline (blur 12px stays; it's the one allowed). Over light sections the nav stays dark (consistent). "Book a call" pill stays visible on desktop at all times.
2. **Mobile bottom bar (< 768px):** fixed, `inset-inline: 12px; bottom: calc(12px + env(safe-area-inset-bottom))`, height 60px, radius 999px, bg `rgba(20,48,42,.96)`, 1px line, shadow `0 20px 40px -20px rgba(0,0,0,.5)`. Inside: a primary blush pill `Book a free call` (flex 1, 48px tall, forest text) and a 48px round button with the Instagram glyph (`aria-label="Message me on Instagram"`, opens IG in a new tab).
   - **Shows** once the hero CTAs leave the viewport: `translateY(140%)→0`, 500ms expo.out.
   - **Hides** when `#contact` is ≥ 25% visible, when the mobile menu is open, or when a form field has focus (the keyboard is up): `translateY(140%)`, 250ms power3.out.
   - Add `padding-bottom: 96px` to the footer on mobile so the bar never covers content. Under reduced motion it shows or hides without moving.
   - Hide the nav's hamburger-adjacent CTA on mobile (the bottom bar replaces it).
3. **Qualifier** (V2.5-D), right after the hero, so visitors self-select within the first scroll.
4. **Packages = scannable comparison.** Three cards, same structure, rows **aligned across cards** (use CSS subgrid `grid-template-rows: subgrid` on desktop so labels line up):
   - Rows: `Best for` · `Platforms` · `Posts per month` · `Reels` · `Content shoots` · `Community care` · `Strategy & reporting`.
   - Starter: brands ready to show up consistently · 1 · 12 · `Not included` · `Not included` · `Not included` · Monthly check-in. (Render "Not included" as text in mist or ink-700, never as a dash.)
   - Signature (featured, blush card, `MOST LOVED` pill): brands that want to grow, not just post · 2 · 16 · 4 · 1 per month · Included · Monthly report + strategy.
   - Full Feed: your whole social presence, handled · Up to 3 · 20+ · 8 · 2 per month · Daily · Quarterly strategy session.
   - Each row: label 15px mist (or ink-700 on blush) on the left, value Jakarta 600 `--fs-body` on the right, hairline between rows. Included or not: use the text `Included` / `Not included`, never colour alone.
   - Price: Fraunces `--fs-d2`, `From` and `/month` at 15px. The CTA sits at the bottom of each card, aligned.
   - Mobile: cards stack, with **Signature first** (CSS `order`). The row labels repeat in each card.
   - Under the cards: `Need a one-off? Strategy sessions, Reels packs and shoot days are available too.` + link `Ask about it`.
   - Package CTAs pre-select that package in the form's "What do you need?" message (prefill the textarea with `Hi Ira, I'm interested in the Signature package.` unless the user has already typed something) and scroll to the form.
5. **Contact form v2** (on forest-800 card, radius 32, padding 40/32, inside the green contact section):
   - Fields: Name*, Email*, Brand or Instagram handle, **What do you need?** (multi-select chips: real checkboxes styled as pills: `Management` `Content creation` `Reels` `Strategy` `Design` `Not sure yet`), **Monthly budget** (single-select radio pills: `Under $500` `$500 to $1,000` `$1,000 to $2,000` `$2,000+` `Not sure yet`), Message* (`Tell me about your brand`).
   - Inputs: 56px tall, filled `rgba(255,247,249,.06)`, 1px `--line-on-dark` border, radius 14, petal text 17px. Labels sit above, 15px Jakarta 600 petal (**not** tracked caps). Hints 15px mist. Focus: border rose-300 plus a 3px ring `rgba(232,180,196,.45)`. Chips: 44px tall, 1px line, mist text; checked: blush background, forest text, with a ✓ prefix (so state doesn't rely on colour alone), 200ms.
   - Validation on submit and then on blur: inline error under the field (15px, rose-200, with a small ⚠ icon) plus `aria-invalid`. An **error summary** at the top (`role="alert"`, rose-200 border, links to each field), and focus moves to it.
   - Submit: full-width blush pill, 56px, `Send my enquiry`. On click it shows a loading state (`Opening your email…` + spinner, 600ms), then composes the `mailto:` with all fields.
   - **Success state:** the form swaps (crossfade 400ms) for a panel with a rose-200 check disc, H3 (Fraunces `--fs-d3`) `Almost there.`, text `Your email app should have opened with everything filled in. Hit send and I'll reply within two business days.`, plus a secondary button `Copy my email instead` (copies to clipboard, label changes to `Copied ✓` for 2s, `aria-live`) and a text link `Edit my message`. Focus moves to the success heading.
6. **Back to top** in the footer uses Lenis. Focus goes to the skip link target.
7. **Hit targets** ≥ 44px everywhere. Tags that are not interactive must not look like buttons (no hover).

---

## V2.7 Copy changes (only the changes; everything else as in v1)

| Where | v2 copy |
|---|---|
| Hero eyebrow | `SOCIAL MEDIA CONTENT CREATOR & MANAGER` (mobile: `CONTENT CREATOR & MANAGER`) |
| Hero H1 | unchanged: `Content that / makes them` *`stop`* `/ scrolling.` |
| Hero lead | `I'm Ira. I plan, shoot, edit and post content that makes your brand look as good online as it feels in person.` |
| Chip status | `Booking new clients now` |
| Hero CTAs | `Book a free discovery call` · `See the work` |
| Qualifier | label `WHO I HELP` · `Small brands with good taste and no time to post.` + 6 tags (V2.5-D) |
| Marquee | single row, as v1 row 1 |
| About H2 | `Your brand, but a little more` *`lovely.`* |
| About body | keep the two v1 paragraphs |
| About values | keep 01–03, rendered in Jakarta: number (15px 600, gold-ink) + bold lead-in + text, `--fs-body` |
| Text-fill statement | `Pretty is the baseline. Every post I make has a job: stop the scroll, start the conversation, and bring the right people to your door.` |
| Services H2 | `Everything your feed` *`needs.`* |
| Services bento CTA cell | `Not sure what you need?` · `Book a free call` |
| Work | label `SELECTED WORK`, H2 `A peek at the` *`grid.`*, lead `A few examples of the kind of content I make. Real client work is shared on request, and the newest is always on Instagram.`, hint `Scroll to browse` (desktop) / `Swipe to browse` (mobile) |
| Process | label `HOW IT WORKS` (rest unchanged) |
| Results H2 | `Consistent feeds. Real` *`conversations.`* (drop "Less stress." to keep it short) |
| Outcomes | same 3 lines, Fraunces roman `--fs-d3`, not italic |
| Testimonials | same placeholders, Fraunces roman `--fs-d3`, attribution Jakarta 600 17px + 15px mist |
| Packages | H2 `Pick your` *`pace.`*, lead `Monthly packages, no long contracts. Every package can be tailored.` |
| Package CTAs | Starter `Start with Starter` · Signature `Book a call about Signature` · Full Feed `Talk about Full Feed` (descriptive for screen readers too) |
| FAQ | H2 `Before you` *`ask.`*; questions in Jakarta 600 `--fs-title` |
| Contact H2 | `Let's make your feed` *`unforgettable.`* |
| Contact lead | `Tell me a little about your brand and what you need. I reply within two business days, usually sooner.` |
| Submit | `Send my enquiry` |
| Mobile bar | `Book a free call` |

No em dashes anywhere. Curly quotes and apostrophes.

---

## V2.8 Performance and QA guardrails
- The page must be readable and complete with JS off, with the CDN blocked, and under reduced motion.
- The preloader can never block content for more than 2.4s, and never on reduced motion or a repeat visit in the same session.
- No horizontal page overflow at 320, 375, 768, 1024 or 1440px, including during the pinned gallery and the fan-out.
- Pinning only happens at ≥ 1024×680 and with motion-ok. On mobile the gallery is a contained swipe row.
- Anchor links land with the section heading visible below the nav (offset 88/72px), focus moves to the target, and URL hash updates.
- Every text node outside the exemptions: ≥ 15px, Fraunces only at ≥ 28px, label tracking ≤ .14em, contrast ≥ 4.5:1 (≥ 3:1 for ≥ 24px or bold ≥ 18.66px), body copy aims for ≥ 7:1.
- `ScrollTrigger.refresh()` after fonts load (`document.fonts.ready`) and after the preloader is removed.

---


# ===== HISTORY: v1 spec (superseded where v2 differs) =====

# IraMaedia — Design Spec (v1)

Owner: designer. Build-ready. If something here is ambiguous, pick the more restrained option and note it in LOG.md.

Research note: a web search for "iramaedia" returned nothing about her (only unrelated "iMedia"/"Irama" results). Everything below is derived from the brief + logo. No stats, client names or testimonials are real; all such copy is marked as placeholder and lives in one editable `content` area.

---

## 0. Concept: "The Green Room"

Scene sentence (decides theme): *A boutique owner, coach or café founder scrolling on her phone at night on the couch, half-ready to hand her Instagram to someone, deciding in 30 seconds whether this person has taste.*

That forces: **phone-first**, **mostly dark-green surfaces (drenched)** that feel like velvet at night, with **blush and cream "paper" sections** as breathing room. Editorial magazine layout, oversized italic serif, tiny tracked caps (echoing the logo's IRAMAEDIA lockup). Sexy = restraint + contrast + slow confident motion, not glitter.

Color strategy: **Committed / Drenched.** Brand green carries ~55% of the page surface. Blush carries ~30%. Rose and gold are accents only (<8% combined).

Anti-references (do NOT): pastel-everything "girlboss" Canva template, gradient text, glassmorphism cards, purple-blue gradients, emoji bullets, identical icon-card grids, stock 3-stat hero bar, script/cursive fonts, rose-gold foil.

---

## 1. Color tokens

Define in `:root` (hex shown; OKLCH equivalents optional). Never pure `#000`/`#fff`.

| Token | Hex | Role |
|---|---|---|
| `--forest-900` | `#14302A` | Deepest bg (footer, overlays, phone bezels) |
| `--forest-800` | `#1E4237` | Section bg (dark alt), card on green |
| `--green-700` | `#2E6353` | **Brand green.** Hero, main dark surfaces, primary button on light |
| `--green-500` | `#467E5C` | Secondary green: hover states, globe art, tags on light |
| `--sage-300` | `#98B2AB` | Muted text on green, hairlines on green, globe edges |
| `--sage-100` | `#DCE6E2` | Very light sage tint (pricing alt card bg) |
| `--blush-50` | `#FBECF1` | **Brand blush.** Light section bg, primary text on green, logo letters |
| `--cream-50` | `#F7F1EA` | Alt light bg (process, FAQ) so blush sections don't merge |
| `--rose-300` | `#E8B4C4` | Feminine accent: italic highlight words on green, cursor dot, marquee stars, focus ring on green |
| `--rose-500` | `#C9849B` | Rose on light bgs where rose-300 lacks contrast (underlines, small accents; not body text) |
| `--berry-700` | `#7A3A52` | Deep berry: italic accent words on blush/cream (contrast 7.4:1 on blush), link hover on light |
| `--gold-400` | `#C9A96E` | Hairline gold: thin rules, numerals in Process, star glyphs. Never fills. |
| `--ink-900` | `#1A2622` | Body text on light (green-tinted near-black) |
| `--ink-600` | `#4A5A54` | Secondary text on light |

Semantic aliases:
```
--bg-dark: var(--green-700);   --bg-darker: var(--forest-900);
--bg-light: var(--blush-50);   --bg-paper: var(--cream-50);
--text-on-dark: var(--blush-50); --muted-on-dark: var(--sage-300);
--text-on-light: var(--ink-900); --muted-on-light: var(--ink-600);
--accent-on-dark: var(--rose-300); --accent-on-light: var(--berry-700);
--line-on-dark: rgba(152,178,171,.28); --line-on-light: rgba(46,99,83,.18);
```

Contrast checks (must hold): blush on green-700 ≈ 6.9:1 ✓; sage-300 on green-700 ≈ 3.2:1 → use only ≥18px or non-essential labels, otherwise use blush at 80% (`rgba(251,236,241,.8)`); ink-900 on blush ✓; berry-700 on blush ✓; rose-300 on green-700 ≈ 4.0:1 → only for large italic display words (≥24px).

Selection: `::selection { background: var(--rose-300); color: var(--forest-900); }`

---

## 2. Typography

Google Fonts (one request, `display=swap`, preconnect):
```
https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Hanken+Grotesk:wght@300..800&display=swap
```

- **Display:** `Bodoni Moda` (high-contrast Didone, gorgeous italic, optical sizing). Use 400 roman for headlines, **italic 400/500 for the emotional word** in each headline (colored accent). `font-optical-sizing: auto`. Letter-spacing `-0.02em` at display sizes.
- **Text/UI:** `Hanken Grotesk`. Body 400, UI 500, labels 600, logo IMD 800.
- **Eyebrows / labels:** Hanken Grotesk 600, uppercase, `letter-spacing: 0.32em`, 11–12px. This echoes the tracked "IRAMAEDIA" in the logo; it is the signature detail, use it consistently.

Fluid type scale (ratio ~1.333, clamp min at 375px, max at 1440px):

| Token | Value | Use |
|---|---|---|
| `--fs-mega` | `clamp(3.5rem, 11vw, 10.5rem)` | Hero headline only. line-height .92 |
| `--fs-h1` | `clamp(2.6rem, 6.2vw, 5.75rem)` | Section headlines. lh 1.0 |
| `--fs-h2` | `clamp(2rem, 4vw, 3.5rem)` | Sub-headlines, CTA. lh 1.05 |
| `--fs-h3` | `clamp(1.375rem, 2vw, 1.75rem)` | Service names, card titles (serif). lh 1.15 |
| `--fs-lead` | `clamp(1.125rem, 1.4vw, 1.375rem)` | Intro paragraphs. lh 1.5 |
| `--fs-body` | `1.0625rem` (17px) | Body. lh 1.65 |
| `--fs-small` | `0.875rem` | Meta, captions. lh 1.5 |
| `--fs-label` | `0.75rem` | Eyebrows (tracked caps) |

Body measure: `max-width: 62ch`. Headlines: `text-wrap: balance`; paragraphs `text-wrap: pretty`.

---

## 3. Space, radius, layout, texture

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 176. Section vertical padding: `clamp(96px, 14vw, 176px)` for hero-weight sections, `clamp(72px, 10vw, 128px)` for others. **Vary it**; do not use one padding everywhere.
- Container: `max-width: 1320px; padding-inline: clamp(20px, 5vw, 64px)`. At 375px gutter = 20px.
- Grid: 12 columns, gap `clamp(16px, 2vw, 32px)`. Editorial asymmetry: text often spans cols 1–7, art 8–12, or offset to start at col 2.
- Radius: `--r-xs: 4px` (tags), `--r-sm: 10px` (inputs), `--r-md: 20px` (cards, media), `--r-pill: 999px` (buttons, chips), phone frame `--r-phone: 44px` outer / 34px screen. Mix sharp hairlines with soft pills; no medium-radius everything.
- Hairlines: 1px `--line-on-*`. Gold hairline (`--gold-400` at 60%) for Process & Pricing dividers only.
- **Grain:** fixed full-viewport pseudo-element on `body::after`, inline SVG `feTurbulence` (baseFrequency .9, numOctaves 2), `opacity: .07` on dark, blend `overlay`, `pointer-events:none`, `z-index: 100`. Static (no animated grain, perf).
- **Glow:** on dark sections, one soft radial blob `radial-gradient(closest-side, rgba(232,180,196,.18), transparent)` ~60vw wide, behind content. No more than one per section.
- Shadows: almost none. Phones get `0 40px 80px -30px rgba(20,48,42,.55)`. Light-section cards get none (use bg tint + hairline).

---

## 4. Logo (recreate in HTML/SVG)

- **Mark:** "IMD" in Hanken Grotesk 800, color blush on green (or green on blush). Tight tracking `-0.02em`.
- **Wordmark:** "IRAMAEDIA" Hanken Grotesk 500, uppercase, `letter-spacing: .42em`, ~0.28× mark size, centered under mark.
- **Globe:** inline SVG circle with 2–3 meridian ellipses + equator line, stroke `--green-500`, 1px, opacity .5, sitting behind the IMD mark (as in reference). Used in hero art and footer, NOT in nav.
- Nav logo: horizontal lockup "IMD" (20px, 800) + small tracked "IRAMAEDIA" (10px) to its right, separated by a 1px x 14px vertical sage line.
- Favicon: inline SVG data URI, green square r=6 with blush "IMD".

---

## 5. Sections (in order), layout + FINAL copy

Keep all copy in `index.html`; group placeholder content (work tiles, testimonials, prices, results) with `<!-- CONTENT: edit me -->` comments so she can edit easily. Use `[[ ]]` nowhere in visible UI; placeholders must read naturally.

**Copy rule: no em dashes anywhere in rendered text.** In this spec, ` — ` only separates a title from its description/answer, never render it. Testimonial attributions render as `Client name · Café owner` with no dash.

### 5.1 Nav (sticky)
- Height 72px desktop / 64px mobile. Transparent over hero; after 40px scroll gets `background: rgba(20,48,42,.72)` + `backdrop-filter: blur(14px) saturate(140%)` (this is the ONE allowed blur) + bottom hairline. On light sections it stays dark (consistent).
- Left: logo lockup. Center (desktop ≥1024): links `Work · Services · Process · Packages · FAQ` in 14px Hanken 500, blush 80%, hover to blush 100% with a rose 1px underline that draws from left (scaleX 0→1, origin left).
- Right: pill button **"Book a call"** (blush bg, forest-900 text). Mobile: pill hidden, replaced by a 44×44 menu button (two lines that morph to an X).
- Mobile menu: full-screen forest-900 sheet, links in Bodoni 40px italic stacked, staggered in; bottom shows email + Instagram. Esc and link click close it. Lock body scroll. Focus trapped.

### 5.2 Hero (bg `--green-700`, min-height 100svh)
Layout desktop: headline spans full width at top-left; below it a two-column row: left = lead + CTAs, right = **3 overlapping phone mockups** fanned (rotations −8°, 0°, +7°), middle one in front, each showing a styled placeholder post. The huge faint globe SVG (sage stroke, opacity .14, ~70vh) sits behind the phones, slowly rotating meridians. Mobile: headline, lead, CTAs, then a single phone with two peeking behind (±6°), scaled to fit 335px width.

Copy:
- Eyebrow: `SOCIAL MEDIA CONTENT CREATOR · MANAGER`
- Headline (mega, three lines):
  `Content that`
  `makes them` *`stop`*
  `scrolling.`
  ("stop" in Bodoni italic, `--rose-300`, with a small hand-drawn-feel SVG underline stroke in rose that draws in.)
- Lead: `I'm Ira. I plan, shoot, edit and post the kind of content that makes your brand look as good online as it feels in person. Thoughtful strategy, pretty feeds, Reels people actually finish.`
- Primary CTA: `Book a discovery call` (pill, blush bg, forest text, arrow icon that slides 4px right on hover)
- Secondary CTA: `See my work` (text link, blush, underline, scroll to #work)
- Small availability chip above CTAs: rose 6px dot (gentle pulse) + `Booking new clients for this season` (12px, tracked caps). Placeholder-safe; she can edit.
- Bottom-left corner of hero, tiny tracked caps: `SCROLL` with a 1px x 40px line that animates downward.

Placeholder phone posts (CSS art, no photos): each screen = a gradient "photo" (e.g. `linear-gradient(160deg,#E8B4C4,#C9849B)`, `linear-gradient(160deg,#98B2AB,#467E5C)`, `linear-gradient(160deg,#F7F1EA,#E8D5C4)`) with an abstract shape (circle/arch) and a serif overlay line such as *"new menu, who dis"*, *"5am club? no. 10am, with coffee."*, *"behind the scenes"*. Top: IG-style header bar (avatar circle + `yourbrand` + dots). Bottom: heart / comment / share icons (1.5px stroke SVG) and a like line `liked by you and others`. Reel phones show a play glyph and a 2px progress bar.

### 5.3 Marquee (bg `--blush-50`, full-bleed, ~84px tall)
Two rows on desktop moving in opposite directions, one row on mobile. Text in Bodoni italic `--fs-h3`×1.4, color `--green-700`, separated by a 4-point star glyph `✦` in `--gold-400`:
`Reels ✦ Content strategy ✦ Feed design ✦ Captions that sound like you ✦ UGC ✦ Community management ✦ Product shoots ✦ Launch campaigns ✦`
Row 2 (roman, Hanken 500 uppercase tracked .32em, 14px, green-500): `PLAN · SHOOT · EDIT · POST · GROW · REPEAT ·`
Pause on hover (desktop). Edge fade masks via `mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)`.

### 5.4 About (bg `--blush-50`, text ink)
Layout: 12-col. Left (cols 1–5): an **arched portrait frame** (border-radius `999px 999px 20px 20px`, aspect 4/5) filled with a soft green gradient + the IMD monogram in blush at center + a rotating circular text badge overlapping its corner: `IRAMAEDIA ✦ CONTENT WITH INTENTION ✦` (SVG textPath, rotates 1 rev / 24s). Comment in HTML: replace with her photo later (`assets/img/ira.jpg`).
Right (cols 7–12):
- Eyebrow: `HELLO, I'M IRA`
- H1: `Your brand, but` *`louder`* `and a little more` *`lovely.`* (italic words in `--berry-700`)
- Body:
  `I'm a social media content creator and manager for small businesses and personal brands who know they should be posting more, but would rather be running the business.`
  `I take the whole thing off your plate: the strategy, the shoot, the edit, the caption, the posting schedule, the replies. You get a feed that looks intentional and content that sounds like you on a good day.`
- Signature line in Bodoni italic 28px green-700: `Ira` followed by small tracked caps `FOUNDER, IRAMAEDIA`.
- Three small "values" inline (not cards), each a row with a gold numeral and hairline below:
  `01  Taste first. Pretty is the baseline, not the goal.`
  `02  Strategy, always. Every post has a job.`
  `03  You sound like you. Never like a template.`

### 5.5 Services (bg `--green-700`, text blush) id="services"
NOT a card grid. An **editorial index list**: each service is a full-width row with a top hairline (`--line-on-dark`): left number (`01`, gold, tracked), service name in Bodoni `--fs-h2` (roman, italic on hover), right a short description (max 40ch, blush 80%) and a `+` icon. Row hover (desktop pointer only): row bg gets a faint rose wash, name shifts 12px right, a small floating "preview" pill-image (CSS gradient tile 220×280, radius 20) follows the cursor within the list. Click/tap expands the row (accordion, `<details>` or button+aria-expanded) to show "What's included" tags (pills, 1px sage border, 13px).

Header:
- Eyebrow: `SERVICES`
- H1: `Everything your feed` *`needs`*`, in one place.` (italic rose-300)
- Lead (right column on desktop): `Hire me for the full package or just the piece you're missing. Most clients start with management and add the rest as they grow.`

Rows (core):
1. **Social media management** — `Planning, posting, scheduling and community care, so your accounts stay active and you stay sane.` Includes: `Monthly content calendar` `Scheduling & posting` `Comment & DM replies` `Monthly insights report`
2. **Content creation** — `Photos and short-form video made for the feed, styled to your brand and shot with the algorithm in mind.` Includes: `On-site or flat-lay shoots` `Product & lifestyle photos` `Behind-the-scenes content` `Batch shoot days`
3. **Reels & short-form editing** — `Hooks in the first second, clean cuts, captions on screen, trending audio used with taste.` Includes: `Hook writing` `Editing & captions` `Cover frames` `TikTok & Shorts versions`
4. **Content strategy** — `A clear plan for what to post, why, and how often. Pillars, voice, goals, and a calendar you can actually follow.` Includes: `Account audit` `Content pillars` `Brand voice guide` `90-day roadmap`

Sub-header "Other services" (eyebrow `ALSO ON THE MENU`, smaller list, 2 columns on desktop, rows in Bodoni `--fs-h3`, same hairline style, no expand):
5. **Feed & graphic design** — `Templates, carousels, highlight covers and a grid that looks good from three feet away.`
6. **Captions & copywriting** — `Captions, bios and CTAs that sound like you, just a little more confident.`
7. **UGC-style content** — `Natural, talk-to-camera videos for ads and product pages.`
8. **Launch & campaign content** — `A focused content push for openings, drops and big announcements.`
9. **Brand photography** — `Simple, styled photos of you, your space and your products.`

### 5.6 Selected work / Reels (bg `--forest-900`) id="work"
- Eyebrow: `SELECTED WORK`
- H1: `A peek at the` *`grid.`*
- Lead: `A few examples of the kind of content I make. Real client work is shared on request, and the newest is always on Instagram.`
- Filter chips (pills): `All` `Reels` `Carousels` `Feed` (active chip = blush bg, forest text; others 1px sage border). Filtering fades/scales items (opacity + scale .96), no layout jump: use `hidden` after transition end.
- **Grid of phone mockups**: desktop 4 columns with a staggered vertical offset (columns 2 and 4 pushed down 64px; editorial rhythm), tablet 3, mobile horizontal scroll-snap carousel (`scroll-snap-type: x mandatory`, each phone 72vw, peek of next) with dot indicators. 8 items.
- Each phone: bezel `--forest-800`, 10px padding, radius 44px, dynamic island pill top. Screen = 9:16 CSS-art reel/post: gradient bg from palette, abstract shapes, a serif overlay line, and a bottom meta bar. Below the phone (not inside): tag (`REEL` / `CAROUSEL` / `FEED`) tracked caps in rose-300 + title in Bodoni 20px + client line `Client name · Industry` in sage.
- Hover (fine pointer): phone lifts `translateY(-8px)` and tilts toward cursor (max 6°), screen content plays a slow Ken Burns (scale 1→1.06 over 6s). Reel items show a play button that scales 0.9→1 on hover.
- Sample tiles (placeholder copy, keep generic):
  1. REEL · `Morning menu launch` · `Café · Food & drink` · overlay: *"the oat latte that started it all"*
  2. CAROUSEL · `5 ways to style one blazer` · `Boutique · Fashion` · overlay: *"one piece, five moods"*
  3. REEL · `A day at the studio` · `Pilates studio · Wellness` · overlay: *"POV: your 7am class"*
  4. FEED · `Spring grid refresh` · `Skincare · Beauty` · 3×3 mini-grid inside screen
  5. REEL · `Behind the bouquet` · `Florist · Local business` · overlay: *"how a Friday order comes together"*
  6. CAROUSEL · `What I wish I knew` · `Coach · Personal brand` · overlay: *"lesson 03: rest is productive"*
  7. REEL · `Unboxing, but pretty` · `Handmade jewelry · E-commerce` · overlay: *"packed with love (and tissue)"*
  8. FEED · `Launch week teaser` · `Salon · Beauty` · overlay: *"something new is coming"*
- Below grid: centered link `See more on Instagram ↗` → https://www.instagram.com/iramaedia/ (target _blank, rel noopener).

### 5.7 Process (bg `--cream-50`, text ink) id="process"
- Eyebrow: `HOW WE WORK`
- H1: `Simple, from` *`hello`* `to posted.` (italic berry-700)
- Layout: horizontal 4-step timeline on desktop (a gold hairline across with dots that fill in as you scroll into view), vertical on mobile (line on the left, 1px gold, steps indented). Each step: Bodoni numeral 64px gold-400 italic, title Bodoni `--fs-h3`, 2-line body.
  1. **Discovery call** — `A relaxed 20-minute chat about your brand, your goals and what's not working right now.`
  2. **Strategy & plan** — `I audit your accounts and map out pillars, voice and a content calendar for the month.`
  3. **Create & approve** — `I shoot, edit and write. You review everything in one place before it goes live.`
  4. **Post, learn, grow** — `I publish, engage with your community, and send a monthly report with what to do next.`

### 5.8 Results & kind words (bg `--blush-50`)
Avoid the hero-metric template. Two parts:
- Left column, eyebrow `WHAT CLIENTS CAN EXPECT`, H2: `Consistent feeds. Real` *`conversations.`* `Less stress.` Then three *outcome statements* (not fake numbers), each a large Bodoni italic line with a hairline between:
  `A feed that looks like one brand, not five.`
  `Posting every week, even in your busiest month.`
  `More DMs, saves and shares from people who actually buy.`
  Small note under them (12px, ink-600): `Results vary by account and goals. Ask me for case studies on our call.`
- Right column: **testimonial slider** (one at a time, big quote). Quote mark `“` in Bodoni 160px rose-500 at 40% opacity behind. Quote text Bodoni `--fs-h3` italic ink-900. Attribution: `Client name` (Hanken 600) + `Business type` (tracked caps 11px). Prev/next round buttons (44px, 1px green border) + `01 / 03` counter. Auto-advance OFF. Placeholder quotes (clearly editable):
  1. `"Ira took our Instagram from an afterthought to the thing customers mention when they walk in. I finally don't think about it."` — `Client name · Café owner`
  2. `"She just gets the vibe. Every post looks like us, only better, and I haven't written a caption in months."` — `Client name · Boutique founder`
  3. `"Organised, quick, and genuinely creative. Our Reels finally feel like they belong to a real brand."` — `Client name · Wellness studio`
  HTML comment: `<!-- CONTENT: placeholder testimonials. Replace with real client quotes + permission before launch. -->`

### 5.9 Packages (bg `--green-700`) id="packages"
- Eyebrow: `PACKAGES`
- H1: `Pick your` *`pace.`*
- Lead: `Monthly packages, no long contracts. Every package can be tailored, so treat these as a starting point.`
- 3 columns desktop, stacked mobile. Middle one is featured. Cards: bg `--forest-800`, 1px `--line-on-dark`, radius 20, padding 40/32. Featured: bg `--blush-50`, text ink, small rose pill `MOST LOVED` top-right, slightly taller (translateY(-16px) on desktop). Price in Bodoni 56px; `/month` small Hanken. Feature list with a small 4-point star `✦` gold marker (not checkmarks). Button at bottom.
  1. **Starter** · `from $___` placeholder rendered as `From $450` with comment `<!-- CONTENT: set real price -->` · tagline `For brands ready to show up consistently.` · items: `1 platform` `12 posts per month` `Captions & hashtags` `Scheduling & posting` `Monthly check-in` · button `Start here` (outline).
  2. **Signature** (featured) · `From $850` · `For brands that want to grow, not just post.` · `2 platforms` `16 posts incl. 4 Reels` `1 content shoot per month` `Community management` `Strategy & monthly report` · button `Book a call` (green filled).
  3. **Full Feed** · `From $1,400` · `Your whole social presence, handled.` · `Up to 3 platforms` `20+ posts incl. 8 Reels` `2 content shoots per month` `Daily engagement` `Quarterly strategy session` · button `Let's talk` (outline).
- Under cards, centered small line: `Need a one-off? Strategy sessions, Reels packs and shoot days are available too.` with link `Ask about it →` to #contact.
- HTML comment: prices are placeholders she must confirm.

### 5.10 FAQ (bg `--cream-50`) id="faq"
- Layout: left sticky column (cols 1–4) eyebrow `GOOD QUESTIONS` + H1 `Before you` *`ask.`* + small text `Still curious? Message me on Instagram or send an email.`; right (cols 6–12) accordion.
- Accordion: rows with hairline, question Bodoni `--fs-h3`, `+` icon rotates 45° to ×. Answer Hanken body ink-600, max 60ch. Use `<details>/<summary>` or buttons with aria-expanded; animate height via `grid-template-rows: 0fr → 1fr` (allowed exception) 320ms ease-out.
  1. `Do you work with brands outside my city?` — `Yes. Strategy, editing, design and management all work remotely. Shoots happen locally or with content you send me, and I'll guide you on what to film.`
  2. `Which platforms do you manage?` — `Mostly Instagram, TikTok and Facebook. Pinterest and LinkedIn are possible too, just ask.`
  3. `How long until I see results?` — `Consistency shows up in the first month. Growth in reach and engagement usually builds over three months, which is why I plan in quarters.`
  4. `Do I need to be on camera?` — `Not at all. Plenty of great accounts are built on products, spaces and voiceovers. If you do want to show up, I'll make it easy and painless.`
  5. `Do I approve everything before it's posted?` — `Always. You get a monthly calendar to review, and nothing goes live without your okay.`
  6. `Is there a minimum contract?` — `Packages run month to month. I ask for one month's notice so the handover is smooth.`

### 5.11 Contact / CTA (bg `--green-700`, big drenched moment) id="contact"
- Full-width. Top: giant line in Bodoni `--fs-mega`, centered-left, blush with italic rose word:
  `Let's make your feed` *`unforgettable.`*
- Below, two columns: left = short text + direct links; right = form.
- Left copy: `Tell me a little about your brand and what you need. I reply within two business days, usually sooner.`
  Links (large, Bodoni 28px, underline on hover): `hello@iramaedia.com` (mailto; comment: placeholder email, confirm) and `@iramaedia on Instagram ↗`.
- Form (no backend; use `mailto:` action or `https://formsubmit.co/` is NOT allowed without her email; implement as `action="mailto:hello@iramaedia.com"` method POST enctype text/plain, plus JS that composes a mailto with fields). Fields: `Your name`, `Email`, `Brand / Instagram handle`, `What do you need?` (chips multi-select: `Management` `Content` `Reels` `Strategy` `Design` `Not sure yet`), `Tell me about your brand` (textarea). Inputs: transparent bg, 1px bottom border only `--line-on-dark`, blush text, label as small tracked caps above; focus: border becomes rose-300 and a 2px rose focus ring offset 3px for keyboard (`:focus-visible`). Submit: big pill blush button `Send it ✦` full width on mobile.
- Success/inline validation: inline messages under fields in rose-300, `aria-live="polite"`.

### 5.12 Footer (bg `--forest-900`)
- Huge wordmark "IRAMAEDIA" across the full width (Hanken 800, tracked .2em, `font-size: clamp(3rem, 14vw, 13rem)`, color `--green-700` on forest-900, i.e. tonal, barely there), with the globe SVG centered behind faintly.
- Row above it: logo lockup left; nav links middle; `Instagram ↗` and email right. Bottom hairline row: `© 2026 IraMaedia. Made with care.` left, `Back to top ↑` right (smooth scroll).

---

## 6. Components

- **Buttons:** pill, height 52px (44 min on mobile), padding 0 28px, Hanken 600 15px, letter-spacing .02em. Primary on dark: blush bg / forest-900 text; hover: bg rose-300. Primary on light: green-700 bg / blush text; hover: forest-800. Outline: 1px current-color border. All: `:active { transform: scale(.97) }` 140ms. **Magnetic** effect on primary CTAs only (hero, CTA submit, nav "Book a call"): translate toward cursor max 10px, inner label moves 1.3× further, release back with `cubic-bezier(.23,1,.32,1)` 500ms. Fine pointer only.
- **Links:** underline via background-size trick (1px line, scaleX from left on hover, 300ms).
- **Focus:** `:focus-visible { outline: 2px solid var(--rose-300); outline-offset: 3px; border-radius: inherit }` on dark; `--berry-700` on light sections.
- **Custom cursor (desktop fine pointer only, optional garnish):** 8px rose-300 dot follows pointer with lerp .2; over links/buttons it grows to 44px ring (1px blush border, transparent fill, `mix-blend-mode: difference` OFF; keep plain). Over work phones it becomes a 72px blush disc with tracked text `VIEW` in forest. Keep native cursor visible (do not hide system cursor; accessibility). Hide entirely under reduced motion and touch.
- **Scroll progress:** 2px rose-300 line at the very top of viewport, scaleX by scroll progress.

---

## 7. Motion spec

Tokens:
```
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entrances, hovers */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen moves, accordion, menu */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* mobile menu sheet */
--d-fast: 160ms; --d-base: 320ms; --d-slow: 700ms; --d-reveal: 1000ms;
```
Only animate `transform`, `opacity`, `clip-path`, `filter` (blur ≤ 8px). Never bounce/elastic. Use CSS transitions + IntersectionObserver (vanilla); GSAP 3.12.5 + ScrollTrigger optional only if needed for the hero sequence, otherwise vanilla.

**On load (hero), total ≤ 1.6s, content readable immediately if JS fails (no-JS = visible):**
1. 0ms: nav fades in (opacity 0→1, 600ms ease-out).
2. 100ms: headline lines reveal: each line wrapped in `overflow:hidden` span, inner span `translateY(105%) → 0`, 1000ms `--ease-out`, stagger 90ms.
3. 450ms: italic "stop" gets SVG underline stroke draw (`stroke-dashoffset` 100%→0, 900ms ease-in-out).
4. 500ms: eyebrow + lead + CTAs: opacity 0→1, translateY(16px)→0, 700ms ease-out, stagger 60ms.
5. 600ms: phones: from `translateY(60px) rotate(0) scale(.96); opacity 0` to their fanned rotation, 1200ms ease-out, stagger 120ms (back phones first).
6. Globe meridians: continuous rotation via animating SVG ellipse rx (or `rotateY` illusion with scaleX keyframes) 40s linear infinite. Very subtle.

**On scroll:**
- Generic `.reveal`: opacity 0, translateY(24px), `filter: blur(4px)` → clear, 900ms ease-out, threshold 0.15, rootMargin `0px 0px -10% 0px`, once. Stagger children 70ms via `--i` custom prop.
- Section headlines: line mask reveal like hero (800ms).
- About arch frame: `clip-path: inset(100% 0 0 0 round 999px 999px 20px 20px)` → `inset(0 ...)`, 1200ms ease-in-out.
- Hero phones parallax: back phones move at 0.9×, front at 1.05× (translateY only, rAF throttled, desktop only).
- Process line: gold hairline `scaleX(0→1)` (vertical: scaleY) tied to the section being in view, 1400ms ease-in-out; step dots fill sequentially (delay 250ms each).
- Work grid: phones rise in with stagger 80ms per column.
- Footer wordmark: letters rise in (translateY(40%)→0, stagger 30ms) when footer enters.

**Continuous:** marquee `translateX(0 → -50%)` linear, 38s row 1, 52s row 2 (reverse); circular badge rotate 24s linear; availability dot pulse (scale 1→1.8 + opacity .6→0 on a pseudo ring, 2.4s ease-out infinite).

**Hover (gate under `@media (hover:hover) and (pointer:fine)`):** buttons bg 200ms ease; arrow icon translateX(4px) 240ms ease-out; nav underline scaleX 300ms ease-out; service row name translateX(12px) + italic swap 320ms ease-out; work phone lift/tilt 400ms ease-out; package cards translateY(-6px) 320ms ease-out.

**Interactions:** accordion 320ms ease-in-out (grid-rows) + icon rotate 45° 240ms; mobile menu sheet `clip-path: circle(0 at top right) → circle(150% at top right)` 600ms `--ease-drawer`, links stagger 50ms; close is faster (300ms). Testimonial change: crossfade + translateX(16px) with blur(4px) mid-transition, 450ms ease-out. Filter chips: items opacity/scale 260ms.

**prefers-reduced-motion: reduce:**
- No transforms/parallax/marquee motion/magnetic/cursor/tilt/rotation/Ken Burns. Marquee becomes static (show first row, wrap allowed, no duplicate copies announced: duplicates `aria-hidden="true"` always).
- Reveals become opacity-only 200ms (or instantly visible).
- Accordion and menu: instant or 150ms opacity.
- Keep color/opacity hover feedback.

Performance: `will-change` only during active animation; IntersectionObserver not scroll listeners (except one rAF-throttled listener for nav state + progress + parallax); pause marquee & globe when off-screen (`animation-play-state`) and when `document.hidden`.

---

## 8. Responsive + a11y checklist

- 375px: no horizontal scroll (watch marquee, fanned phones, footer wordmark: `overflow:hidden` on their wrappers, `overflow-x: clip` on body). Hero headline must fit: mega clamp min 3.5rem → "scrolling." fits 335px at Bodoni 56px ✓.
- Breakpoints: 640, 1024, 1280.
- Landmarks: `header > nav`, `main`, sections with `aria-labelledby` their H2, `footer`. One H1 (hero headline). Section headlines are H2 visually styled as `--fs-h1`.
- Phone mockups are decorative art: `role="img"` + `aria-label="Sample Reel: Morning menu launch for a café"`.
- Skip link "Skip to content" (blush pill, appears on focus top-left).
- Tap targets ≥44px. Form labels real `<label>`. Error text linked via `aria-describedby`.
- `<html lang="en">`, meta description: `IraMaedia is Ira's social media content studio: strategy, Reels, content creation and account management for brands that want a feed with taste.` OG title `IraMaedia · Social media content that makes them stop scrolling`.
- All URLs relative (GitHub Pages sub-path).

---

## Changelog
- **r1 review:** added `--champagne-200: #EBD9B4` for small gold text on dark (5.0:1). Gold text on light is `#7A5F2E`. Eyebrows on green use blush at .86 alpha. The scrolled nav is `rgba(20,48,42,.94)` with a hairline. Bodoni numerals and prices use `opsz 18` at weight 500. Mobile hero lines sit flush left. Curly quotes throughout. "HOW IT WORKS". The FAQ question is now "Do you work with brands in other cities?". Stagger capped at 280ms. Font weights trimmed.
