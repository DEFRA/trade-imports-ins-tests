import { SET_BASES } from '@page-objects/shared/sets';

import { test, expect } from '@fixtures';
import { skipIfNonStubStackEnvironment, skipUnlessNonStubStackEnvironment } from '@utils/playwright/environment';
import type { PartyRole } from '@page-objects/animals/addresses-page';

const PARTIES_CAPTION = 'Consignment parties';
const ADD_NEW_ADDRESS = 'Add a new address';

const PARTY_ADD_CONTROL_CASES: Array<{ role: PartyRole; description: string }> = [
  {
    role: 'Consignor',
    description: 'This is the sender of the consignment.',
  },
  {
    role: 'Place of origin',
    description: 'The address where the animals begin their journey to Great Britain',
  },
  {
    role: 'Consignee',
    description: 'This is the receiver or buyer of the consignment being shipped or transported.',
  },
  {
    role: 'Importer',
    description: 'This is usually the same as the consignee. You can select a different person if needed.',
  },
  {
    role: 'Place of destination',
    description:
      'This is where the animals will be unloaded and accommodated for at least 48 hours. If a health certificate is required, it will show this address.',
  },
];

test.describe('Addresses are read-only in the journey', () => {
  test.describe('party picker add control', () => {
    for (const { role, description } of PARTY_ADD_CONTROL_CASES) {
      test.describe(role, () => {
        test.beforeEach(async ({ animalsJourney }) => {
          await animalsJourney.toPartyPicker(role);
        });

        test('offers no add-address control in stub mode', async ({ animalsJourney, pages }) => {
          skipIfNonStubStackEnvironment('the INS add control is shown when animals-frontend runs outside stub mode (compose or CDP)');
          const picker = animalsJourney.partyPicker(role);
          await expect(picker.saveAndContinue).toBeVisible();
          await expect(picker.addNewAddress).toHaveCount(0);
          await expect(pages.page.getByRole('link', { name: ADD_NEW_ADDRESS })).toHaveCount(0);
        });

        test('holds only the caption and the heading in the heading row in stub mode', async ({ animalsJourney }) => {
          skipIfNonStubStackEnvironment('the INS add control is shown when animals-frontend runs outside stub mode (compose or CDP)');
          const picker = animalsJourney.partyPicker(role);
          await expect(picker.headingRowParts).toHaveText([PARTIES_CAPTION, picker.expectedHeading]);
        });

        test('offers one Add a new address button to INS beside the heading when the full stack is running', async ({
          animalsJourney,
          pages,
        }) => {
          skipUnlessNonStubStackEnvironment('the handshake button is only rendered outside stub mode (compose or CDP)');
          const picker = animalsJourney.partyPicker(role);
          await expect(picker.saveAndContinue).toBeVisible();
          await expect(picker.headingRowParts).toHaveText([PARTIES_CAPTION, picker.expectedHeading, ADD_NEW_ADDRESS]);
          await expect(picker.addNewAddress).toHaveAttribute('href', /\/address-book\/add\?journey-type=gbn-ag/);
          await expect(pages.page.getByRole('button', { name: ADD_NEW_ADDRESS })).toHaveCount(1);
          await expect(pages.page.getByRole('link', { name: ADD_NEW_ADDRESS })).toHaveCount(0);
        });

        test('puts the role description straight under the heading row', async ({ animalsJourney }) => {
          await expect(animalsJourney.partyPicker(role).descriptionUnderHeading).toHaveText(description);
        });
      });
    }
  });

  test('the create-address page is no longer served', async ({ animalsJourney, journeyContext, pages }) => {
    await animalsJourney.startNotification();
    const referenceNumber = journeyContext.referenceNumber;

    const response = await pages.page.goto(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/addresses/create?for=consignor`);

    expect(response?.status()).toBe(404);
  });
});
