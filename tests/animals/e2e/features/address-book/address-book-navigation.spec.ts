import { test, expect } from '@fixtures';
import type { AddressBookApiClient, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { requireBaseUrl } from '@page-objects/shared/base-page';
import { SET_BASES } from '@page-objects/shared/sets';

const createReturnFarm = (addressBookApi: AddressBookApiClient): Promise<AddressBookRecord> =>
  addressBookApi.createAddress({
    name: `Return Farm ${Date.now()}`,
    addressLine1: '7 Return Road',
    townOrCity: 'Carlisle',
    postcode: 'CA1 5EE',
    countryCode: 'GB',
    phone: '01228 555 0166',
    email: 'return@example.co.uk',
  });

test.describe('Address book navigation between services', { tag: ['@compose', '@ins-frontend'] }, () => {
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

  test(
    'an address opened with a return to a live-animals journey page goes Back to that page',
    { tag: '@address-book' },
    async ({ pages, animalsJourney, animalsPages, insPages, addressBookApi }) => {
      test.slow();

      await animalsJourney.startNotification();
      const journeyPageUrl = pages.page.url();
      const createdAddress = await createReturnFarm(addressBookApi);

      await insPages.addressBookView.openWithReturn(createdAddress.id, journeyPageUrl);
      await expect(insPages.addressBookView.heading(createdAddress.name)).toBeVisible();
      await insPages.addressBookView.linkBack.click();

      await expect(pages.page).toHaveURL(journeyPageUrl);
      await expect(animalsPages.overview.heading).toBeVisible();
    },
  );

  test(
    'an address opened with a return to a live-animals journey page goes to that page after Yes, delete, and is marked deleted',
    { tag: '@address-book' },
    async ({ pages, animalsJourney, animalsPages, insPages, addressBookApi }) => {
      test.slow();

      await animalsJourney.startNotification();
      const journeyPageUrl = pages.page.url();
      const createdAddress = await createReturnFarm(addressBookApi);

      await insPages.addressBookView.openWithReturn(createdAddress.id, journeyPageUrl);
      await insPages.addressBookView.btnDelete.click();
      await expect(insPages.addressBookDelete.heading).toBeVisible();
      await insPages.addressBookDelete.confirm();

      await expect(pages.page).toHaveURL(journeyPageUrl);
      await expect(animalsPages.overview.heading).toBeVisible();
      await expect.poll(async () => (await addressBookApi.getAddress(createdAddress.id)).deleted).toBe(true);
    },
  );

  test(
    'an address opened with a return to an animals frontend URL that no page serves goes Back to that URL',
    { tag: '@address-book' },
    async ({ pages, insPages, addressBookApi }) => {
      test.slow();

      const animalsOrigin = new URL(requireBaseUrl('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL')).origin;
      const unservedAnimalsReturnUrl = `${animalsOrigin}/germinal-products/notifications`;
      const createdAddress = await addressBookApi.createAddress({
        name: `Germinal Return Farm ${Date.now()}`,
        addressLine1: '8 Return Road',
        townOrCity: 'Carlisle',
        postcode: 'CA1 5EF',
        countryCode: 'GB',
        phone: '01228 555 0167',
        email: 'germinal-return@example.co.uk',
      });

      await insPages.addressBookView.openWithReturn(createdAddress.id, unservedAnimalsReturnUrl);
      await insPages.addressBookView.linkBack.click();

      await expect(pages.page).toHaveURL(unservedAnimalsReturnUrl);
    },
  );
});
