import { test, expect } from '@fixtures';
import { countries } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const ALPHABETICAL_NAMES = [...countries.map(({ name }) => name), 'United Kingdom'].toSorted((left, right) =>
  left.localeCompare(right, 'en'),
);

test.describe('Address book country list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test("the add form's Country select lists every country reference data serves alphabetically, United Kingdom in its place", async ({
    insPages,
  }) => {
    await insPages.addressBookAdd.open();

    await expect(insPages.addressBookAdd.countryOptions).toHaveText(ALPHABETICAL_NAMES);
  });

  test("the edit form's Country select lists the same countries in the same order", async ({ insPages, addressBookApi }) => {
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

    await expect(insPages.addressBookEdit.countryOptions).toHaveText(ALPHABETICAL_NAMES);
  });
});
