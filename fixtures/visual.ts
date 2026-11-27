import type { Locator } from '@playwright/test';
import { test as base, expect } from '@fixtures';
import type { ViewHeader } from '@page-objects/shared/view-header';

export const test = base.extend<{ skipOffLinux: void }>({
  skipOffLinux: [
    // eslint-disable-next-line no-empty-pattern
    async ({}, use, testInfo) => {
      testInfo.skip(process.platform !== 'linux', 'Visual baselines are Linux-only. Update them with npm run test:visual:update:linux.');
      await use();
    },
    { auto: true },
  ],
});

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
