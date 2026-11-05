import { expect } from '@fixtures';
import type { Page } from '@playwright/test';
import type { InsAddressBookListPage } from '@page-objects/ins/address-book/list-page';
import { addressBookTabLabels } from '@domain/ins/constants/address-book-types';

export const expectAddressBookList = async ({
  pages: { page },
  insPages: { addressBookList },
}: {
  pages: { page: Page };
  insPages: { addressBookList: Pick<InsAddressBookListPage, 'listUrlPattern' | 'heading'> };
}): Promise<void> => {
  await expect(page).toHaveURL(addressBookList.listUrlPattern);
  await expect(addressBookList.heading).toBeVisible();
};

export const expectSearchedListLinks = async (
  addressBookList: InsAddressBookListPage,
  ...linksAfterClearSearch: string[]
): Promise<void> => {
  await expect(addressBookList.mainLinks).toHaveText([...addressBookTabLabels, 'Clear search', ...linksAfterClearSearch]);
};

export const expectNoMatchesListed = async (addressBookList: InsAddressBookListPage): Promise<void> => {
  await expect(addressBookList.resultsLine).toHaveText('Showing 0 of 0');
  await expect(addressBookList.columnHeaders).toHaveText(['Name', 'Type', 'Address', 'Country', 'Action']);
  await expect(addressBookList.bodyRows).toHaveCount(0);
  await expectSearchedListLinks(addressBookList);
};
