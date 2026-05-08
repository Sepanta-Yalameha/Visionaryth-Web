export const FRAME_COUNTS = {
  desktop: 301,
  mobile: 241,
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
