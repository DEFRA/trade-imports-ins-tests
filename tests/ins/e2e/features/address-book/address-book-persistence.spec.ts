import { test, expect } from '@fixtures';
import { MongoDbClient } from '@adapters/db/mongodb-client';
import { type AddressDocument } from '@domain/models/db/address-document';
import { timeouts } from '@config/timeouts';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { type NewAddressDetails } from '@page-objects/ins/ins-address-book-add-page';

test.describe('Address book persistence round-trip', { tag: ['@integration', '@mongodb'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('the round-trip asserts on Mongo directly, which only the compose stack exposes');
  });

  test('a created address persists with its full Standard Address Block', async ({ pages }) => {
    const createdName = `Persistence Test Farm ${Date.now()}`;
    const details: NewAddressDetails = {
      name: createdName,
      addressLine1: '1 Test Lane',
      addressLine2: 'Unit 2',
      townOrCity: 'Carlisle',
      county: 'Cumbria',
      postcode: 'CA1 1AA',
      country: 'United Kingdom',
      phone: '01228 555 0101',
      email: 'farm@example.co.uk',
    };

    await pages.insAddressBookAdd.open();
    await pages.insAddressBookAdd.fill(details);
    await pages.insAddressBookAdd.save();
    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));

    const client = new MongoDbClient();
    try {
      await client.connect();
      const collection = client.collection<AddressDocument>('trade-imports-address-book', 'addresses');
      await expect.poll(() => collection.countDocuments({ name: createdName }), { timeout: timeouts.short }).toBe(1);

      const [doc] = await collection.find({ name: createdName }).toArray();
      expect(doc.addressLine2).toBe(details.addressLine2);
      expect(doc.county).toBe(details.county);
    } finally {
      await client.close();
    }
  });
});
