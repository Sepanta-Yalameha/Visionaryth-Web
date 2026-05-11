import { FRAME_COUNTS, frameURL, type FrameVariant } from './frames';

const EAGER_COUNT = 10;
const POOL_SIZE = 4;

export type FrameController = {
  drawAt(progress: number): void;
  destroy(): void;
};

export function createFrameController(
  canvas: HTMLCanvasElement,
  variant: FrameVariant
): FrameController {
  const total = FRAME_COUNTS[variant];
  const ctx = canvas.getContext('2d');
  if (!ctx) return { drawAt() {}, destroy() {} };

  const images: (HTMLImageElement | null)[] = new Array(total).fill(null);
  let lastDrawn = -1;
  let requested = 0;
  let cancelled = false;

  const sizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(cw * dpr));
    canvas.height = Math.max(1, Math.round(ch * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const isLoaded = (i: number) => {
    const img = images[i];
    return !!img && img.naturalWidth > 0;
  };

  // Search outward from `i` for the nearest frame already in memory, so a fast
  // scroll never strands the canvas — we always render the closest available
  // frame and let drawAt redraw as the loader catches up.
  const closestLoaded = (i: number): number => {
    if (isLoaded(i)) return i;
    for (let r = 1; r < total; r++) {
      if (i - r >= 0 && isLoaded(i - r)) return i - r;
      if (i + r < total && isLoaded(i + r)) return i + r;
    }
    return -1;
  };

  const render = (i: number) => {
    const img = images[i];
    if (!img) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const ratio = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    lastDrawn = i;
  };

  const repaint = () => {
    const i = closestLoaded(requested);
    if (i < 0 || i === lastDrawn) return;
    render(i);
  };

  const loadOne = (i: number) =>
    new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = frameURL(variant, i);
      img.onload = () => {
        if (cancelled) return resolve();
        images[i] = img;
        // Paint when the loader catches the user: either we still haven't
        // drawn anything, or this is the exact frame the user is requesting.
        if (lastDrawn < 0 || i === requested) render(i);
        resolve();
      };
      img.onerror = () => resolve();
    });

  sizeCanvas();

  const eager: Promise<void>[] = [];
  for (let i = 0; i < Math.min(EAGER_COUNT, total); i++) eager.push(loadOne(i));
  Promise.all(eager).then(() => {
    let next = EAGER_COUNT;
    const workers = Array.from({ length: POOL_SIZE }, async () => {
      while (!cancelled && next < total) await loadOne(next++);
    });
    Promise.all(workers);
  });

  const onResize = () => {
    sizeCanvas();
    if (lastDrawn >= 0) {
      const i = lastDrawn;
      lastDrawn = -1;
      render(i);
    }
  };
  window.addEventListener('resize', onResize);

  return {
    drawAt(progress: number) {
      const clamped = Math.min(1, Math.max(0, progress));
      requested = Math.min(total - 1, Math.round(clamped * (total - 1)));
      repaint();
    },
    destroy() {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    },
  };
}
