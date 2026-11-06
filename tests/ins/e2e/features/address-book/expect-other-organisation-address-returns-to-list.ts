import { expect } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { expectAddressBookList } from './expect-address-book-list';
import { traderAddress } from '@domain/ins/constants/trader-address';

type AddressBookListPages = Parameters<typeof expectAddressBookList>[0];

export const expectOtherOrganisationAddressReturnsToList = async (
  {
    pages,
    insPages,
    isolatedOrganisationAddressBookApi,
  }: AddressBookListPages & { isolatedOrganisationAddressBookApi: AddressBookApiClient },
  openAddressPage: (addressId: string) => Promise<void>,
): Promise<void> => {
  const name = `Other Org Farm ${Date.now()}`;
  const created = await isolatedOrganisationAddressBookApi.createAddress(traderAddress(name));

  try {
    await openAddressPage(created.id);

    await expectAddressBookList({ pages, insPages });
    await expect(pages.page.getByText(name)).toHaveCount(0);
  } finally {
    await isolatedOrganisationAddressBookApi.deleteAddress(created.id);
  }
};
