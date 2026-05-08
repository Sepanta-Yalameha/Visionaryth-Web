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
