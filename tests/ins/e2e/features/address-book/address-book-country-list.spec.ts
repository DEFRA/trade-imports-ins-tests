import { test, expect } from '@fixtures';
import { addressFormCountryNames } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Address book country list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test("the add form's Country select opens on Select a country, then lists every country reference data serves alphabetically, United Kingdom in its place", async ({
    insPages,
  }) => {
    await insPages.addressBookAdd.open();

    await expect(insPages.addressBookAdd.countryOptions).toHaveText(['Select a country', ...addressFormCountryNames]);
  });

  test("the edit form's Country select offers the same alphabetical list with no blank option", async ({ insPages, addressBookApi }) => {
    const created = await addressBookApi.createAddress({
      name: `Country Order Farm ${Date.now()}`,
      addressLine1: '7 Order Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 6FF',
      countryCode: 'GB',
      phone: '01228 555 0130',
      email: 'order@example.co.uk',
    });

    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.countryOptions).toHaveText(addressFormCountryNames);
  });
});
