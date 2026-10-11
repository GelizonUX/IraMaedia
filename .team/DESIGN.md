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
