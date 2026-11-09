import type { AddressBookApiClient, TransporterRecord } from '@adapters/http/address-book-api-client';
import { idsDeletedAfterEachTest, type AddressBookApiFixtureName } from './ids-cleanup';

export const transporterIdsDeletedAfterEachTest = (apiFixtureName: AddressBookApiFixtureName = 'addressBookApi'): string[] =>
  idsDeletedAfterEachTest((id, api) => api.deleteTransporter(id), apiFixtureName);

/** Looks up a transporter saved under `name`, pushes its id onto `createdTransporterIds` so it is deleted after the test, and returns it. */
export const trackTransporterForDeletion = async (
  addressBookApi: AddressBookApiClient,
  name: string,
  createdTransporterIds: string[],
): Promise<TransporterRecord> => {
  const stored = await addressBookApi.findTransporterByName(name);
  createdTransporterIds.push(stored.id);
  return stored;
};
