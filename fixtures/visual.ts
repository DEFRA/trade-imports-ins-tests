import type { Browser, Locator } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import { launchLegacyScrollersBrowser } from '@utils/playwright/legacy-scrollers-browser';

const legacyScrollersTest = base.extend<object, { browser: Browser }>({
  browser: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const legacyScrollersBrowser = await launchLegacyScrollersBrowser();
      await use(legacyScrollersBrowser.browser);
      await legacyScrollersBrowser.close();
    },
    { scope: 'worker' },
  ],
});

export const test = process.platform === 'darwin' ? legacyScrollersTest : base;

export { expect };

export async function pinDateText(locator: Locator): Promise<void> {
  await locator.evaluate((element) => {
    element.textContent = '1 November 2026';
  });
}
