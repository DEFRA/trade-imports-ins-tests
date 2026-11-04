import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type AddressDocument } from '@domain/ins/models/db/address-document';
import { addressTypes, addressUses } from '@domain/shared/constants/address-types';
import { originOrConsignorTab } from '@domain/ins/constants/address-book-types';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Address book persistence round-trip', { tag: '@mongodb' }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('a created address persists with its full Standard Address Block, its address type and its ticked uses', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    const createdName = `Persistence Test Farm ${Date.now()}`;
    const addressBlockWithoutCountry = {
      name: createdName,
      addressLine1: '1 Test Lane',
      addressLine2: 'Unit 2',
      townOrCity: 'Carlisle',
      county: 'Cumbria',
      postcode: 'CA1 1AA',
      phone: '01228 555 0101',
      email: 'farm@example.co.uk',
    };

    await insJourney.addAddressFromList(
      { ...addressBlockWithoutCountry, country: 'United Kingdom' },
      { uses: [addressUses.placeOfOrigin, addressUses.consignor] },
    );
    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrl(originOrConsignorTab));

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<AddressDocument>('trade-imports-address-book', 'addresses');
      await expect.poll(() => collection.countDocuments({ name: createdName }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ name: createdName }).toArray();
      expect(doc).toMatchObject({
        ...addressBlockWithoutCountry,
        countryCode: 'GB',
        addressType: addressTypes.originOrConsignor,
        uses: [addressUses.placeOfOrigin, addressUses.consignor],
      });
    } finally {
      await client.close();
    }
  });
});
