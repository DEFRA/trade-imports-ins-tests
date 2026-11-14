import { randomUUID } from 'node:crypto';
import { test, expect } from '@fixtures';
import type { AddressBookRequest } from '@adapters/http/address-book-api-client';
import { addressRoles } from '@domain/shared/constants/address-types';
import type { PlantsNotificationViewPage } from '@page-objects/plants/notification-view-page';

type AddressFields = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  townOrCity: string;
  county: string;
  postcode: string;
};

async function expectNameAndAddressRows(view: PlantsNotificationViewPage, cardTitle: string, record: AddressFields) {
  await expect(view.rowKeys(cardTitle)).toHaveText(['Name', 'Address']);
  await expect(view.row(cardTitle, 'Name').getByRole('definition')).toHaveText(record.name);
  await expect(view.row(cardTitle, 'Address').getByRole('definition')).toHaveText(
    [record.addressLine1, record.addressLine2, record.townOrCity, record.county, record.postcode, 'United Kingdom'].join('\n'),
    { useInnerText: true },
  );
}

test.describe('Addresses are copied, not linked', () => {
  test('picking a record for a role with no address reads its name, address lines and country back on the review page, with no telephone or email row', async ({
    plantsPages,
    plantsJourney,
    addressBookApi,
  }) => {
    const record = {
      name: `Full Detail Farm ${randomUUID()}`,
      addressLine1: '12 Primary Row',
      addressLine2: 'Secondary Wing',
      townOrCity: 'Kendal',
      county: 'Westmorland',
      postcode: 'LA9 4QQ',
      countryCode: 'GB',
      phone: '01539 555 0105',
      email: 'full.detail@example.co.uk',
      roles: [addressRoles.placeOfDestination],
    } satisfies AddressBookRequest;
    const address = await addressBookApi.createAddress(record);

    await plantsJourney.completeNotification(addressBookApi, { existing: address });

    await expectNameAndAddressRows(plantsPages.notificationView, 'Place of destination', record);
    await expectNameAndAddressRows(plantsPages.notificationView, 'Contact', record);
  });
});
