# Visionaryth Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-05-08-visionaryth-landing-design.md`

**Goal:** Ship a single-page Visionaryth landing site with a smooth pinned scroll-scrubbed hero, content sections, and a waitlist form (UI only) — verified via Playwright e2e tests.

**Architecture:** Next.js 15 App Router. `Hero.tsx` owns one ScrollTrigger that pins the hero, drives a frame-sequence canvas (logic in `lib/scroll-frames.ts`), AND fades the overlay headline — all from a single `onUpdate` so they stay frame-synced. `StickyNav` renders below the hero so it never overlaps it. Content sections (`HowItWorks`, `WhyItMatters`) and a `WaitlistForm` round out the page. Frames are extracted from the source MP4 at build time via ffmpeg and committed as static assets. The waitlist route handler is a stub; real backend wiring is documented in `CLAUDE.md`.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind v4 (CSS-first), Poppins via `next/font`, GSAP 3 + `@gsap/react`, zod, Playwright.

---

## Task 1: Rename `Public/` → `public/` and remove the Zone.Identifier sidecar

**Files:**

- Move: `Public/` → `public/`
- Delete: `public/Scroll-Animation-Video.mp4:Zone.Identifier`

- [ ] **Step 1: Rename folder**

```bash
mv Public public
```

- [ ] **Step 2: Delete the Windows ADS sidecar**

```bash
rm "public/Scroll-Animation-Video.mp4:Zone.Identifier"
```

- [ ] **Step 3: Verify**

```bash
ls public/
```

Expected output:

```
Scroll-Animation-Video.mp4  Visionaryth_Logo.png
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: rename Public/ to public/ for Next.js convention"
```

---

## Task 2: Initialize Node project + Next.js + TypeScript

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `next-env.d.ts`, `.gitignore`, `app/`

- [ ] **Step 1: Initialize npm**

```bash
npm init -y
```

- [ ] **Step 2: Install runtime deps**

```bash
npm install next@^15 react@^19 react-dom@^19
```

- [ ] **Step 3: Install dev deps**

```bash
npm install -D typescript @types/react @types/react-dom @types/node
```

- [ ] **Step 4: Create `next.config.ts`**

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 6: Create `next-env.d.ts`**

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

- [ ] **Step 7: Create `.gitignore`**

```
node_modules/
.next/
out/
.env*.local
*.tsbuildinfo
.DS_Store
test-results/
playwright-report/
playwright/.cache/
```

- [ ] **Step 8: Replace `package.json` scripts block with**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "extract-frames": "bash scripts/extract-frames.sh",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 9: Create the empty `app/` directory** (Next 15 needs it to exist)

```bash
mkdir -p app
```

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts next-env.d.ts .gitignore
git commit -m "chore: initialize Next.js 15 + TypeScript project"
```

---

## Task 3: Install ffmpeg + probe the source video

System-level — not committed.

- [ ] **Step 1: Install ffmpeg**

```bash
sudo apt-get update && sudo apt-get install -y ffmpeg
```

- [ ] **Step 2: Verify**

```bash
ffmpeg -version | head -1
ffprobe -version | head -1
```

Expected: ffmpeg ≥ 4.x.

- [ ] **Step 3: Probe the source**

```bash
ffprobe -v error \
  -show_entries stream=width,height,r_frame_rate,nb_frames \
  -show_entries format=duration \
  -of default=noprint_wrappers=1 \
  public/Scroll-Animation-Video.mp4
