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
