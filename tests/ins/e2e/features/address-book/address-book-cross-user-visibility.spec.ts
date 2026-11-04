import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createInsPages } from '@page-objects';
import { users } from '@config/users';
import { originOrConsignorTab } from '@domain/ins/constants/address-book-types';

test.describe('Address book cross-user visibility', () => {
  test('an address added by one user is visible to another user in the same organisation', async ({
    browser,
    pages,
    insPages,
    insJourney,
  }) => {
    const createdName = `Cross User Farm ${Date.now()}`;

    await insJourney.addAddressFromList(
      {
        name: createdName,
        addressLine1: '2 Test Lane',
        townOrCity: 'Carlisle',
        postcode: 'CA1 1AA',
        country: 'United Kingdom',
        phone: '01228 555 0102',
        email: 'cross-user@example.co.uk',
      },
      { userId: users.andrew.crn },
    );
    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrl(originOrConsignorTab));

    const sarahsContext = await browser.newContext({ storageState: COLD_START });
    try {
      const sarahsInsPages = createInsPages(await sarahsContext.newPage());

      await sarahsInsPages.addressBookList.open({
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await expect(sarahsInsPages.addressBookList.row(createdName)).toBeVisible();
    } finally {
      await sarahsContext.close();
    }
  });
});
