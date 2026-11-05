import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type AddressDocument } from '@domain/ins/models/db/address-document';
import { addressRoles } from '@domain/shared/constants/address-types';
import { originOrConsignorTab } from '@domain/ins/constants/address-book-types';
import { addFormAddressWithLineTwoAndCounty, addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Address book persistence round-trip', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('a created address persists with its full Standard Address Block and its ticked roles', async ({ pages, insPages, insJourney }) => {
    const createdName = `Persistence Test Farm ${Date.now()}`;
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(createdName, 'United Kingdom'), {
      roles: [addressRoles.placeOfOrigin, addressRoles.consignor],
    });
    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrl(originOrConsignorTab));

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<AddressDocument>('trade-imports-address-book', 'addresses');
      await expect.poll(() => collection.countDocuments({ name: createdName }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ name: createdName }).toArray();
      expect(doc).toMatchObject({
        ...addressWithLineTwoAndCounty(createdName),
        countryCode: 'GB',
        roles: [addressRoles.placeOfOrigin, addressRoles.consignor],
      });
    } finally {
      await client.close();
    }
  });
});
