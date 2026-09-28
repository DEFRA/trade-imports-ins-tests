import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createPageObjects } from '@page-objects';
import { users } from '@config/users';

test.describe('Address book cross-user visibility', { tag: '@integration' }, () => {
  test('an address added by one user is visible to another user in the same organisation', async ({ browser, pages, addressBookApi }) => {
    const createdName = `Cross User Farm ${Date.now()}`;

    await pages.insAddressBookAdd.open(true, { userId: users.andrew.crn });
    await pages.insAddressBookAdd.fill({
      name: createdName,
      addressLine1: '2 Test Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 1AA',
      country: 'United Kingdom',
      phone: '01228 555 0102',
      email: 'cross-user@example.co.uk',
    });
    await pages.insAddressBookAdd.save();
    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));

    await addressBookApi.trackByName(createdName);

    // browser.newContext() inherits the test's storageState; Sarah must start cold.
    const contextB = await browser.newContext({ storageState: COLD_START });
    try {
      const pagesB = createPageObjects(await contextB.newPage());

      await pagesB.insAddressBookList.open(true, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await expect(pagesB.insAddressBookList.row(createdName)).toBeVisible();
    } finally {
      await contextB.close();
    }
  });
});
