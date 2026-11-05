import { test, expect } from '@fixtures';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { addressFormCountryNames } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Address book country list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test("the add form's Country select lists Select a country first, then every country reference data serves alphabetically, United Kingdom in its place", async ({
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressForm();

    await expect(insPages.addressBookAdd.countryOptions).toHaveText(['Select a country', ...addressFormCountryNames]);
  });

  test("the edit form's Country select lists every country reference data serves alphabetically, United Kingdom in its place, with no Select a country option", async ({
    insPages,
    addressBookApi,
  }) => {
    const created = await addressBookApi.createAddress(traderAddress(`Country Order Farm ${Date.now()}`));

    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.countryOptions).toHaveText(addressFormCountryNames);
  });
});
