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
