import { CONSIGNMENT_ADDRESSES } from '@domain/animals/constants/consignment-addresses-page';
import { test, expect } from '@fixtures';
import { heldAsConsignee, heldAsPlaceOfOrigin } from '@domain/shared/constants/address-types';
import { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';

test.describe('Same-as shortcuts fill a party from a paired party', () => {
  test(
    'shows the shortcut only on the Consignor, Importer and Place of destination sections, and pressing each fills it with the full address of the picked place of origin or consignee, leaving no button and offering the record to no other picker',
    { tag: '@address-book' },
    async ({ animalsJourney, pages, animalsPages, addressBookApi }) => {
      const stamp = Date.now();
      const originRecord = {
        name: `Same-As Origin Farm ${stamp}`,
        addressLine1: '4 Origin Way',
        townOrCity: 'Carlisle',
        postcode: 'CA1 4DD',
      };
      const consigneeRecord = {
        name: `Same-As Consignee Ltd ${stamp}`,
        addressLine1: '5 Consignee Road',
        townOrCity: 'Carlisle',
        postcode: 'CA1 5EE',
      };
      await addressBookApi.createAddress({
        ...originRecord,
        ...heldAsPlaceOfOrigin,
        countryCode: 'GB',
        phone: '01228 555 0110',
        email: 'origin@example.co.uk',
      });
      await addressBookApi.createAddress({
        ...consigneeRecord,
        ...heldAsConsignee,
        countryCode: 'GB',
        phone: '01228 555 0111',
        email: 'consignee@example.co.uk',
      });

      await animalsJourney.toConsignmentAddressesWithSourcePartiesChosen([
        ['Place of origin', originRecord.name],
        ['Consignee', consigneeRecord.name],
      ]);

      await expect(animalsPages.addresses.sameAsParty('Consignor')).toBeVisible();
      await expect(animalsPages.addresses.sameAsParty('Importer')).toBeVisible();
      await expect(animalsPages.addresses.sameAsParty('Place of destination')).toBeVisible();
      await expect(animalsPages.addresses.partySection('Place of origin').getByRole('button')).toHaveCount(0);
      await expect(animalsPages.addresses.partySection('Consignee').getByRole('button')).toHaveCount(0);

      const expectedOriginText = AnimalsAddressesPage.expectedAddressText({ ...originRecord, country: 'United Kingdom' });
      await animalsPages.addresses.sameAsParty('Consignor').click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyAddressLines('Consignor')).toHaveText(expectedOriginText, { useInnerText: true });
      await expect(animalsPages.addresses.sameAsParty('Consignor')).toHaveCount(0);

      const expectedConsigneeText = AnimalsAddressesPage.expectedAddressText({ ...consigneeRecord, country: 'United Kingdom' });
      await animalsPages.addresses.sameAsParty('Importer').click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyAddressLines('Importer')).toHaveText(expectedConsigneeText, { useInnerText: true });

      await animalsPages.addresses.sameAsParty('Place of destination').click();
      await expect(animalsPages.addresses.heading).toBeVisible();
      await expect(animalsPages.addresses.partyAddressLines('Place of destination')).toHaveText(expectedConsigneeText, {
        useInnerText: true,
      });
      await expect(pages.page.getByRole('button', { name: /^Same as /i })).toHaveCount(0);

      await animalsPages.addresses.changeParty('Consignor').click();
      await expect(animalsPages.consignorSelection.party(originRecord.name)).toHaveCount(0);
    },
  );

  test(
    'keeps the consignor showing the place-of-origin record it was filled from after the place of origin is changed to a different record',
    { tag: '@address-book' },
    async ({ animalsJourney, animalsPages, addressBookApi }) => {
      const stamp = Date.now();
      const firstOrigin = { name: `First Origin ${stamp}`, addressLine1: '1 First Lane', townOrCity: 'Carlisle', postcode: 'CA1 6FF' };
      const secondOrigin = { name: `Second Origin ${stamp}`, addressLine1: '2 Second Lane', townOrCity: 'Carlisle', postcode: 'CA1 7GG' };
      await addressBookApi.createAddress({
        ...firstOrigin,
        ...heldAsPlaceOfOrigin,
        countryCode: 'GB',
        phone: '01228 555 0112',
        email: 'first-origin@example.co.uk',
      });
      await addressBookApi.createAddress({
        ...secondOrigin,
        ...heldAsPlaceOfOrigin,
        countryCode: 'GB',
        phone: '01228 555 0113',
        email: 'second-origin@example.co.uk',
      });

      await animalsJourney.toConsignmentAddressesWithSourcePartiesChosen([['Place of origin', firstOrigin.name]]);
      await animalsPages.addresses.sameAsParty('Consignor').click();
      await expect(animalsPages.addresses.heading).toBeVisible();

      await animalsPages.addresses.changeParty('Place of origin').click();
      await animalsPages.placeOfOriginSelection.select(secondOrigin.name);
      await animalsPages.placeOfOriginSelection.saveAndContinue.click();
      await expect(animalsPages.addresses.heading).toBeVisible();

      const expectedFirstOriginText = AnimalsAddressesPage.expectedAddressText({ ...firstOrigin, country: 'United Kingdom' });
      await expect(animalsPages.addresses.partyAddressLines('Consignor')).toHaveText(expectedFirstOriginText, { useInnerText: true });
    },
  );

  test(
    "shows the importer filled from the consignee on the review with the consignee record's name, address lines and country and no telephone or email",
    { tag: '@address-book' },
    async ({ animalsJourney, animalsPages, addressBookApi }) => {
      const stamp = Date.now();
      const consigneeRecord = {
        name: `Full Detail Consignee ${stamp}`,
        addressLine1: '21 Detail Row',
        addressLine2: 'Unit 2',
        townOrCity: 'Kendal',
        county: 'Westmorland',
        postcode: 'LA9 5RR',
      };
      await addressBookApi.createAddress({
        ...consigneeRecord,
        ...heldAsConsignee,
        countryCode: 'GB',
        phone: '01539 555 0199',
        email: 'full.detail.consignee@example.co.uk',
      });

      await animalsJourney.toConsignmentAddressesWithSourcePartiesChosen([['Consignee', consigneeRecord.name]]);
      await animalsPages.addresses.sameAsParty('Importer').click();
      await expect(animalsPages.addresses.heading).toBeVisible();

      const referenceNumber = animalsPages.addresses.referenceNumberFromUrl();
      await animalsPages.notificationView.open(referenceNumber);
      const importerValue = animalsPages.notificationView.partyRow(CONSIGNMENT_ADDRESSES, 'Importer').getByRole('definition').first();
      await expect(importerValue).toHaveText(
        [
          consigneeRecord.name,
          consigneeRecord.addressLine1,
          consigneeRecord.addressLine2,
          consigneeRecord.townOrCity,
          consigneeRecord.county,
          consigneeRecord.postcode,
          'United Kingdom',
        ].join(' '),
        { useInnerText: true },
      );
    },
  );
});
