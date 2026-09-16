import { test, expect } from '@playwright/test';

// Stage 0 skeleton: proves the Playwright + build + preview pipeline works.
// Full E2E coverage (permission flows, transport controls, axe scans) lands
// in Stage 5 per PLAN.md §7.
test('loads the app shell', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Weather Beats' }),
  ).toBeVisible();
});
