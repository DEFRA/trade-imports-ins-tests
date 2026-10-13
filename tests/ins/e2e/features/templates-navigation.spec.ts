import { test, expect } from '@fixtures';
import { requireBaseUrl } from '@page-objects/shared/base-page';

const NAVIGATION_ITEMS = ['Dashboard', 'Templates', 'Address book', 'Manage account', 'Log out'];

test.describe('Templates in the service navigation (INS)', { tag: '@compose' }, () => {
  test('offers Dashboard, Templates, Address book, Manage account and Log out, in that order, on the INS dashboard', async ({
    insPages,
  }) => {
    await insPages.dashboard.open();

    await expect(insPages.dashboard.serviceNavigation.getByRole('listitem')).toHaveText(NAVIGATION_ITEMS);
  });

  test('opens the animals frontend’s Manage templates from the Templates item', async ({ pages, insPages, animalsPages }) => {
    test.slow();

    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;

    await insPages.dashboard.open();

    await Promise.all([pages.page.waitForURL((url) => url.origin !== insOrigin), insPages.dashboard.linkTemplates.click()]);
    await animalsPages.manageTemplates.completeSignInIfRequested();

    await expect(pages.page).toHaveURL((url) => url.origin === animalsOrigin && url.pathname === animalsPages.manageTemplates.expectedUrl);
    await expect(animalsPages.manageTemplates.heading).toBeVisible();
  });

  test('marks Dashboard on the dashboard and Address book on the address book, and never Templates', async ({ insPages }) => {
    const { dashboard, addressBookList } = insPages;

    await dashboard.open();

    await expect(dashboard.serviceNavigationLink('Dashboard')).toHaveAttribute('aria-current', 'true');
    await expect(dashboard.linkTemplates).not.toHaveAttribute('aria-current');

    await addressBookList.open();
    await expect(addressBookList.heading).toBeVisible();

    await expect(addressBookList.serviceNavigationLink('Address book')).toHaveAttribute('aria-current', 'true');
    await expect(addressBookList.linkTemplates).not.toHaveAttribute('aria-current');
    await expect(addressBookList.serviceNavigationLink('Dashboard')).not.toHaveAttribute('aria-current');
  });
});
