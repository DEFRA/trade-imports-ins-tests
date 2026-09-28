import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createInsPages } from '@page-objects';
import { users } from '@config/users';

test.describe('Address book cross-user visibility', { tag: '@integration' }, () => {
  test('an address added by one user is visible to another user in the same organisation', async ({
    browser,
    pages,
    insPages,
    addressBookApi,
  }) => {
    const createdName = `Cross User Farm ${Date.now()}`;

    await insPages.addressBookAdd.open(true, { userId: users.andrew.crn });
    await insPages.addressBookAdd.fill({
      name: createdName,
      addressLine1: '2 Test Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      country: 'United Kingdom',
      phone: '01228 555 0102',
      email: 'cross-user@example.co.uk',
    });
    await insPages.addressBookAdd.save();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));

    await addressBookApi.trackByName(createdName);

    // browser.newContext() inherits the test's storageState; Sarah must start cold.
    const contextB = await browser.newContext({ storageState: COLD_START });
    try {
      const insPagesB = createInsPages(await contextB.newPage());

      await insPagesB.addressBookList.open(true, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await expect(insPagesB.addressBookList.row(createdName)).toBeVisible();
    } finally {
      await contextB.close();
    }
  });
});
