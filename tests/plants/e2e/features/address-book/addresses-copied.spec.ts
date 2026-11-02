import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { Locator } from '@playwright/test';

type AddressFields = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
  phone: string;
  email: string;
};

async function expectEveryField(card: Locator, record: AddressFields) {
  await expect(card).toContainText(record.name);
  await expect(card).toContainText(record.addressLine1);
  await expect(card).toContainText(record.addressLine2);
  await expect(card).toContainText(record.townOrCity);
  await expect(card).toContainText(record.county);
  await expect(card).toContainText(record.postcode);
  await expect(card).toContainText('United Kingdom');
  await expect(card).toContainText(record.phone);
  await expect(card).toContainText(record.email);
}

test.describe('Addresses are copied, not linked', () => {
  test('picking a record for a role with no address shows every field of that record on the review page', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    // Every field set, each value distinct, so each assert proves its own field was copied.
    const record = {
      name: `Full Detail Farm ${randomUUID()}`,
      addressLine1: '12 Primary Row',
      addressLine2: 'Secondary Wing',
      townOrCity: 'Kendal',
      county: 'Westmorland',
      postcode: 'LA9 4QQ',
      phone: '01539 555 0105',
      email: 'full.detail@example.co.uk',
    };
    const address = await addressBookApi.createAddress({ ...record, countryCode: 'GB' });

    // The same record is picked for the place of destination and the contact address.
    await plantsJourney.completeNotification(addressBookApi, { existing: address });

    await expectEveryField(plantsPages.notificationView.card('Place of destination'), record);
    await expectEveryField(plantsPages.notificationView.card('Contact'), record);
  });
});
