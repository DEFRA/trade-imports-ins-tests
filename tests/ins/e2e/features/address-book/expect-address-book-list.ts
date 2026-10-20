import { expect } from '@fixtures';
import type { Page, Locator } from '@playwright/test';

export async function expectAddressBookList({
  pages,
  insPages,
}: {
  pages: { page: Page };
  insPages: { addressBookList: { expectedUrl: string; heading: Locator } };
}): Promise<void> {
  await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
  await expect(insPages.addressBookList.heading).toBeVisible();
  await expect(pages.page.getByText('Page not found')).toHaveCount(0);
}
