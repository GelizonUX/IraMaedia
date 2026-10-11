# Project brief — IraMaedia portfolio (shared by Designer, Developer, QA)

## Client
- Brand: **IraMaedia** (logo mark "IMD", wordmark "IRAMAEDIA" letter-spaced). Instagram: https://www.instagram.com/iramaedia/
- She is a freelance **social media content creator / manager** making content for clients. Also offers other services
  (e.g. content strategy, Reels/short-form editing, graphic design for feeds, captions/copywriting, account management, UGC-style content, photo).
- Instagram is NOT reachable from this sandbox (DNS blocked). Do not invent hard stats (follower counts, named clients, testimonials attributed to real people).
  Use clearly placeholder-friendly copy (e.g. "Client name", sample results phrased as ranges/examples), and keep a `content` section easy to edit.

## Brand colors (sampled from her logo, exact pixels)
- Brand green (background): **#2E6353**
- Globe / secondary green: **#467E5C**
- Blush pink (IMD letters): **#FBECF1**
- Muted sage (globe edges): **#98B2AB**
- Extend with feminine accents that sit with these: e.g. deep forest #1E4237, rose/dusty pink #E8B4C4, champagne/cream #F7F1EA, soft gold #C9A96E. Designer decides final tokens.

## Direction
Advanced, sexy, feminine, minimal. Editorial / luxury-boutique feel. Cool animation & motion (scroll reveals, marquee,
cursor details, magnetic buttons, smooth hover states, subtle grain, phone-mockup reels grid etc.) — tasteful, performant,
honors prefers-reduced-motion.

## Technical constraints
- Static site served by GitHub Pages at https://gelizonux.github.io/IraMaedia/ (sub-path! use relative URLs only).
- Plain HTML/CSS/JS, no build step. Files at repo root: index.html, assets/css/*, assets/js/*, assets/img/*.
- External: Google Fonts allowed; JS libs only from cdnjs/jsdelivr with pinned versions (e.g. GSAP 3.12.5 is fine) — or vanilla.
- Must work at 375px mobile width, no horizontal scroll, accessible (contrast, alt text, focus states, semantic landmarks).
- Images: no real photos of her available. Use CSS/SVG art, gradients, abstract shapes, phone-frame mockups with styled placeholder "posts".
- Logo: recreate as text/SVG ("IMD" bold + "IRAMAEDIA" tracked) — reference image at .team/logo-reference.png.

## Team workflow (loop)
- Shared folder: /home/user/IraMaedia/.team/
  - DESIGN.md — Designer's spec (tokens, type, sections, copy, motion).
  - QA_REPORT.md — QA findings, numbered, with severity; each round appended.
  - LOG.md — everyone appends one line per action: `[role][round N] what you did`.
- Agents talk with SendMessage using names: `designer`, `developer`, `qa`.
- Loop: designer spec -> developer builds -> qa tests (Playwright, screenshots at 1440 & 375) -> designer reviews screenshots for visual fidelity
  and sends design fixes -> developer fixes -> qa retests. Repeat until QA reports zero High/Medium issues AND designer signs off, max 4 rounds.
- Do NOT git commit or push; the lead (main) does that.
