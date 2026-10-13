import { test, expect } from '@fixtures';
import { requireBaseUrl } from '@page-objects/shared/base-page';

test.describe('Use template on the INS home', { tag: '@compose' }, () => {
  test('the INS home offers Use template beside Create new, before and after a search that matches nothing', async ({ insPages }) => {
    await insPages.dashboard.open();

    await expect(insPages.dashboard.btnCreateNew).toBeVisible();
    await expect(insPages.dashboard.btnUseTemplate).toBeVisible();

    await insPages.dashboard.searchForReference('GBN-AG-26-999999');

    await expect(insPages.dashboard.noSearchResults).toBeVisible();
    await expect(insPages.dashboard.btnCreateNew).toBeVisible();
    await expect(insPages.dashboard.btnUseTemplate).toBeVisible();
  });

  test('following Use template opens the animals frontend’s Manage templates', async ({ pages, insPages, animalsPages }) => {
    test.slow();

    const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
    const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;

    await insPages.dashboard.open();

    await Promise.all([pages.page.waitForURL((url) => url.origin !== insOrigin), insPages.dashboard.btnUseTemplate.click()]);
    await animalsPages.manageTemplates.completeSignInIfRequested();

    await expect(pages.page).toHaveURL((url) => url.origin === animalsOrigin && url.pathname === animalsPages.manageTemplates.expectedUrl);
    await expect(animalsPages.manageTemplates.heading).toBeVisible();
  });
});
