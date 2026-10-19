import { test, expect } from '@fixtures';
import { COLD_START } from '@fixtures/auth-state';
import { createInsPages } from '@page-objects';
import { users } from '@config/users';
import type { Page, Locator } from '@playwright/test';

const baseAddress = {
  addressLine1: '5 Vanishing Way',
  townOrCity: 'Carlisle',
  postcode: 'CA1 4DD',
  countryCode: 'GB',
  phone: '01228 555 0105',
  email: 'delete@example.co.uk',
};

test.describe('Address book delete', () => {
  test('deleting through the UI tombstones the record rather than removing it', async ({ pages, insPages, addressBookApi }) => {
    const stamp = Date.now();
    const name = `Delete Test Farm ${stamp}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    await insPages.addressBookDelete.open(created.id);
    await expect(insPages.addressBookDelete.heading).toBeVisible();
    await insPages.addressBookDelete.confirm();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.row(name)).toHaveCount(0);
    await expect(insPages.addressBookList.successBanner).toContainText(`Delete test farm ${stamp} address deleted`);

    // The record is still there, flagged — the by-id endpoint is the only way
    // to see it, because list and search both omit tombstones. A hard delete
    // would 404 here and leave any notification referencing it dangling.
    const tombstone = await addressBookApi.getAddress(created.id);
    expect(tombstone.deleted).toBe(true);
    expect(tombstone.name).toBe(name);
  });

  test('the delete page summarises the address, and No, cancel returns to its details with nothing deleted', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    // Given an address with every line filled in
    const name = `Delete Summary Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress, addressLine2: 'Unit 9', county: 'Cumbria' });

    // When they open its delete page
    await insPages.addressBookDelete.open(created.id);

    // Then it summarises the address on separate lines, without the email or phone
    await expect(insPages.addressBookDelete.heading).toBeVisible();
    await expect(insPages.addressBookDelete.terms).toHaveText(['Address']);
    await expect(insPages.addressBookDelete.values).toHaveText(`${name} 5 Vanishing Way Unit 9 Carlisle Cumbria CA1 4DD United Kingdom`, {
      useInnerText: true,
    });
    await expect(pages.page.getByText(baseAddress.email)).toHaveCount(0);
    await expect(insPages.addressBookDelete.confirmation).toBeVisible();
    await expect(insPages.addressBookDelete.warning).toBeVisible();

    // When they choose No, cancel
    await insPages.addressBookDelete.cancel();

    // Then they are back on the address's details and nothing was deleted
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookView.expectedUrl(created.id)}$`));
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
    expect((await addressBookApi.getAddress(created.id)).deleted).toBe(false);
    await insPages.addressBookList.open();
    await expect(insPages.addressBookList.successBanner).toHaveCount(0);
  });

  test.describe('dead links', () => {
    test("an unknown address id's delete page returns to the address book", async ({ pages, insPages }) => {
      await insPages.addressBookDelete.open('ffffffffffffffffffffffff');

      await expectAddressBookList({ pages, insPages });
    });

    test("a deleted address's delete page returns to the address book", async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress({ name: `Deleted Delete Farm ${Date.now()}`, ...baseAddress });
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookDelete.open(created.id);

      await expectAddressBookList({ pages, insPages });
    });

    test('a stale delete changes nothing and shows no banner', async ({ pages, insPages, addressBookApi }) => {
      // Given the delete page is open and the address is deleted behind it
      const created = await addressBookApi.createAddress({ name: `Stale Delete Farm ${Date.now()}`, ...baseAddress });
      await insPages.addressBookDelete.open(created.id);
      await addressBookApi.deleteAddress(created.id);

      // When they select Yes, delete
      await insPages.addressBookDelete.confirm();

      // Then they land on the list with no banner
      await expectAddressBookList({ pages, insPages });
      await expect(insPages.addressBookList.successBanner).toHaveCount(0);
    });
  });

  test('an address deleted by one user is gone for another in the same organisation', async ({
    browser,
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Delete Cross User Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    await insPages.addressBookDelete.open(created.id, true, { userId: users.andrew.crn });
    await insPages.addressBookDelete.confirm();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.row(name)).toHaveCount(0);

    // browser.newContext() inherits the test's storageState; Sarah must start cold.
    const contextB = await browser.newContext({ storageState: COLD_START });
    try {
      const insPagesB = createInsPages(await contextB.newPage());

      await insPagesB.addressBookList.open(true, {
        userId: users.sarah.crn,
        organisationSbi: users.sarah.organisations.gatwickAirport,
      });

      await expect(insPagesB.addressBookList.row(name)).toHaveCount(0);
    } finally {
      await contextB.close();
    }
  });
});

async function expectAddressBookList({
  pages,
  insPages,
}: {
  pages: { page: Page };
  insPages: { addressBookList: { expectedUrl: string; heading: Locator } };
}): Promise<void> {
  await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
  await expect(insPages.addressBookList.heading).toBeVisible();
  await expect(pages.page.getByText('Page not found')).toHaveCount(0);
}
