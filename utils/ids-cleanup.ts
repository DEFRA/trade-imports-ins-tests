import { test } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';

export type AddressBookApiFixtureName = 'addressBookApi' | 'isolatedOrganisationAddressBookApi';

/** Registers an `afterEach` that calls `deleteOne` for every id pushed onto the returned array. */
export const idsDeletedAfterEachTest = (
  deleteOne: (id: string, api: AddressBookApiClient) => Promise<unknown>,
  apiFixtureName: AddressBookApiFixtureName,
): string[] => {
  const createdIds: string[] = [];
  test.afterEach(async ({ addressBookApi, isolatedOrganisationAddressBookApi }) => {
    const api = apiFixtureName === 'addressBookApi' ? addressBookApi : isolatedOrganisationAddressBookApi;
    for (const id of createdIds.splice(0)) {
      await deleteOne(id, api);
    }
  });
  return createdIds;
};
