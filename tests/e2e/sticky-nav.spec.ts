import { test, expect } from '@playwright/test';

test('sticky nav appears after hero and CTA scrolls to waitlist', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByTestId('sticky-nav');

  await page.waitForTimeout(300);

  const pastHero = await page.evaluate(() => window.innerHeight * 4.5);
  await page.evaluate(
    (y) => window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }),
    pastHero
  );
  await page.waitForTimeout(400);

  await expect(nav).toBeVisible();
  const navTop = await nav.evaluate((el) => el.getBoundingClientRect().top);
  expect(navTop).toBeLessThanOrEqual(2);

  await page.getByTestId('nav-cta').click();

  // Wait until scroll settles (smooth scroll finishes or page is at max scroll)
  await page.waitForFunction(() => {
    const el = document.querySelector('#waitlist') as HTMLElement;
    if (!el) return false;
    const top = el.getBoundingClientRect().top;
    const vh = window.innerHeight;
    // #waitlist is visible in viewport (near top or page is at max scroll)
    return top >= 0 && top < vh;
  }, { timeout: 3000 });

  const waitlistTop = await page.evaluate(() => {
    const el = document.querySelector('#waitlist') as HTMLElement;
    return el.getBoundingClientRect().top;
  });
  expect(waitlistTop).toBeGreaterThanOrEqual(0);
  expect(waitlistTop).toBeLessThan(page.viewportSize()!.height);
});
