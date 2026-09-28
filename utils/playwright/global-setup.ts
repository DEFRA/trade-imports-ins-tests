import { request } from '@playwright/test';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { ensureE2eAddressBook } from '@domain/fixtures/e2e-address-book';

/**
 * Seeds the shared journey address-book fixtures once via the address-book API,
 * before any worker starts — so parallel workers never race-create the same name.
 *
 * Address-feature specs that do not rely on those names still inject their own
 * unique records in-test (see addresses-live-link / addresses-picker).
 */
async function globalSetup(): Promise<void> {
  const apiRequest = await request.newContext();
  try {
    await ensureE2eAddressBook(new AddressBookApiClient(apiRequest));
  } finally {
    await apiRequest.dispose();
  }
}

export default globalSetup;
