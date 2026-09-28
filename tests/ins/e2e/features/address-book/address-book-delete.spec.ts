import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createPageObjects } from '@page-objects';
import { users } from '@config/users';

const baseAddress = {
  addressLine1: '5 Vanishing Way',
  townOrCity: 'Carlisle',
  postcode: 'CA1 4DD',
  countryCode: 'GB',
  phone: '01228 555 0105',
  email: 'delete@example.co.uk',
};

test.describe('Address book delete', { tag: '@integration' }, () => {
  test('deleting through the UI tombstones the record rather than removing it', async ({ pages, addressBookApi }) => {
    const name = `Delete Test Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    await pages.insAddressBookDelete.open(created.id);
    await expect(pages.insAddressBookDelete.heading).toBeVisible();
    await pages.insAddressBookDelete.confirm();

    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));
    await expect(pages.insAddressBookList.row(name)).toHaveCount(0);

    // The record is still there, flagged — the by-id endpoint is the only way
    // to see it, because list and search both omit tombstones. A hard delete
    // would 404 here and leave any notification referencing it dangling.
    const tombstone = await addressBookApi.getAddress(created.id);
    expect(tombstone.deleted).toBe(true);
    expect(tombstone.name).toBe(name);
  });

  test('an address deleted by one user is gone for another in the same organisation', async ({ browser, pages, addressBookApi }) => {
    const name = `Delete Cross User Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    await pages.insAddressBookDelete.open(created.id, true, { userId: users.andrew.crn });
    await pages.insAddressBookDelete.confirm();
    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));
    await expect(pages.insAddressBookList.row(name)).toHaveCount(0);

    // browser.newContext() inherits the test's storageState; Sarah must start cold.
    const contextB = await browser.newContext({ storageState: COLD_START });
    try {
      const pagesB = createPageObjects(await contextB.newPage());

      await pagesB.insAddressBookList.open(true, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await expect(pagesB.insAddressBookList.row(name)).toHaveCount(0);
    } finally {
      await contextB.close();
    }
  });
});