```

Record the values. Defaults in Task 4 assume ≤ 1920×1080 source at ≥ 24 fps. If source width < 1920, the script's `min(1920,iw)` clamp handles it. If duration > 20 s, drop desktop fps from 30 to 24 in the script to keep payload under 15 MB.

---

## Task 4: Frame extraction script + run

**Files:**

- Create: `scripts/extract-frames.sh`
- Generated: `public/frames/desktop/*.webp`, `public/frames/mobile/*.webp`

- [ ] **Step 1: Create the script**

`scripts/extract-frames.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
SRC="public/Scroll-Animation-Video.mp4"

if [[ ! -f "$SRC" ]]; then
  echo "Source video not found at $SRC" >&2
  exit 1
fi

mkdir -p public/frames/desktop public/frames/mobile

echo "Extracting desktop frames…"
ffmpeg -y -i "$SRC" -vf "fps=30,scale='min(1920,iw)':-2:flags=lanczos" \
  -c:v libwebp -quality 80 \
  public/frames/desktop/%04d.webp

echo "Extracting mobile frames…"
ffmpeg -y -i "$SRC" -vf "fps=24,scale='min(828,iw)':-2:flags=lanczos" \
  -c:v libwebp -quality 75 \
  public/frames/mobile/%04d.webp

echo "Done. Counts:"
echo "  desktop: $(ls public/frames/desktop | wc -l)"
echo "  mobile:  $(ls public/frames/mobile | wc -l)"
```

- [ ] **Step 2: Make executable + run**

```bash
chmod +x scripts/extract-frames.sh
npm run extract-frames
```

- [ ] **Step 3: Check the payload**

```bash
du -sh public/frames/desktop public/frames/mobile
```

Expected: desktop < 15 MB, mobile < 5 MB. If over budget, lower fps in the script (30→24, 24→18) and re-run.

- [ ] **Step 4: Record frame counts** (you'll bake them into Task 7)

```bash
echo "DESKTOP_COUNT=$(ls public/frames/desktop | wc -l)"
echo "MOBILE_COUNT=$(ls public/frames/mobile | wc -l)"
```

Write the two numbers down — they go into `lib/frames.ts` in Task 7.

- [ ] **Step 5: Commit**

```bash
git add scripts/extract-frames.sh public/frames
git commit -m "feat: extract scroll-animation WebP frame sequences (desktop + mobile)"
```

---

## Task 5: Tailwind v4 + brand tokens + Poppins root layout

**Files:**

- Create: `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Install Tailwind v4**

```bash
npm install -D tailwindcss@^4 @tailwindcss/postcss postcss
```

- [ ] **Step 2: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
export default config;
```

- [ ] **Step 3: Create `app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-bg: #D6EFFF;
  --color-accent: #31A2FF;
  --color-ink: #000000;
  --font-sans: var(--font-poppins), ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, sans-serif;
}

html, body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-sans);
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 4: Create `app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Visionaryth — preventing the myopic prescriptions we used to treat',
  description:
    'A webcam-based screen-habit coach that helps growing eyes by improving posture, distance, and blink rate in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Verify build compiles**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add postcss.config.mjs app/globals.css app/layout.tsx package.json package-lock.json
git commit -m "feat(style): tailwind v4 brand tokens, Poppins root layout, metadata"
```

---

## Task 6: Stub `app/page.tsx` with section heights

**Files:**

- Create: `app/page.tsx`

Skeleton-first so the page can scroll end-to-end before components are wired.

- [ ] **Step 1: Create the page**

```tsx
export default function HomePage() {
  return (
    <main>
      <section
        id="hero"
        data-testid="hero"
        className="relative w-full overflow-hidden"
        style={{ height: '100svh' }}
      >
        <h1 className="absolute left-8 top-1/3 text-5xl font-bold">Visionaryth</h1>
      </section>

      <nav data-testid="sticky-nav" className="sticky top-0 z-40 h-16 w-full" />
      <section id="how-it-works" data-testid="how-it-works" className="min-h-screen" />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
```

- [ ] **Step 2: Verify it renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: brand-blue page, "Visionaryth" headline visible, page scrolls. Stop dev server (`Ctrl-C`).

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: stub landing sections with correct heights"
```

---

## Task 7: Frame manifest helper (`lib/frames.ts`)

**Files:**

- Create: `lib/frames.ts`

- [ ] **Step 1: Create the file**

Replace `__DESKTOP__` and `__MOBILE__` with the counts from Task 4 Step 4.

```ts
export const FRAME_COUNTS = {
  desktop: __DESKTOP__,
  mobile: __MOBILE__,
} as const;

export type FrameVariant = keyof typeof FRAME_COUNTS;

export function frameURL(variant: FrameVariant, index: number): string {
  const padded = String(index + 1).padStart(4, '0');
  return `/frames/${variant}/${padded}.webp`;
}

export function detectVariant(): FrameVariant {
  if (typeof window === 'undefined') return 'desktop';
  return window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
}

export function shouldUseStaticFallback(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /^(slow-)?2g$/.test(conn.effectiveType)) return true;
  return false;
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/frames.ts
git commit -m "feat(lib): frame manifest with variant detection and fallback gate"
```

---

## Task 8: Frame controller (`lib/scroll-frames.ts`)

**Files:**

- Create: `lib/scroll-frames.ts`

Framework-agnostic preload + canvas drawing controller. No GSAP — it's a function the React layer calls.

- [ ] **Step 1: Create the file**

```ts
import { FRAME_COUNTS, frameURL, type FrameVariant } from './frames';

const EAGER_COUNT = 10;
const POOL_SIZE = 4;

export type FrameController = {
  drawAt(progress: number): void;
  destroy(): void;
};

export function createFrameController(
  canvas: HTMLCanvasElement,
  variant: FrameVariant,
  options: { staticOnly?: boolean } = {}
): FrameController {
  const total = FRAME_COUNTS[variant];
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { drawAt() {}, destroy() {} };
  }

  const images: (HTMLImageElement | null)[] = new Array(total).fill(null);
  let lastDrawn = -1;
  let cancelled = false;

  const sizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (i: number) => {
    if (i === lastDrawn) return;
    const img = images[i];
    if (!img || img.naturalWidth === 0) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    lastDrawn = i;
  };

  const loadOne = (i: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameURL(variant, i);
      img.onload = () => {
        if (cancelled) return resolve();
        images[i] = img;
        if (i === 0) draw(0);
        resolve();
      };
      img.onerror = () => resolve();
    });

  sizeCanvas();

  if (options.staticOnly) {
    loadOne(total - 1).then(() => draw(total - 1));
  } else {
    const eager: Promise<void>[] = [];
    for (let i = 0; i < Math.min(EAGER_COUNT, total); i++) eager.push(loadOne(i));
    Promise.all(eager).then(() => {
      let next = EAGER_COUNT;
      const workers = Array.from({ length: POOL_SIZE }, async () => {
        while (!cancelled && next < total) await loadOne(next++);
      });
      Promise.all(workers);
    });
  }

  const onResize = () => {
    sizeCanvas();
    if (lastDrawn >= 0) {
      const i = lastDrawn;
      lastDrawn = -1;
      draw(i);
    }
  };
  window.addEventListener('resize', onResize);

  return {
    drawAt(progress: number) {
      const clamped = Math.min(1, Math.max(0, progress));
      const i = Math.min(total - 1, Math.round(clamped * (total - 1)));
      draw(i);
    },
    destroy() {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    },
  };
}
```

- [ ] **Step 2: Type-check**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/scroll-frames.ts
git commit -m "feat(lib): frame preload pool + canvas draw controller"
```

---

## Task 9: Install GSAP

- [ ] **Step 1: Install**

```bash
npm install gsap@^3 @gsap/react@^2
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install GSAP + @gsap/react"
```

---

## Task 10: `Hero.tsx` — pinned trigger driving canvas + overlay fade

**Files:**

- Create: `components/Hero.tsx`
- Modify: `app/page.tsx`

The load-bearing component. **Single ScrollTrigger** that pins the section, draws the canvas, and fades the overlay opacity from one `onUpdate`. They never desync.

- [ ] **Step 1: Create `components/Hero.tsx`**

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { createFrameController } from '@/lib/scroll-frames';
import { detectVariant, shouldUseStaticFallback } from '@/lib/frames';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FADE_END_PROGRESS = 0.2;

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const hero = heroRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      if (!hero || !canvas || !overlay) return;

      const variant = detectVariant();
      const useStatic = shouldUseStaticFallback();
      canvas.dataset.variant = variant;

      const controller = createFrameController(canvas, variant, { staticOnly: useStatic });

      if (useStatic) {
        gsap.set(overlay, { opacity: 1 });
        return () => controller.destroy();
      }

      const trigger = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=300%',
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          controller.drawAt(self.progress);
          const fade = Math.max(0, 1 - self.progress / FADE_END_PROGRESS);
          gsap.set(overlay, { opacity: fade, y: -20 * (1 - fade) });
        },
      });

      return () => {
        trigger.kill();
        controller.destroy();
      };
    },
    { scope: heroRef }
  );

  return (
    <section
      ref={heroRef}
      data-testid="hero"
      className="relative w-full overflow-hidden"
      style={{ height: '100svh' }}
    >
      <canvas
        ref={canvasRef}
        data-testid="hero-canvas"
        className="absolute inset-0 h-full w-full"
      />
      <div
        ref={overlayRef}
        data-testid="hero-overlay"
        className="pointer-events-none absolute left-0 top-0 z-10 flex h-full w-full items-center px-6 sm:px-12 md:px-20 lg:w-1/2"
      >
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black sm:text-6xl md:text-7xl">
            Visionaryth
          </h1>
          <p className="mt-4 text-lg font-medium text-black sm:text-xl md:text-2xl">
            Preventing the myopic prescriptions we used to treat.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`** — replace the hero stub:

```tsx
import Hero from '@/components/Hero';

export default function HomePage() {
  return (
    <main>
      <Hero />

      <nav data-testid="sticky-nav" className="sticky top-0 z-40 h-16 w-full" />
      <section id="how-it-works" data-testid="how-it-works" className="min-h-screen" />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
```

- [ ] **Step 3: Manual smoke test**

```bash
npm run dev
```

Walk through:

- Hero shows frame 1 with "Visionaryth" + subhead overlay on the left.
- Scrolling pins the hero, advances frames smoothly, fades overlay within ~20% of pin.
- DevTools throttle "Slow 4G" + reload — frame 1 paints quickly; later frames stream in.
- DevTools "Emulate prefers-reduced-motion: reduce" — overlay stays visible at full opacity, hero shows last frame, no pin.

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx app/page.tsx
git commit -m "feat(hero): pinned scroll-scrubbed canvas with overlay fade from one trigger"
```

---

## Task 11: Logo + StickyNav

**Files:**

- Create: `components/Logo.tsx`, `components/StickyNav.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create `components/Logo.tsx`**

```tsx
import Image from 'next/image';

type Props = { className?: string; priority?: boolean };

export default function Logo({ className = '', priority = false }: Props) {
  return (
    <Image
      src="/Visionaryth_Logo.png"
      alt="Visionaryth"
      width={180}
      height={40}
      priority={priority}
      className={className}
    />
  );
}
```

- [ ] **Step 2: Create `components/StickyNav.tsx`**

```tsx
import Logo from './Logo';

export default function StickyNav() {
  return (
    <nav
      data-testid="sticky-nav"
      className="sticky top-0 z-40 w-full backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--color-bg) 80%, transparent)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#hero" aria-label="Visionaryth home" className="flex items-center">
          <Logo className="h-8 w-auto" />
        </a>
        <a
          href="#waitlist"
          data-testid="nav-cta"
          className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Wire into `app/page.tsx`** — replace the `<nav data-testid="sticky-nav" …>` line with `<StickyNav />`:

```tsx
import Hero from '@/components/Hero';
import StickyNav from '@/components/StickyNav';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StickyNav />
      <section id="how-it-works" data-testid="how-it-works" className="min-h-screen" />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
```

- [ ] **Step 4: Manual check**

`npm run dev` → scroll past hero → nav sticks at top with logo + CTA. Click CTA → page jumps to `#waitlist`.

- [ ] **Step 5: Commit**

```bash
git add components/StickyNav.tsx components/Logo.tsx app/page.tsx
git commit -m "feat(nav): sticky nav rendering after the hero"
```

---

## Task 12: `HowItWorks`

**Files:**

- Create: `components/HowItWorks.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the component**

```tsx
const STEPS = [
  {
    n: '01',
    title: 'Turn on your webcam',
    body: 'Visionaryth observes from your device — nothing recorded, nothing uploaded, nothing leaves your computer.',
  },
  {
    n: '02',
    title: 'We track posture, distance, and blink rate',
    body: 'On-device computer vision watches the three habits most linked to myopia progression — in real time.',
  },
  {
    n: '03',
    title: 'You get gentle, real-time nudges',
    body: 'A subtle prompt when you slouch, lean too close, or stop blinking. No popups. No guilt-tripping.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-testid="how-it-works"
      className="w-full px-6 py-24 sm:px-12 md:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-3 max-w-2xl text-base text-black/70 sm:text-lg">
          A coach that lives in your camera, not in the cloud.
        </p>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-3xl bg-white/60 p-8 shadow-sm ring-1 ring-black/5"
            >
              <div className="font-mono text-sm font-semibold text-[var(--color-accent)]">
                {s.n}
              </div>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-base text-black/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`** — replace the `<section id="how-it-works" …>` stub with `<HowItWorks />`.

- [ ] **Step 3: Commit**

```bash
git add components/HowItWorks.tsx app/page.tsx
git commit -m "feat(content): How It Works 3-step explainer"
```

---

## Task 13: `WhyItMatters`

**Files:**

- Create: `components/WhyItMatters.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the component**

```tsx
const STATS = [
  { n: '50%', label: 'projected global myopia rate by 2050' },
  { n: '7+ hrs', label: 'average daily screen time among teens' },
  { n: '↓50%', label: 'blink rate drop while staring at screens' },
];

export default function WhyItMatters() {
  return (
    <section
      id="why-it-matters"
      data-testid="why-it-matters"
      className="w-full px-6 py-24 sm:px-12 md:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Why it matters
        </h2>
        <p className="mt-4 max-w-2xl text-base text-black/70 sm:text-lg">
          Myopia is rising fastest in the generation that grew up on screens. Habits formed
          today shape how their eyes develop tomorrow — Visionaryth is for that window.
        </p>

        <dl className="mt-12 grid gap-6 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl bg-[var(--color-accent)] p-8 text-black"
            >
              <dt className="text-4xl font-bold sm:text-5xl">{s.n}</dt>
              <dd className="mt-3 text-base font-medium">{s.label}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-3xl text-sm text-black/60">
          Stats above are illustrative; final numbers will be sourced before launch.
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `app/page.tsx`** — replace the `<section id="why-it-matters" …>` stub with `<WhyItMatters />`.

- [ ] **Step 3: Commit**

```bash
git add components/WhyItMatters.tsx app/page.tsx
git commit -m "feat(content): Why It Matters with myopia stat callouts"
```

---

## Task 14: Waitlist schema + STUB route handler

**Files:**

- Create: `lib/waitlist-schema.ts`, `app/api/waitlist/route.ts`

- [ ] **Step 1: Install zod**

```bash
npm install zod@^3
```

- [ ] **Step 2: Create the schema**

`lib/waitlist-schema.ts`:

```ts
import { z } from 'zod';

export const waitlistSchema = z.object({
  email: z.string().email().max(254),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
```

- [ ] **Step 3: Create the stub route**

`app/api/waitlist/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { waitlistSchema } from '@/lib/waitlist-schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  // Backend integration is deferred. See CLAUDE.md.
  console.log('[waitlist:stub]', parsed.data.email);
  return Response.json({ ok: true, stub: true });
}
```

- [ ] **Step 4: Smoke-test the route**

```bash
npm run dev
```

In a second terminal:

```bash
curl -i -X POST http://localhost:3000/api/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com"}'
```

Expected: `HTTP/1.1 200 OK`, body `{"ok":true,"stub":true}`. Server log shows `[waitlist:stub] test@example.com`.

```bash
curl -i -X POST http://localhost:3000/api/waitlist \
  -H 'Content-Type: application/json' \
  -d '{"email":"not-an-email"}'
```

Expected: `400`, body `{"ok":false,"error":"invalid_email"}`. Stop dev server.

- [ ] **Step 5: Commit**

```bash
git add lib/waitlist-schema.ts app/api/waitlist/route.ts package.json package-lock.json
git commit -m "feat(waitlist): zod schema and stub route handler"
```

---

## Task 15: `WaitlistForm`

**Files:**

- Create: `components/WaitlistForm.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create the component**

```tsx
'use client';

import { useState } from 'react';
import { waitlistSchema } from '@/lib/waitlist-schema';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = waitlistSchema.safeParse({ email });
    if (!parsed.success) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        setStatus('error');
        setErrorMsg('Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <section
      id="waitlist"
      data-testid="waitlist"
      className="w-full px-6 py-24 sm:px-12 md:px-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Be first in line
        </h2>
        <p className="mt-4 text-base text-black/70 sm:text-lg">
          Join the waitlist and we'll let you know the moment Visionaryth opens up.
        </p>

        {status === 'success' ? (
          <p
            data-testid="waitlist-success"
            role="status"
            className="mt-10 inline-flex rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-medium text-black"
          >
            You're on the list. We'll be in touch.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            data-testid="waitlist-form"
            noValidate
            className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              data-testid="waitlist-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full bg-white px-5 py-3 text-base ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:w-80"
            />
            <button
              type="submit"
              data-testid="waitlist-submit"
              disabled={status === 'submitting'}
              className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-black disabled:opacity-50"
            >
              {status === 'submitting' ? 'Joining…' : 'Join Waitlist'}
            </button>
          </form>
        )}
        {errorMsg && (
          <p data-testid="waitlist-error" role="alert" className="mt-4 text-sm text-red-700">
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}
```

`noValidate` is set so the browser's native email validation doesn't preempt our zod check — needed by the negative-path test in Task 19.

- [ ] **Step 2: Wire into `app/page.tsx`** — replace the `<section id="waitlist" …>` stub with `<WaitlistForm />`.

- [ ] **Step 3: Manual check**

`npm run dev` → scroll to waitlist → submit valid email → success. Submit invalid → error. Click nav CTA from elsewhere → page scrolls here.

- [ ] **Step 4: Commit**

```bash
git add components/WaitlistForm.tsx app/page.tsx
git commit -m "feat(waitlist): client form with zod validation, success and error states"
```

---

## Task 16: Configure Playwright

**Files:**

- Create: `playwright.config.ts`, `tests/e2e/.gitkeep`

- [ ] **Step 1: Install Playwright + Chromium**

```bash
npm install -D @playwright/test@^1
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
```

- [ ] **Step 3: Create the test directory marker**

```bash
mkdir -p tests/e2e
touch tests/e2e/.gitkeep
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/.gitkeep package.json package-lock.json
git commit -m "chore(test): playwright config with desktop + mobile projects"
```

---

## Task 17: Hero scroll spec

**Files:**

- Create: `tests/e2e/hero-scroll.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect, type Page } from '@playwright/test';

const SCROLL_STEPS = [0, 0.25, 0.5, 0.75, 1];

async function canvasIsNonBlank(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="hero-canvas"]');
    if (!c) return false;
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    const { data } = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1);
    return data[3] > 0;
  });
}

test('hero canvas paints frames as user scrolls', async ({ page }) => {
  await page.goto('/');
  const canvas = page.getByTestId('hero-canvas');
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(800);

  const pinPx = await page.evaluate(() => window.innerHeight * 3);

  for (const t of SCROLL_STEPS) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), t * pinPx);
    await page.waitForTimeout(350);
    expect(await canvasIsNonBlank(page)).toBe(true);
  }
});

test('hero overlay fades as user scrolls past the start of the pin', async ({ page }) => {
  await page.goto('/');
  const overlay = page.getByTestId('hero-overlay');
  await expect(overlay).toBeVisible();

  const initialOpacity = await overlay.evaluate(
    (el) => Number(getComputedStyle(el).opacity)
  );
  expect(initialOpacity).toBeGreaterThan(0.9);

  await page.evaluate(
    () => window.scrollTo({ top: window.innerHeight, behavior: 'instant' as ScrollBehavior })
  );
  await page.waitForTimeout(500);

  const fadedOpacity = await overlay.evaluate(
    (el) => Number(getComputedStyle(el).opacity)
  );
  expect(fadedOpacity).toBeLessThan(0.1);
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e -- --project=chromium-desktop hero-scroll.spec.ts
```

Expected: 2 passes.

If overlay fade fails: the pin uses `end: '+=300%'`, so 1 viewport scroll ≈ 33% progress. With `FADE_END_PROGRESS = 0.2`, opacity should be 0 by then. If not, double-check `Hero.tsx`'s `gsap.set(overlay, …)` and that `scrub: 0.5` has had time to settle (the 500 ms wait).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/hero-scroll.spec.ts
git commit -m "test(hero): canvas paint + overlay fade across scroll positions"
```

---

## Task 18: Sticky nav spec

**Files:**

- Create: `tests/e2e/sticky-nav.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';

test('sticky nav appears after hero and CTA scrolls to waitlist', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByTestId('sticky-nav');

  await page.waitForTimeout(300);

  const pastHero = await page.evaluate(() => window.innerHeight * 3.5);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }),
    pastHero
  );
  await page.waitForTimeout(400);

  await expect(nav).toBeVisible();
  const navTop = await nav.evaluate((el) => el.getBoundingClientRect().top);
  expect(navTop).toBeLessThanOrEqual(2);

  await page.getByTestId('nav-cta').click();
  await page.waitForTimeout(800);

  const waitlistTop = await page.evaluate(() => {
    const el = document.querySelector('#waitlist') as HTMLElement;
    return el.getBoundingClientRect().top;
  });
  expect(Math.abs(waitlistTop)).toBeLessThan(80);
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e -- --project=chromium-desktop sticky-nav.spec.ts
```

Expected: pass.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/sticky-nav.spec.ts
git commit -m "test(nav): sticky nav appears past hero and CTA scrolls to waitlist"
```

---

## Task 19: Waitlist form spec

**Files:**

- Create: `tests/e2e/waitlist-form.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';

test.describe('waitlist form', () => {
  test('happy path with mocked 200', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/waitlist', async (route) => {
      calls++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, stub: true }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => document.querySelector('#waitlist')!.scrollIntoView());

    await page.getByTestId('waitlist-email').fill('parent@example.com');
    await page.getByTestId('waitlist-submit').click();

    await expect(page.getByTestId('waitlist-success')).toBeVisible();
    expect(calls).toBe(1);
  });

  test('invalid email shows client-side error and skips network', async ({ page }) => {
    let calls = 0;
    await page.route('**/api/waitlist', async (route) => {
      calls++;
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/');
    await page.evaluate(() => document.querySelector('#waitlist')!.scrollIntoView());

    await page.getByTestId('waitlist-email').fill('not-an-email');
    await page.getByTestId('waitlist-submit').click();

    await expect(page.getByTestId('waitlist-error')).toBeVisible();
    expect(calls).toBe(0);
  });

  test('server error shows error state', async ({ page }) => {
    await page.route('**/api/waitlist', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ ok: false }),
      });
    });

    await page.goto('/');
    await page.evaluate(() => document.querySelector('#waitlist')!.scrollIntoView());

    await page.getByTestId('waitlist-email').fill('parent@example.com');
    await page.getByTestId('waitlist-submit').click();

    await expect(page.getByTestId('waitlist-error')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e -- --project=chromium-desktop waitlist-form.spec.ts
```

Expected: 3 passes.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/waitlist-form.spec.ts
git commit -m "test(waitlist): happy path, client validation, and server-error states"
```

---

## Task 20: Mobile viewport spec

**Files:**

- Create: `tests/e2e/mobile-viewport.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test';

test('mobile: hero is roughly 100svh and canvas paints', async ({ page }) => {
  await page.goto('/');
  const hero = page.getByTestId('hero');
  await expect(hero).toBeVisible();

  const { heroH, vh } = await page.evaluate(() => {
    const h = document.querySelector('[data-testid="hero"]') as HTMLElement;
    return { heroH: h.getBoundingClientRect().height, vh: window.innerHeight };
  });
  expect(Math.abs(heroH - vh) / vh).toBeLessThan(0.05);

  await page.waitForTimeout(800);
  const isPainted = await page.evaluate(() => {
    const c = document.querySelector<HTMLCanvasElement>('[data-testid="hero-canvas"]');
    if (!c) return false;
    const ctx = c.getContext('2d');
    if (!ctx) return false;
    const { data } = ctx.getImageData(Math.floor(c.width / 2), Math.floor(c.height / 2), 1, 1);
    return data[3] > 0;
  });
  expect(isPainted).toBe(true);
});

test('mobile: canvas variant is "mobile"', async ({ page }) => {
  await page.goto('/');
  const variant = await page.getByTestId('hero-canvas').getAttribute('data-variant');
  expect(variant).toBe('mobile');
});

test('mobile: nav fits one row, no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    () => window.scrollTo({ top: window.innerHeight * 3.5, behavior: 'instant' as ScrollBehavior })
  );
  await page.waitForTimeout(400);

  const horizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(horizontalScroll).toBe(false);
});
```

- [ ] **Step 2: Run**

```bash
npm run test:e2e -- --project=chromium-mobile mobile-viewport.spec.ts
```

Expected: 3 passes.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/mobile-viewport.spec.ts
git commit -m "test(mobile): hero sizing, canvas paint, variant, and no horizontal overflow"
```

---

## Task 21: Full test sweep + final smoke

- [ ] **Step 1: Run all specs against both projects**

```bash
npm run test:e2e
```

Expected: all specs pass on `chromium-desktop` and `chromium-mobile`.

- [ ] **Step 2: Final manual walkthrough**

```bash
npm run dev
```

Confirm:

- Hero loads with frame 1 + headline overlay.
- Scroll pins the hero, scrubs frames smoothly, fades overlay within ~20% of pin.
- Sticky nav appears after hero with logo + CTA legible against bg.
- "Join Waitlist" CTA scrolls to waitlist.
- How It Works (3 cards) and Why It Matters (3 stat callouts) look right in brand colors.
- Submit valid email → success state shown.
- Mobile emulator (Pixel 7): hero ≈ 100svh, no horizontal overflow, frames stream.
- DevTools "Slow 4G" reload: frame 1 still appears immediately.
- DevTools "prefers-reduced-motion: reduce": hero is a static last-frame poster, headline visible.

- [ ] **Step 3: No commit needed if everything passed.** If anything was tweaked, commit those fixes:

```bash
git add -A
git commit -m "fix: <describe whatever was tweaked>"
```

---

## Task 22: `CLAUDE.md` agent notes + deferred-work doc

**Files:**

- Create: `CLAUDE.md`

- [ ] **Step 1: Create the doc**

````markdown
# Visionaryth Web — agent notes

## Stack
Next.js 15 (App Router), TypeScript, Tailwind v4 (CSS-first via `@theme`), Poppins via `next/font`, GSAP 3 + ScrollTrigger, zod, Playwright.

## Brand tokens
- Background: `#D6EFFF` (`--color-bg`)
- Accent: `#31A2FF` (`--color-accent`)
- Text: `#000` (`--color-ink`)
- Font family: Poppins (`--font-poppins`)

Defined in `app/globals.css` under `@theme`. Use `var(--color-accent)` etc. in components — never hard-code the hex values again.

## Frame extraction
The hero scroll animation is driven by WebP frame sequences in `public/frames/{desktop,mobile}/`, generated by `scripts/extract-frames.sh` (requires ffmpeg) from `public/Scroll-Animation-Video.mp4`.

To regenerate after replacing the source MP4:
1. `npm run extract-frames`
2. Update `lib/frames.ts` `FRAME_COUNTS` with the new counts (printed at the end of the script).

Frames are committed as static assets so deploys don't need ffmpeg. If we ever want to stop committing them: add ffmpeg as a build-time install on Vercel + run `extract-frames.sh` in a `prebuild` script.

## Hero animation invariants
- Single `ScrollTrigger` in `components/Hero.tsx` pins the hero AND drives both the canvas frame index AND the overlay opacity from one `onUpdate`. Do NOT split this into two ScrollTriggers — they desync subtly on iOS Safari.
- Hero uses `100svh`, not `100vh`, to avoid iOS Safari toolbar resize during pinning.
- `prefers-reduced-motion` users skip the pin entirely and see only the last frame (full-opacity overlay stays visible).
- Saved-data / 2g users also fall back to the last-frame poster.
- Canvas DPR is capped at 2 to keep memory under control on high-density mobile.

## Deferred — waitlist backend
`app/api/waitlist/route.ts` is currently a stub that validates with zod and `console.log`s the email. To wire real signups via Resend:

1. `npm install resend`
2. Add to `.env.local`:
   ```
   RESEND_API_KEY=...
   WAITLIST_TO_EMAIL=hello@yourdomain.com
   ```
3. In the route handler, replace the `console.log` line with:
   ```ts
   import { Resend } from 'resend';
   if (!process.env.RESEND_API_KEY || !process.env.WAITLIST_TO_EMAIL) {
     console.log('[waitlist:dev]', parsed.data.email);
     return Response.json({ ok: true, dev: true });
   }
   const resend = new Resend(process.env.RESEND_API_KEY);
   const { error } = await resend.emails.send({
     from: 'Visionaryth <onboarding@resend.dev>',
     to: process.env.WAITLIST_TO_EMAIL,
     subject: 'New waitlist signup',
     text: `Email: ${parsed.data.email}`,
     replyTo: parsed.data.email,
   });
   if (error) return Response.json({ ok: false, error: 'send_failed' }, { status: 502 });
   return Response.json({ ok: true });
   ```
4. Add a simple in-memory rate limiter (`Map<ip, { count, windowStart }>`, ~5 req / 10 min) ahead of validation. Swap to Upstash/Vercel KV when we have real traffic.
5. Decide on persistence beyond email — Vercel KV append, Supabase row, or Google Sheet via webhook.
6. For prod: verify a real sending domain in Resend (e.g. `mail.visionaryth.com`) and replace the `from` address.

## Other deferred items
- OG image (static, derived from the end frame).
- Analytics (Vercel Analytics or Plausible).
- Verified email-sending domain.
- Team / About section (deliberately excluded from v1).

## Tests
- E2E: `npm run test:e2e` (boots `next dev` automatically; runs both desktop + mobile projects).
- Specs live in `tests/e2e/`.
- Mock `/api/waitlist` via `page.route('**/api/waitlist', ...)` to keep tests offline.

## Type checking
- `npm run typecheck`

## Spec & plan
- Design spec: `docs/superpowers/specs/2026-05-08-visionaryth-landing-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-08-visionaryth-landing.md`
````

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md with stack, invariants, and deferred backend"
```

---

## Task 23: README

**Files:**

- Create: `README.md`

- [ ] **Step 1: Create the README**

````markdown
# Visionaryth — landing page

A single-page marketing site for Visionaryth, a webcam-based screen-habit coach for kids' eye health.

## Develop

```bash
npm install
sudo apt-get install -y ffmpeg     # one-time, for frame extraction
npm run extract-frames             # one-time after cloning
npm run dev                        # http://localhost:3000
```

## Test

```bash
npm run test:e2e
```

## Build

```bash
npm run build
npm start
```

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind v4 · GSAP ScrollTrigger · Playwright.

See `CLAUDE.md` for invariants and deferred work, and `docs/superpowers/` for the design spec and implementation plan.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README"
```

---

## Self-review

(Run before locking the plan.)

- **Spec coverage** — every section in `docs/superpowers/specs/2026-05-08-visionaryth-landing-design.md` maps to ≥ 1 task:
  - Architecture & file tree → Tasks 1, 2, 5, 7, 8, 10–15
  - Scroll animation pipeline (build + runtime) → Tasks 3, 4, 7, 8, 10
  - GSAP setup invariants → Task 10
  - Mobile-specific design (100svh, variant, fallback) → Tasks 7, 8, 10, 20
  - Sticky nav placement → Task 11
  - HowItWorks / WhyItMatters → Tasks 12, 13
  - Waitlist UI + stub route → Tasks 14, 15
  - Tailwind v4 + Poppins → Task 5
  - Verification (Playwright e2e + manual smoke) → Tasks 16–21
  - Deferred docs in CLAUDE.md → Task 22
- **Placeholders** — `__DESKTOP__` / `__MOBILE__` in `lib/frames.ts` (Task 7) are intentional and explicitly tied to counts recorded in Task 4 Step 4. No other placeholders.
- **Type consistency** — `FrameVariant`, `FRAME_COUNTS`, `frameURL`, `detectVariant`, `shouldUseStaticFallback` (Task 7) are consumed by `createFrameController` (Task 8) and `Hero.tsx` (Task 10) with matching signatures. `waitlistSchema` (Task 14) is consumed by `WaitlistForm` (Task 15) with the same shape.
- **data-testids referenced in tests** (Tasks 17–20) are all introduced in component tasks: `hero` (Task 10), `hero-canvas` (Task 10), `hero-overlay` (Task 10), `sticky-nav` (Task 11), `nav-cta` (Task 11), `how-it-works` (Task 12), `why-it-matters` (Task 13), `waitlist` (Task 15), `waitlist-form` (Task 15), `waitlist-email` (Task 15), `waitlist-submit` (Task 15), `waitlist-success` (Task 15), `waitlist-error` (Task 15). ✓

---

## Execution choice

Plan complete and saved to `docs/superpowers/plans/2026-05-08-visionaryth-landing.md`. Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task with two-stage review between tasks. Best for this plan because tasks have clean seams (scaffold → frames → hero → nav → sections → form → tests → docs). Uses `superpowers:subagent-driven-development`.
2. **Inline Execution** — Execute tasks in this session, batched with checkpoints for your review. Lower setup overhead but my context fills up faster on a 23-task plan. Uses `superpowers:executing-plans`.
