import { test, expect } from '@fixtures';

const address = {
  addressLine1: '9 Proxy Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 9ZZ',
  country: 'United Kingdom',
  phone: '01228 555 0199',
  email: 'security-scan@example.co.uk',
};

test.describe('Security scan (ins)', { tag: '@active' }, () => {
  test('routes the address book through the ZAP proxy', async ({ pages, insPages, addressBookApi }) => {
    test.slow();
    await insPages.addressBookList.open();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.heading).toBeVisible();

    // The whole record lifecycle, not just the list: add, edit and delete are
    // the write surface, and each is an /address-book/{addressId} route — the
    // addressId dataDrivenNode has nothing to fold without them.
    const name = `Security Scan Farm ${Date.now()}`;
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.fill({ name, ...address });
    await insPages.addressBookAdd.save();
    await expect(insPages.addressBookList.row(name)).toBeVisible();

    const { id } = await addressBookApi.findByName(name);

    await insPages.addressBookView.open(id);
    await expect(insPages.addressBookView.heading(name)).toBeVisible();

    await insPages.addressBookEdit.open(id);
    await insPages.addressBookEdit.fill({ name, ...address, townOrCity: 'Penrith' });
    await insPages.addressBookEdit.save();
    await expect(insPages.addressBookList.row(name)).toBeVisible();

    await insPages.addressBookDelete.open(id);
    await insPages.addressBookDelete.confirm();
    await expect(insPages.addressBookList.row(name)).toHaveCount(0);

    await pages.page.goto('/');

    // journey-type/notification-id/fulfilment-id/handshake-token: query params
    // no other spec sends. Only the rejected-guard path is provable here —
    // extend to a real accepted token if seeding one becomes possible.
    await pages.page.goto(
      '/address-book/add?journey-type=not-a-journey&notification-id=GBN-AG-26-4F7K2P&fulfilment-id=9ad1e2f3-a4b5-4c60-8d1c-9e0f1a2b3c4d&handshake-token=handshake-token-value',
    );
    await expect(pages.page.getByText('Page not found')).toBeVisible();
  });
});
