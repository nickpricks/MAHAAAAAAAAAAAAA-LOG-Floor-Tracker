/**
 * Theme Visual E2E Test
 *
 * Uses theme preview URLs (/{theme-id}) — no Firebase entries created.
 *
 * Run:
 *   bun run dev --port 3005       (in one terminal)
 *   bun run test:themes           (headless)
 *   bun run test:themes:debug     (visible browser + inspector)
 *
 * Screenshots saved to e2e/screenshots/
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3005';
const THEMES = [
  'summit-instrument',
  'night-city-elevator',
  'deep-mariana',
  'night-city-apartment',
  'industrial-furnace',
  'corporate-glass',
];

test.describe('Theme Visual Tests', () => {
  for (const theme of THEMES) {
    test(`${theme}`, async ({ page }) => {
      // Theme preview URLs skip Firebase — no data pollution
      await page.addInitScript(() => {
        localStorage.setItem('maha_username_prompted', 'true');
      });

      await page.goto(`${BASE_URL}/${theme}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Dismiss warning if visible
      const closeBtn = page.getByText('✕');
      if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await closeBtn.click();
        await page.waitForTimeout(300);
      }

      // Verify theme class applied
      const htmlClass = await page.locator('html').getAttribute('class');
      expect(htmlClass).toContain(`theme-${theme}`);

      // --- Tracker tab (default) ---
      await page.screenshot({ path: `e2e/screenshots/${theme}-tracker.png` });

      // Click UP 3 times
      const iconButtons = page.locator('button:has(svg)').filter({ hasNot: page.locator('span') });
      const upBtn = iconButtons.first();
      const downBtn = iconButtons.nth(1);

      for (let i = 0; i < 3; i++) {
        await upBtn.click();
        await page.waitForTimeout(400);
      }
      await page.screenshot({ path: `e2e/screenshots/${theme}-tracker-up.png` });

      // Click DOWN 2 times
      for (let i = 0; i < 2; i++) {
        await downBtn.click();
        await page.waitForTimeout(400);
      }

      // Rapid-fire stress test: UP DOWN UP DOWN... n times (n = random 10-100)
      const n = Math.floor(Math.random() * 91) + 10;
      await page.evaluate((count) => {
        const buttons = document.querySelectorAll<HTMLButtonElement>('button:has(svg)');
        const filteredBtns = [...buttons].filter(b => !b.textContent?.trim());
        const up = filteredBtns[0];
        const down = filteredBtns[1];
        if (!up || !down) return;
        for (let i = 0; i < count; i++) {
          if (i % 2 === 0) up.click();
          else down.click();
        }
      }, n);
      // Brief pause to let animations settle
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `e2e/screenshots/${theme}-tracker-stress.png` });

      // --- Stats tab ---
      await page.getByRole('button', { name: 'Stats' }).click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `e2e/screenshots/${theme}-stats.png` });

      // --- Help tab ---
      await page.getByRole('button', { name: 'Help' }).click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `e2e/screenshots/${theme}-help.png` });

      // --- Profile tab ---
      await page.getByRole('button', { name: /Profile/i }).click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: `e2e/screenshots/${theme}-profile.png` });

      // Back to Tracker for a few final random clicks
      await page.getByRole('button', { name: 'Tracker' }).click();
      await page.waitForTimeout(400);
      const finalClicks = Math.floor(Math.random() * 11);
      await page.evaluate((count) => {
        const buttons = [...document.querySelectorAll<HTMLButtonElement>('button:has(svg)')].filter(b => !b.textContent?.trim());
        const up = buttons[0];
        const down = buttons[1];
        if (!up || !down) return;
        for (let i = 0; i < count; i++) {
          (Math.random() > 0.5 ? up : down).click();
        }
      }, finalClicks);
      await page.waitForTimeout(500);

      // Pause for manual inspection in debug mode, auto-continue in headless
      if (process.env.PWDEBUG) {
        await page.pause();
      }
    });
  }
});
