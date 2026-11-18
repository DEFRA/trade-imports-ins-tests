import { test, expect } from '@fixtures';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { addFormAddressWithLineTwoAndCounty, addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import {
  germinalProductsJourneyHandshakeFor,
  journeyParties,
  journeyReturnUrlFor,
  ownRoleByParty,
} from '@domain/ins/constants/address-book-journey';

const UNITED_KINGDOM = 'United Kingdom';

test.describe('INS address book add reached from a germinal products notification journey', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment('INS handshake routes are only exercised against the compose stack');
  });

  test('shows the add page, offers Back and Cancel to the germinal products return, and Save and select hands back the saved address holding the same record a live animals add would', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const handshake = germinalProductsJourneyHandshakeFor(journeyParties.consignor);
    const name = `Germinal Products Farm ${Date.now()}`;

    await insJourney.toAddressFormFromJourneyHandshake(handshake);

    await expect(insPages.addressBookAdd.linkBack).toHaveAttribute('href', journeyReturnUrlFor(handshake));
    await expect(insPages.addressBookAdd.linkCancelAndReturnToHub).toHaveAttribute(
      'href',
      journeyReturnUrlFor(handshake, { landing: 'cancel' }),
    );

    await insPages.addressBookAdd.fill(addFormAddressWithLineTwoAndCounty(name, UNITED_KINGDOM));
    await insPages.addressBookAdd.btnSaveAndSelect.click();

    await expect(pages.page).toHaveURL((url) => url.pathname === new URL(journeyReturnUrlFor(handshake)).pathname);
    const returnUrl = new URL(pages.page.url());
    expect(returnUrl.searchParams.get('landing')).toBe('select');
    expect(returnUrl.searchParams.get('addressId')).toBeTruthy();

    const stored = await addressBookApi.findByName(name);
    expect(stored).toMatchObject({ ...addressWithLineTwoAndCounty(name), roles: [ownRoleByParty[journeyParties.consignor]] });
  });
});
