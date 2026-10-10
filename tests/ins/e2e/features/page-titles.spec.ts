import { test, expect } from '@fixtures';

test.describe('INS page titles', { tag: '@integration' }, () => {
  test('the home is titled Dashboard - Import notification service - GOV.UK', async ({ pages, insPages }) => {
    // Given a signed-in trader
    // When they open the home
    await insPages.dashboard.open();

    // Then the title names the page, then the service, then GOV.UK, with no pipe
    await expect(pages.page).toHaveTitle('Dashboard - Import notification service - GOV.UK');
    await expect(pages.page).not.toHaveTitle(/\|/);
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
