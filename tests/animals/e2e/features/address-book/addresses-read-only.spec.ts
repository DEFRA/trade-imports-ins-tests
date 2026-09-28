import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import type { AnimalsPages } from '@page-objects';
import type { AnimalsAddressesPage } from '@page-objects/animals/addresses-page';
import type { AnimalsPartyPickerPage } from '@page-objects/animals/party-picker-page';

const PARTY_ADD_LINK_CASES: Array<{
  hubRole: Parameters<AnimalsAddressesPage['addParty']>[0];
  picker: (animalsPages: AnimalsPages) => AnimalsPartyPickerPage;
}> = [
  { hubRole: 'Consignor or exporter', picker: (animalsPages) => animalsPages.consignorSelection },
  { hubRole: 'Place of origin', picker: (animalsPages) => animalsPages.placeOfOriginSelection },
  { hubRole: 'Consignee', picker: (animalsPages) => animalsPages.consigneeSelection },
  { hubRole: 'Importer', picker: (animalsPages) => animalsPages.importerSelection },
  { hubRole: 'Place of destination', picker: (animalsPages) => animalsPages.destinationSelection },
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
        test.beforeEach(async ({ journey, animalsPages }) => {
          await journey.startNotification();
          await journey.unlockSections();

          await animalsPages.overview.task('Roles and addresses').click();
          await animalsPages.addresses.addParty(hubRole).click();
        });

        test('offers no INS add link in stub mode', async ({ animalsPages }) => {
          skipIfNonStubStackEnvironment('the INS add link is shown when animals-frontend runs outside stub mode (compose or CDP)');
          await expect(picker(animalsPages).saveAndContinue).toBeVisible();
          await expect(picker(animalsPages).addNewAddress).toHaveCount(0);
        });

        test('links to INS to add an address when the full stack is running', async ({ pages, animalsPages }) => {
          skipUnlessNonStubStackEnvironment('the handshake link is only rendered outside stub mode (compose or CDP)');
          await expect(picker(animalsPages).saveAndContinue).toBeVisible();
          await expect(pages.page.getByRole('button', { name: /add.*address/i })).toHaveCount(0);
          await expect(picker(animalsPages).addNewAddress).toBeVisible();
          await expect(picker(animalsPages).addNewAddress).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
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
