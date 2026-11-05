import type { Locator } from '@playwright/test';
import { expect } from '@fixtures/a11y';
import type { A11yFixtures } from '@fixtures/a11y';

export const scanNextPage = async (nextPageLink: Locator, runA11yScan: A11yFixtures['runA11yScan']): Promise<void> => {
  await nextPageLink.click();
  await expect(nextPageLink.page()).toHaveURL(/[?&]page=2(?:&|$)/);
  await runA11yScan();
};
