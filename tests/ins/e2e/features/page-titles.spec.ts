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

  test('a page showing errors opens its title with Error:', async ({ pages, insPages }) => {
    // Given a trader on the add address page
    await insPages.addressBookAdd.open();

    // When they save with nothing filled in
    await insPages.addressBookAdd.save();

    // Then the page shows errors and its whole title opens with the error prefix
    await expect(insPages.addressBookAdd.errorSummary).toBeVisible();
    await expect(pages.page).toHaveTitle('Error: Add address and contact details - Import notification service - GOV.UK');
  });

  test('Choose an address type, the address form and the edit page follow the same title pattern', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    // Given a trader about to add an address
    await insPages.addressBookAddressType.open();

    // Then Choose an address type follows the pattern
    await expect(pages.page).toHaveTitle('Choose an address type - Import notification service - GOV.UK');

    // When they choose a type
    await insPages.addressBookAddressType.choose('Branch');

    // Then the address form follows the pattern
    await expect(insPages.addressBookAdd.heading).toBeVisible();
    await expect(pages.page).toHaveTitle('Add address and contact details - Import notification service - GOV.UK');

    // And so does the edit page of a stored address
    const created = await addressBookApi.createAddress({
      name: `Title Farm ${Date.now()}`,
      addressLine1: '1 Title Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 5EE',
      countryCode: 'GB',
      phone: '01228 555 0111',
      email: 'titles@example.co.uk',
    });
    await insPages.addressBookEdit.open(created.id);
    await expect(insPages.addressBookEdit.heading).toBeVisible();
    await expect(pages.page).toHaveTitle('Edit address details - Import notification service - GOV.UK');
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
