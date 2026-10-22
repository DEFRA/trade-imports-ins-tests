import { test, expect } from '@fixtures';
import { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { expectAddressBookList } from './expect-address-book-list';
import { UNKNOWN_ADDRESS_ID } from './unknown-address-id';

const baseAddress = {
  addressLine1: '4 View Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 3CC',
  countryCode: 'GB',
  phone: '01228 555 0107',
  email: 'view@example.co.uk',
};

test.describe('Address book view', () => {
  test('shows Address line 2 (optional) and County (optional) when the address has them', async ({ insPages, addressBookApi }) => {
    const addressWithOptionalFields = await addressBookApi.createAddress({
      name: `View Full Farm ${Date.now()}`,
      ...baseAddress,
      addressLine2: 'Unit 4',
      county: 'Cumbria',
    });

    await insPages.addressBookView.open(addressWithOptionalFields.id);

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
  });

  test('shows neither Address line 2 nor County when the address has neither', async ({ insPages, addressBookApi }) => {
    const addressWithoutOptionalFields = await addressBookApi.createAddress({ name: `View Bare Farm ${Date.now()}`, ...baseAddress });

    await insPages.addressBookView.open(addressWithoutOptionalFields.id);

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
    test('an unknown address id carrying an INS return goes back to that return', async ({ insPages }) => {
      await insPages.addressBookView.openWithReturn(UNKNOWN_ADDRESS_ID, '/');

      await expect(insPages.dashboard.heading).toBeVisible();
    });

    test('an unknown address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookView.open(UNKNOWN_ADDRESS_ID);

      await expectAddressBookList({ pages, insPages });
    });

    test('a malformed address id returns to the address book', async ({ pages, insPages }) => {
      await insPages.addressBookView.open('not-a-valid-id');

      await expectAddressBookList({ pages, insPages });
    });

    test("another organisation's address returns to the address book", async ({ pages, insPages, request }) => {
      const otherOrganisationId = 'e2e-dead-link-other-org';
      const otherOrganisationAddressBookApi = new AddressBookApiClient(request, otherOrganisationId);
      const name = `Other Org Farm ${Date.now()}`;
      const created = await otherOrganisationAddressBookApi.createAddress({ name, ...baseAddress });

      try {
        await insPages.addressBookView.open(created.id);

        await expectAddressBookList({ pages, insPages });
        await expect(pages.page.getByText(name)).toHaveCount(0);
      } finally {
        await otherOrganisationAddressBookApi.deleteAddress(created.id);
      }
    });

    test('a deleted address returns to the address book', async ({ pages, insPages, addressBookApi }) => {
      const created = await addressBookApi.createAddress({ name: `Deleted Farm ${Date.now()}`, ...baseAddress });
      await addressBookApi.deleteAddress(created.id);

      await insPages.addressBookView.open(created.id);

      await expectAddressBookList({ pages, insPages });
    });
  });
});
