import { expect } from '@fixtures';
import type { Page, Locator } from '@playwright/test';

export const expectAddressBookList = async ({
  pages: { page },
  insPages: { addressBookList },
}: {
  pages: { page: Page };
  insPages: { addressBookList: { expectedUrl: string; heading: Locator } };
}): Promise<void> => {
  await expect(page).toHaveURL(new RegExp(`${addressBookList.expectedUrl}$`));
  await expect(addressBookList.heading).toBeVisible();
  await expect(page.getByText('Page not found')).toHaveCount(0);
};
