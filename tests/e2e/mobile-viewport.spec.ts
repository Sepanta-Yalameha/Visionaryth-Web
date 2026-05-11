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

test('mobile: canvas variant is "mobile"', async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-mobile', 'variant detection depends on mobile viewport');
  await page.goto('/');
  await page.waitForTimeout(1000);
  const variant = await page.getByTestId('hero-canvas').getAttribute('data-variant');
  expect(variant).toBe('mobile');
});

test('mobile: nav fits one row, no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(
    () => window.scrollTo({ top: window.innerHeight * 6.5, behavior: 'instant' as ScrollBehavior })
  );
  await page.waitForTimeout(400);

  const horizontalScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  expect(horizontalScroll).toBe(false);
});
