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
  await page.waitForTimeout(1000);

  const pinPx = await page.evaluate(() => window.innerHeight * 8);

  for (const t of SCROLL_STEPS) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }), t * pinPx);
    await page.waitForTimeout(1000);
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
  await page.waitForTimeout(1000);

  const fadedOpacity = await overlay.evaluate(
    (el) => Number(getComputedStyle(el).opacity)
  );
  expect(fadedOpacity).toBeLessThan(0.1);
});
