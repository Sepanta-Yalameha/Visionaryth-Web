# Visionaryth Landing Page — Design Spec

**Date:** 2026-05-08
**Topic:** Visionaryth landing page (single page: hero + content sections + waitlist UI)
**Scope:** marketing landing page only. Product/app code, analytics, and the real waitlist backend are out of scope and tracked in `CLAUDE.md`.

## Context

We're building the first public surface for Visionaryth — a webcam-based screen-habit coach that monitors posture, screen distance, and blink rate to slow myopia progression in growing eyes. The audience is youth and the parents who care about their children's prescription trajectory. The repo started essentially empty (the source MP4, the wordmark logo, and a Playwright skill ref).

Goals for this iteration:

1. Tell the product story visually via a pinned scroll-scrubbed hero animation.
2. Build trust with parents through two short content sections (How It Works, Why It Matters).
3. Capture interest via a waitlist email form.

The waitlist **backend is deferred** to a follow-up. The form UI is built; the route handler is a stub that validates with zod and `console.log`s. Real Resend / persistence wiring is documented in `CLAUDE.md` as the immediate next work item.

The hardest constraint, set by the user, is that the scroll-scrubbed hero must feel the same on mobile as on desktop. That single constraint drives the rest of the technical design.

## Brand

- Background: `#D6EFFF` (`--color-bg`)
- Accent: `#31A2FF` (`--color-accent`)
- Text: `#000` (`--color-ink`)
- Font: Poppins (Google Fonts) loaded via `next/font` for self-hosting + best CWV
- No emojis anywhere

## Tech & packages

- Next.js 15 App Router + React 19 + TypeScript 5
- Tailwind v4 (CSS-first via `@theme`, no `tailwind.config.*` file)
- GSAP 3 + `@gsap/react` (`useGSAP` hook for cleanup); ScrollTrigger plugin
- zod for shared client/server email validation
- Playwright for e2e

Not included on purpose:

- **Lenis** smooth-scroll. It hurts canvas-frame timing on a pinned scroll-scrubbed section, has flaky `syncTouch` on mobile, and hijacks scroll for `prefers-reduced-motion` users.
- **Framer Motion**. Overlaps with GSAP — paying for two animation runtimes is wasteful.
- **Resend / mail provider**. Deferred per user.

## Architecture & file tree

```
Visionaryth-Web/
├── app/
│   ├── layout.tsx                   # Poppins via next/font, brand bg/text, metadata
│   ├── page.tsx                     # Composes Hero → StickyNav → HowItWorks → WhyItMatters → WaitlistForm
│   ├── globals.css                  # Tailwind v4 + @theme brand tokens
│   └── api/waitlist/route.ts        # STUB: zod-validated 200 + console.log
├── components/
│   ├── Hero.tsx                     # pinned scroll-scrubbed hero (canvas + overlay inline)
│   ├── StickyNav.tsx                # renders BELOW hero, sticky from there
│   ├── HowItWorks.tsx               # 3-step explainer
│   ├── WhyItMatters.tsx             # myopia stats / problem framing
│   ├── WaitlistForm.tsx             # client form, posts to /api/waitlist
│   └── Logo.tsx                     # next/image wrapper for the wordmark
├── lib/
│   ├── frames.ts                    # FRAME_COUNTS, frame URL builder, variant detect
│   ├── scroll-frames.ts             # framework-agnostic preload + draw controller
│   └── waitlist-schema.ts           # zod email schema (client + server)
├── public/                          # renamed from `Public/`
│   ├── Visionaryth_Logo.png
│   ├── Scroll-Animation-Video.mp4   # source of truth (not loaded by the site)
│   └── frames/{desktop,mobile}/NNNN.webp
├── scripts/extract-frames.sh        # ffmpeg → desktop + mobile WebP sequences
├── tests/e2e/
│   ├── hero-scroll.spec.ts
│   ├── sticky-nav.spec.ts
│   ├── waitlist-form.spec.ts
│   └── mobile-viewport.spec.ts
├── docs/superpowers/
│   ├── specs/2026-05-08-visionaryth-landing-design.md
│   └── plans/2026-05-08-visionaryth-landing.md
├── CLAUDE.md                        # agent notes; documents waitlist-backend follow-up
├── README.md
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── playwright.config.ts
├── package.json
└── .gitignore
```

