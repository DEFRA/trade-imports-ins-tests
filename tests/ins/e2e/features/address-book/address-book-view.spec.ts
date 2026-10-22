import { test, expect } from '@fixtures';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { expectAddressBookList } from './expect-address-book-list';

const OTHER_ORGANISATION_ID = 'e2e-dead-link-other-org';

const baseAddress = {
  addressLine1: '4 View Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 3CC',
  countryCode: 'GB',
  phone: '01228 555 0107',
  email: 'view@example.co.uk',
};

test.describe('Address book view', () => {
  test('shows address line 2 and County (optional) only when the address has them', async ({ insPages, addressBookApi }) => {
    // Given one address with line 2 and county, and one with neither
    const stamp = Date.now();
    const full = await addressBookApi.createAddress({
      name: `View Full Farm ${stamp}`,
      ...baseAddress,
      addressLine2: 'Unit 4',
      county: 'Cumbria',
    });
    const bare = await addressBookApi.createAddress({ name: `View Bare Farm ${stamp}`, ...baseAddress });

    // When they open the address that has them
    await insPages.addressBookView.open(full.id);

    // Then both rows are listed, marked optional
    await expect(insPages.addressBookView.summaryListKeys).toHaveText([
      'Name or organisation name',
      'Address line 1',
      'Address line 2 (optional)',
      'Town or city',
      'County (optional)',
      'Postcode or Zip code',
      'Country',
      'Email address',
      'Phone number',
    ]);

    // When they open the address that has neither
    await insPages.addressBookView.open(bare.id);

    // Then neither row is shown
    await expect(insPages.addressBookView.summaryListKeys).toHaveText([
      'Name or organisation name',
      'Address line 1',
      'Town or city',
      'Postcode or Zip code',
      'Country',
      'Email address',
      'Phone number',
    ]);
  });

  test.describe('return', () => {
    test('Back follows an INS return, and Edit and Delete carry it on', async ({ insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress({ name: `View Return Farm ${Date.now()}`, ...baseAddress });

      await insPages.addressBookView.openWithReturn(created.id, '/');

      await expect(insPages.addressBookView.btnEdit).toHaveAttribute('href', `/address-book/${created.id}/edit?return=%2F`);
      await expect(insPages.addressBookView.btnDelete).toHaveAttribute('href', `/address-book/${created.id}/delete?return=%2F`);

      await insPages.addressBookView.linkBack.click();

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('a return on another frontend is ignored', async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress({ name: `View Plants Return Farm ${Date.now()}`, ...baseAddress });
      const plantsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL')).origin;

      await insPages.addressBookView.openWithReturn(created.id, `${plantsOrigin}/high-risk-plants`);
      await insPages.addressBookView.linkBack.click();

      await expectAddressBookList({ pages, insPages });
    });
  });

  test.describe('dead links', () => {
    test('an unknown address id carrying an honoured return lands on it', async ({ insPages }) => {
      await insPages.addressBookView.openWithReturn('ffffffffffffffffffffffff', '/');

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('an unknown address id returns to the address book', async ({ pages, insPages }) => {
      // When they open the view page for an id nobody has
      await insPages.addressBookView.open('ffffffffffffffffffffffff');

      // Then the address book is shown, with no Page not found
      await expectAddressBookList({ pages, insPages });
    });

    test('a malformed address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookView.open('not-a-valid-id');

      await expectAddressBookList({ pages, insPages });
    });

    test("another organisation's address returns to the address book", async ({ pages, insPages, request }) => {
      // Given an address in another organisation's book
      const other = new AddressBookApiClient(request, OTHER_ORGANISATION_ID);
      const name = `Other Org Farm ${Date.now()}`;
      const created = await other.createAddress({ name, ...baseAddress });

      try {
        // When this user opens its id
        await insPages.addressBookView.open(created.id);

        // Then the address book is shown and none of its details are
        await expectAddressBookList({ pages, insPages });
        await expect(pages.page.getByText(name)).toHaveCount(0);
      } finally {
        await other.deleteAddress(created.id);
      }
    });

    test('a deleted address returns to the address book', async ({ pages, insPages, addressBookApi }) => {
      // Given an address that has since been deleted
      const created = await addressBookApi.createAddress({ name: `Deleted Farm ${Date.now()}`, ...baseAddress });
      await addressBookApi.deleteAddress(created.id);

      // When they open its page
      await insPages.addressBookView.open(created.id);

      await expectAddressBookList({ pages, insPages });
    });
  });
});
