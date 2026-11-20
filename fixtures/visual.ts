import type { Browser, Locator } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import type { ViewHeader } from '@page-objects/shared/view-header';
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

export async function pinText(locator: Locator, text: string): Promise<void> {
  await locator.evaluate((element, pinned) => {
    element.textContent = pinned;
  }, text);
}

export async function pinDateText(locator: Locator): Promise<void> {
  await pinText(locator, '1 November 2026');
}

export async function pinDraftViewHeader(viewHeader: ViewHeader): Promise<void> {
  await pinText(viewHeader.reference, 'GBN-AG-26-AAAAAA');
  await pinText(viewHeader.notificationReferenceValue, 'GBN-AG-26-AAAAAA');
  await pinText(viewHeader.dateCreated, 'Date created: 1 January 2026');
}
