import { SET_BASES } from '@page-objects/base/sets';

import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import type { AddressesPage } from '@page-objects/notification/addresses-page';
import type { PartyPickerPage } from '@page-objects/notification/party-picker-page';

const PARTY_ADD_LINK_CASES: Array<{
  hubRole: Parameters<AddressesPage['addParty']>[0];
  picker: (pages: {
    addresses: AddressesPage;
    consignorSelection: PartyPickerPage;
    placeOfOriginSelection: PartyPickerPage;
    consigneeSelection: PartyPickerPage;
    importerSelection: PartyPickerPage;
    destinationSelection: PartyPickerPage;
  }) => PartyPickerPage;
}> = [
  { hubRole: 'Consignor or exporter', picker: (pages) => pages.consignorSelection },
  { hubRole: 'Place of origin', picker: (pages) => pages.placeOfOriginSelection },
  { hubRole: 'Consignee', picker: (pages) => pages.consigneeSelection },
  { hubRole: 'Importer', picker: (pages) => pages.importerSelection },
  { hubRole: 'Place of destination', picker: (pages) => pages.destinationSelection },
];

/**
 * The notification journey reads the address book and never writes to it directly.
 * Adding records is delegated to the INS frontend; these specs prove the journey
 * does not serve its own create page and links out with the handshake query.
 */
test.describe('Addresses are read-only in the journey', { tag: ['@integration'] }, () => {
  test.describe('party picker add link', () => {
    for (const { hubRole, picker } of PARTY_ADD_LINK_CASES) {
      test.describe(hubRole, () => {
        test.beforeEach(async ({ journey, pages }) => {
          await journey.startNotification();
          await journey.unlockSections();

          await pages.overview.task('Roles and addresses').click();
          await pages.addresses.addParty(hubRole).click();
        });

        test('offers no INS add link in stub mode', async ({ pages }) => {
          skipIfNonStubStackEnvironment('the INS add link is shown when animals-frontend runs outside stub mode (compose or CDP)');
          await expect(picker(pages).saveAndContinue).toBeVisible();
          await expect(picker(pages).addNewAddress).toHaveCount(0);
        });

        test('links to INS to add an address when the full stack is running', async ({ pages }) => {
          skipUnlessNonStubStackEnvironment('the handshake link is only rendered outside stub mode (compose or CDP)');
          await expect(picker(pages).saveAndContinue).toBeVisible();
          await expect(pages.page.getByRole('button', { name: /add.*address/i })).toHaveCount(0);
          await expect(picker(pages).addNewAddress).toBeVisible();
          await expect(picker(pages).addNewAddress).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
        });
      });
    }
  });

  test('the create-address page is no longer served', async ({ journey, journeyContext, pages }) => {
    await journey.startNotification();
    const journeyId = journeyContext.journeyId;

    const response = await pages.page.goto(`${SET_BASES.liveAnimals}/notifications/${journeyId}/addresses/create?for=consignor`);

    expect(response?.status()).toBe(404);
  });
});
