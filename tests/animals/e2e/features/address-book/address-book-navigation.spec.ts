import { test, expect } from '@fixtures';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

test.describe('Address book navigation between services', { tag: ['@compose', '@integration'] }, () => {
  test('follows the Address book item from the animals journey to the INS address book and back', async ({
    pages,
    animalsPages,
    insPages,
  }) => {
    test.slow();

    const animalsBaseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const animalsOrigin = new URL(animalsBaseUrl).origin;
    const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;

    await animalsPages.dashboard.open();

    await Promise.all([pages.page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.dashboard.linkAddressBook.click()]);
    await insPages.addressBookList.completeSignInIfRequested();

    await expect(pages.page).toHaveURL((url) => url.origin === insOrigin && url.pathname === '/address-book');
    await expect(insPages.addressBookList.heading).toBeVisible();

    await insPages.addressBookList.linkDashboard.click();
    await expect(insPages.dashboard.heading).toBeVisible();
    await pages.page.locator(`a[href^="${animalsBaseUrl}"]`).first().click();

    await expect(pages.page).toHaveURL((url) => url.origin === animalsOrigin && url.pathname.startsWith(SET_BASES.liveAnimals));
  });
});
