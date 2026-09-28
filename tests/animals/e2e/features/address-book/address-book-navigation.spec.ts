import { test, expect } from '@fixtures';
import { requireBaseUrl } from '@page-objects/base/base-page';
import { SET_BASES } from '@page-objects/base/sets';

test.describe('Address book navigation between services', { tag: ['@compose', '@integration'] }, () => {
  test('follows the Address book item from the animals journey to the INS address book and back', async ({ pages }) => {
    test.slow();

    const animalsBaseUrl = requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const animalsOrigin = new URL(animalsBaseUrl).origin;
    const insOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_INS_FRONTEND_BASE_URL')).origin;

    await pages.notificationDashboard.open();

    await Promise.all([pages.page.waitForURL((url) => url.origin !== animalsOrigin), pages.notificationDashboard.linkAddressBook.click()]);
    await pages.insAddressBookList.completeSignInIfRequested();

    await expect(pages.page).toHaveURL((url) => url.origin === insOrigin && url.pathname === '/address-book');
    await expect(pages.insAddressBookList.heading).toBeVisible();

    await pages.insAddressBookList.linkDashboard.click();
    await expect(pages.insDashboard.heading).toBeVisible();
    await pages.page.locator(`a[href^="${animalsBaseUrl}"]`).first().click();

    await expect(pages.page).toHaveURL((url) => url.origin === animalsOrigin && url.pathname.startsWith(SET_BASES.liveAnimals));
  });
});
