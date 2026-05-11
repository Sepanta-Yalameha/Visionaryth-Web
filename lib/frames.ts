export const FRAME_COUNTS = {
  desktop: 241,
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
