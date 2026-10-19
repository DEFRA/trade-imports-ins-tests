import { test, expect } from '@fixtures';

test.describe('INS page titles', { tag: '@duplicated-in-frontend' }, () => {
  test('the home is titled Dashboard - Import notification service - GOV.UK', async ({ pages, insPages }) => {
    // Given a signed-in trader
    // When they open the home
    await insPages.dashboard.open();

    // Then the title names the page, then the service, then GOV.UK
    await expect(pages.page).toHaveTitle('Dashboard - Import notification service - GOV.UK');
  });

  test('the address book follows the same title pattern', async ({ pages, insPages }) => {
    // Given a signed-in trader
    // When they open the address book
    await insPages.addressBookList.open();
    await expect(insPages.addressBookList.heading).toBeVisible();

    // Then the title follows the same pattern as the home
    await expect(pages.page).toHaveTitle('Address book - Import notification service - GOV.UK');
  });

  test("an address's own page is titled with its name", async ({ pages, insPages, addressBookApi }) => {
    // Given a trader with an address in their book
    const name = `View Title Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({
      name,
      addressLine1: '1 Title Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 3CC',
      countryCode: 'GB',
      phone: '01228 555 0105',
      email: 'title@example.co.uk',
    });

    // When they open that address's page
    await insPages.addressBookView.open(created.id);

    // Then the title names the address, then the service, then GOV.UK
    await expect(pages.page).toHaveTitle(`${name} - Import notification service - GOV.UK`);
  });

  test('the delete page is titled Delete this address?', async ({ pages, insPages, addressBookApi }) => {
    // Given a trader with an address in their book
    const created = await addressBookApi.createAddress({
      name: `Delete Title Farm ${Date.now()}`,
      addressLine1: '2 Title Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 3CC',
      countryCode: 'GB',
      phone: '01228 555 0106',
      email: 'title@example.co.uk',
    });

    // When they open that address's delete page
    await insPages.addressBookDelete.open(created.id);

    // Then the title asks the question, then names the service, then GOV.UK
    await expect(pages.page).toHaveTitle('Delete this address? - Import notification service - GOV.UK');
  });

  test('a page showing errors opens its title with Error:', async ({ pages, insPages }) => {
    // Given a trader on the add address page
    await insPages.addressBookAdd.open();

    // When they save with nothing filled in
    await insPages.addressBookAdd.save();

    // Then the page shows errors and its whole title opens with the error prefix
    await expect(insPages.addressBookAdd.errorSummary).toBeVisible();
    await expect(pages.page).toHaveTitle('Error: Add address details - Import notification service - GOV.UK');
  });

  test('an error page follows the same title pattern', async ({ pages, insPages }) => {
    // Given a signed-in trader
    await insPages.dashboard.open();

    // When they open a page that does not exist
    await insPages.dashboard.navigateToInsFrontend('/no-such-page');

    // Then the error page's title follows the same pattern
    await expect(pages.page).toHaveTitle('Page not found - Import notification service - GOV.UK');
  });
});
