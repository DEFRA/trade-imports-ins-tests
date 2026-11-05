import type { Locator } from '@playwright/test';
import { expect } from '@fixtures/a11y';
import type { A11yFixtures } from '@fixtures/a11y';

export const scanNextPage = async (linkNextPage: Locator, runA11yScan: A11yFixtures['runA11yScan']): Promise<void> => {
  await linkNextPage.click();
  await expect(linkNextPage.page()).toHaveURL(/[?&]page=2(?:&|$)/);
  await runA11yScan();
};
