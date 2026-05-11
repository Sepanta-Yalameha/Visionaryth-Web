'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createFrameController } from '@/lib/scroll-frames';
import { detectVariant } from '@/lib/frames';

const PIN_MULTIPLIER = 3;
const FADE_END_PROGRESS = 0.2;

export default function Hero() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    setShowDebug(
      process.env.NODE_ENV !== 'production' ||
        new URLSearchParams(window.location.search).has('debug')
    );
  }, []);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!scroller || !canvas || !overlay) return;

    const variant = detectVariant();
    canvas.dataset.variant = variant;

    const writeDebug = (progress = 0, scrollY = 0) => {
      const el = debugRef.current;
      if (!el) return;
      el.textContent =
        `variant=${variant} progress=${progress.toFixed(3)} scrollY=${Math.round(scrollY)}`;
    };

    const controller = createFrameController(canvas, variant);
    writeDebug();

    let rafPending = false;
    let lastProgress = -1;

    const update = () => {
      rafPending = false;
      const rect = scroller.getBoundingClientRect();
      const total = scroller.offsetHeight - window.innerHeight;
      const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;

      if (progress !== lastProgress) {
        lastProgress = progress;
        controller.drawAt(progress);
        const fade = Math.max(0, 1 - progress / FADE_END_PROGRESS);
        overlay.style.opacity = String(fade);
        overlay.style.transform = `translateY(${-20 * (1 - fade)}px)`;
      }
      writeDebug(progress, window.scrollY);
    };

    const onScroll = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      controller.destroy();
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      data-testid="hero-scroller"
      className="relative w-full"
      style={{ height: `${(PIN_MULTIPLIER + 1) * 100}svh` }}
    >
      <section
        ref={stickyRef}
        data-testid="hero"
        className="sticky top-0 w-full overflow-hidden"
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
          style={{ opacity: 1, transform: 'translateY(0)', willChange: 'opacity, transform' }}
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
      {showDebug && (
        <div
          ref={debugRef}
          className="pointer-events-none fixed bottom-2 left-2 z-50 max-w-[90vw] truncate rounded bg-black/85 px-2 py-1 font-mono text-[10px] text-white"
        >
          (debug)
        </div>
      )}
    </div>
  );
}
