import { idsDeletedAfterEachTest, type AddressBookApiFixtureName } from './ids-cleanup';

export const addressIdsDeletedAfterEachTest = (apiFixtureName: AddressBookApiFixtureName): string[] =>
  idsDeletedAfterEachTest((id, api) => api.deleteAddress(id), apiFixtureName);
