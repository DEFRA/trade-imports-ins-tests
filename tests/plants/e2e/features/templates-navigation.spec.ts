import { test, expect } from '@fixtures';
import { requireBaseUrl } from '@page-objects/shared/base-page';

const NAVIGATION_ITEMS = ['Dashboard', 'Templates', 'Address book', 'Manage account', 'Log out'];

test.describe('Templates in the service navigation (plants)', { tag: ['@compose', '@integration'] }, () => {
  test('offers Dashboard, Templates, Address book, Manage account and Log out, in that order, on the plants dashboard', async ({
    plantsPages,
  }) => {
    await plantsPages.dashboard.open();

    await expect(plantsPages.dashboard.heading).toBeVisible();
    await expect(plantsPages.dashboard.serviceNavigation.getByRole('listitem')).toHaveText(NAVIGATION_ITEMS);
  });

  test('opens the animals frontend’s Manage templates from the Templates item', async ({ pages, plantsPages, animalsPages }) => {
    test.slow();

    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    const plantsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_PLANTS_FRONTEND_BASE_URL')).origin;

    await plantsPages.dashboard.open();

    await Promise.all([pages.page.waitForURL((url) => url.origin !== plantsOrigin), plantsPages.dashboard.linkTemplates.click()]);
    await animalsPages.manageTemplates.completeSignInIfRequested();

    await expect(pages.page).toHaveURL((url) => url.origin === animalsOrigin && url.pathname === animalsPages.manageTemplates.expectedUrl);
    await expect(animalsPages.manageTemplates.heading).toBeVisible();
  });

  test('marks Dashboard, and not Templates, as current on the plants dashboard', async ({ plantsPages }) => {
    const { dashboard } = plantsPages;

    await dashboard.open();

    await expect(dashboard.serviceNavigationLink('Dashboard')).toHaveAttribute('aria-current', 'true');
    await expect(dashboard.linkTemplates).not.toHaveAttribute('aria-current');
  });
});
