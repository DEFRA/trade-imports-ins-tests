import { test, expect } from '@fixtures';

const NAVIGATION_ITEMS = ['Dashboard', 'Templates', 'Address book', 'Manage account', 'Log out'];

test.describe('Templates in the service navigation (animals)', { tag: '@integration' }, () => {
  test('offers Dashboard, Templates, Address book, Manage account and Log out, in that order, on the dashboard', async ({
    animalsPages,
  }) => {
    await animalsPages.dashboard.open();

    await expect(animalsPages.dashboard.serviceNavigation.getByRole('listitem')).toHaveText(NAVIGATION_ITEMS);
  });

  test('opens Manage templates from the Templates item', async ({ pages, animalsPages }) => {
    await animalsPages.dashboard.open();

    await animalsPages.dashboard.linkTemplates.click();

    await expect(pages.page).toHaveURL(new RegExp(`${animalsPages.manageTemplates.expectedUrl}$`));
    await expect(animalsPages.manageTemplates.heading).toBeVisible();
  });

  test('marks Templates, and not Dashboard or Address book, as current on Manage templates', async ({ animalsPages }) => {
    const { manageTemplates } = animalsPages;

    await manageTemplates.open();

    await expect(manageTemplates.serviceNavigation.getByRole('listitem')).toHaveText(NAVIGATION_ITEMS);
    await expect(manageTemplates.linkTemplates).toHaveAttribute('aria-current', 'true');
    await expect(manageTemplates.serviceNavigationLink('Dashboard')).not.toHaveAttribute('aria-current');
    await expect(manageTemplates.serviceNavigationLink('Address book')).not.toHaveAttribute('aria-current');
  });

  test('marks Dashboard, and not Templates, as current on the dashboard', async ({ animalsPages }) => {
    const { dashboard } = animalsPages;

    await dashboard.open();

    await expect(dashboard.serviceNavigationLink('Dashboard')).toHaveAttribute('aria-current', 'true');
    await expect(dashboard.linkTemplates).not.toHaveAttribute('aria-current');
  });
});
