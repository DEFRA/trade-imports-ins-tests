import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createInsPages } from '@page-objects';
import { users } from '@config/users';
import { originOrConsignorTab } from '@domain/ins/constants/address-book-types';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';

test.describe('Address book cross-user visibility', () => {
  test('an address added by one user is visible to another user in the same organisation', async ({
    browser,
    pages,
    insPages,
    insJourney,
  }) => {
    const createdName = `Cross User Farm ${Date.now()}`;

    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(createdName, 'United Kingdom'), { userId: users.andrew.crn });
    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(originOrConsignorTab));

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