Renames / cleanups:

- `Public/` → `public/` (Linux is case-sensitive; Next.js requires lowercase).
- Delete `public/Scroll-Animation-Video.mp4:Zone.Identifier` (Windows ADS sidecar).

### Boundaries between units

- `lib/scroll-frames.ts` is framework-agnostic. It owns preload concurrency, canvas DPR/sizing, and `drawAt(progress)`. It exposes only `{ drawAt, destroy }` — no React, no GSAP. Easy to test in isolation later if we want.
- `Hero.tsx` is the React glue. It owns the single ScrollTrigger and routes `progress` to the controller and to overlay opacity.
- `lib/waitlist-schema.ts` is the single source of truth for the email shape — imported by both `WaitlistForm.tsx` and `app/api/waitlist/route.ts` so client and server validate identically.
- Brand tokens live in exactly one place: `@theme` in `globals.css`. Every component references via `var(--color-…)`; no hex literals scattered around.

## Scroll animation — the load-bearing decision

Three approaches were considered.

**Approach A (chosen): pre-extracted WebP frame sequence painted to `<canvas>`**

- Build-time: `scripts/extract-frames.sh` runs ffmpeg twice — once for desktop (1920px, 30 fps, q80) and once for mobile (828px, 24 fps, q75) — producing `public/frames/{desktop,mobile}/NNNN.webp`. Frames are committed as static assets so deploys don't need ffmpeg.
- Runtime: `lib/scroll-frames.ts` exposes `createFrameController(canvas, variant, opts)` which (a) preloads first 10 frames eagerly so frame 1 paints immediately, (b) preloads the rest with a concurrency-4 pool, (c) exposes `drawAt(progress)` that the scroll handler calls.
- **Reason chosen:** the only approach that's reliably smooth on iOS Safari. `<video>.currentTime` scrubbing stutters badly on iOS — the decoder is async and not built to be seek-spammed. Sources: Codrops "Optikka" case study (Oct 2025) and ghosh.dev video-scrubbing benchmark, both independently arriving at frame sequences as the answer.

**Approach B (rejected): `<video>` + `currentTime` driven by ScrollTrigger**

- Smaller payload (no extra static assets).
- Acceptable on desktop, **degraded on mobile**.
- Rejected because user explicitly required parity on mobile.

**Approach C (rejected): WebCodecs `VideoDecoder` + canvas**

- Theoretically nice, but Safari support shipped only in 17.0 with rough edges, iOS Low Power Mode disables it, and we still have to ship the source video. Not worth the complexity for a marketing page.

### GSAP setup invariants

A single `ScrollTrigger` lives in `Hero.tsx`:

- `pin: true`, `start: 'top top'`, `end: '+=300%'`, `scrub: 0.5`, `anticipatePin: 1`, `invalidateOnRefresh: true`.
- One `onUpdate` drives BOTH the canvas frame index AND the headline overlay opacity. **Reason:** two ScrollTriggers on the same pinned element can desync subtly on iOS Safari. Single source of truth removes the class.
- Headline + subhead fade out over `progress 0 → 0.2`, then stay invisible. The video's baked-in end-frame text appears later in the pin and never clashes with the HTML overlay.

### Mobile-specific design

- Hero uses `100svh`, not `100vh`, so iOS Safari toolbar resize doesn't break the pin mid-scroll.
- Variant selection: `window.matchMedia('(max-width: 768px)')` picks `mobile` vs `desktop` frame set.
- **Static fallback** (last frame as still image, no pin) for: `prefers-reduced-motion: reduce`, `navigator.connection.saveData`, or `effectiveType` of `2g`/`slow-2g`.
- Canvas DPR capped at 2 to bound memory on high-density mobile.

## Sticky nav placement

`<StickyNav />` renders **after** `<Hero />` in DOM order. The hero is full-bleed with no nav over it. After the hero un-pins, the nav becomes the topmost element via pure CSS `position: sticky; top: 0; z-index: 40` — no JS scroll listeners. Backdrop: `color-mix(in srgb, var(--color-bg) 80%, transparent)` + `backdrop-blur`. The "Join Waitlist" CTA is a plain `<a href="#waitlist">` so the existing `scroll-behavior: smooth` handles the jump.

## Content sections

- **HowItWorks**: 3 cards — (1) Webcam on, (2) Posture / distance / blink-rate tracked, (3) Real-time nudges. Each card includes a privacy callout: "nothing recorded, nothing uploaded." Wording assumes on-device inference; product team to confirm before launch.
- **WhyItMatters**: 2–3 paragraphs of parent-aimed framing + 3 stat callouts in `--color-accent` boxes. Stats are illustrative for now; final numbers to be sourced before launch.

## Waitlist (UI only this iteration)

- `WaitlistForm` is a client component with `noValidate` so our zod check, not the browser's native email validator, is the source of truth.
- Posts JSON `{ email }` to `/api/waitlist`.
- States: `idle | submitting | success | error`. Error covers both client validation and non-2xx server responses.
- `app/api/waitlist/route.ts` validates with the shared zod schema and `console.log`s. Documented in `CLAUDE.md` as the next thing to wire (Resend SDK + env vars + rate limit + persistence decision).

## Tailwind v4 + Poppins

- `app/globals.css` uses CSS-first `@theme` for brand tokens. No `tailwind.config.*` file.
- `app/layout.tsx` loads Poppins via `next/font/google` with weights 400/500/600/700, exposes its variable on `<html>`, and that variable feeds `--font-sans`.
- A global `prefers-reduced-motion` override in `globals.css` cuts animation/transition durations to ~0 ms — backs up component-level guards.

## Verification

- **Playwright e2e** on Chromium, two projects: `Desktop Chrome` (1440×900) and `Pixel 7` device profile. `webServer: 'npm run dev'` boots the dev server automatically.
- Specs:
  - `hero-scroll.spec.ts` — canvas non-blank at 0/25/50/75/100% of pin range; overlay opacity ≥ 0.9 at top, < 0.1 after one viewport scroll.
  - `sticky-nav.spec.ts` — nav at top after hero un-pins; CTA scrolls to `#waitlist`.
  - `waitlist-form.spec.ts` — happy path (mocked 200), invalid email skips network, server 500 surfaces error state.
  - `mobile-viewport.spec.ts` — hero ≈ 100svh, canvas paints, `data-variant="mobile"`, no horizontal overflow.
- **Manual smoke pass** before declaring done: network throttle, reduced-motion emulation, real-device iOS check.
- `npm run typecheck` (alias for `tsc --noEmit`) gates type errors before each commit.

## Deferred / out of scope (tracked in `CLAUDE.md`)

- Real waitlist backend: Resend SDK + rate limit + persistence decision (Vercel KV vs Supabase vs Google Sheet webhook).
- Verified email-sending domain (replace `onboarding@resend.dev`).
- OG image (static, derived from end frame).
- Analytics (Vercel Analytics or Plausible).
- Team / About section (deliberately excluded).

## Open items to flag during implementation

- **Source video properties.** Resolution / fps / duration are uninspected pre-implementation. After ffmpeg installs, run `ffprobe` first and adjust `extract-frames.sh` if defaults don't match.
- **Frame payload budget.** Target desktop < 15 MB, mobile < 5 MB. If over, drop fps (30→24, 24→18) and re-run.
- **Tagline copy** — "Preventing the myopic prescriptions we used to treat" is provisional.
- **HowItWorks privacy claim** — wording assumes on-device inference; confirm with product before shipping.
