import { test, expect } from '@fixtures';
import type { AddressBookApiClient, AddressBookRecord } from '@adapters/http/address-book-api-client';
import { originOf } from '@page-objects/shared/base-page';
import { LIVE_ANIMALS } from '@domain/ins/constants/notification-types';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { heldAsConsignor } from '@domain/shared/constants/address-types';
import { SET_BASES } from '@page-objects/shared/sets';
import { expectOpenFromReview } from '@page-objects/shared/journey-checks';
import { uniqueToken } from '@utils/unique-token';

const createReturnFarm = (addressBookApi: AddressBookApiClient, name = `Return Farm ${Date.now()}`): Promise<AddressBookRecord> =>
  addressBookApi.createAddress(traderAddress(name));

test.describe('Address book navigation between services', { tag: ['@compose', '@ins-frontend'] }, () => {
  test('follows the Address book item from the animals journey to the INS address book and back', async ({
    pages,
    animalsPages,
    insPages,
  }) => {
    test.slow();

    const animalsOrigin = originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
    const insOrigin = originOf('TRADE_IMPORTS_INS_FRONTEND_BASE_URL');

    await animalsPages.dashboard.open();

    await Promise.all([pages.page.waitForURL((url) => url.origin !== animalsOrigin), animalsPages.dashboard.linkAddressBook.click()]);
    await insPages.addressBookList.completeSignInIfRequested();

    await expect(pages.page).toHaveURL((url) => url.origin === insOrigin && url.pathname === '/address-book');
    await expect(insPages.addressBookList.heading).toBeVisible();

    await insPages.addressBookList.linkDashboard.click();
    await expect(insPages.dashboard.heading).toBeVisible();
    await insPages.dashboard.btnCreateNew.click();
    await insPages.notificationType.chooseNotificationType(LIVE_ANIMALS);

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
    "a picker row's View link opens the address in the INS address book, whose Back returns to the same picker with the search kept",
    { tag: '@address-book' },
    async ({ pages, animalsJourney, animalsPages, insPages, addressBookApi }) => {
      test.slow();

      const name = `Picker View Farm ${Date.now()}`;
      await addressBookApi.createAddress({ ...traderAddress(name), ...heldAsConsignor });
      await animalsJourney.toPartyPicker('Consignor');
      await animalsPages.consignorSelection.search(name);
      const { origin: pickerOrigin, pathname: pickerPath } = new URL(pages.page.url());

      await animalsPages.consignorSelection.partyViewLink(name).click();
      await insPages.addressBookView.completeSignInIfRequested();
      await expect(insPages.addressBookView.heading(name)).toBeVisible();
      await insPages.addressBookView.linkBack.click();

      await expect(pages.page).toHaveURL(
        (url) => url.origin === pickerOrigin && url.pathname === pickerPath && url.searchParams.get('q') === name,
      );
      await expect(animalsPages.consignorSelection.party(name)).toBeVisible();
    },
  );

  test(
    "a later picker page's View link, opened while changing an answer, Backs to that page with the chosen address still selected and the trail kept, and saving returns to the roles and addresses page carrying the trail from the review",
    { tag: '@address-book' },
    async ({ pages, animalsSeededJourney, animalsPages, insPages, addressBookApi }) => {
      test.slow();

      const token = uniqueToken();
      const chosenName = `Changed Consignor ${token}`;
      const chosenRecord = traderAddress(chosenName);
      await addressBookApi.createAddress({ ...chosenRecord, ...heldAsConsignor });
      for (let i = 0; i < 5; i += 1) {
        await addressBookApi.createAddress({ ...traderAddress(`Newer Consignor ${token} ${i}`), ...heldAsConsignor });
      }
      const referenceNumber = await animalsSeededJourney.createDraftNotification();
      await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);
      await animalsPages.notificationView.changeLink('Change roles and addresses').click();
      await animalsPages.addresses.changeParty('Consignor').click();
      const picker = animalsPages.consignorSelection;
      await picker.select(chosenName);
      await picker.search(token);
      const chosenRow = picker.party(chosenName);
      await picker.followNextPageUntilShown(chosenRow);
      await expect(picker.currentPaginationPageLink).not.toHaveText('1');
      const laterPageUrl = new URL(pages.page.url());

      await picker.partyViewLink(chosenName).click();
      await insPages.addressBookView.completeSignInIfRequested();
      await expect(insPages.addressBookView.heading(chosenName)).toBeVisible();
      await insPages.addressBookView.linkBack.click();

      await expect(pages.page).toHaveURL(
        (url) =>
          url.origin === laterPageUrl.origin &&
          url.pathname === laterPageUrl.pathname &&
          url.searchParams.get('q') === token &&
          url.searchParams.get('page') === laterPageUrl.searchParams.get('page') &&
          url.searchParams.get('from') === laterPageUrl.searchParams.get('from'),
      );
      await expect(picker.currentPaginationPageLink).toHaveText(laterPageUrl.searchParams.get('page') ?? '');
      await expect(chosenRow).toBeChecked();
      await expect(picker.selectedAddress).toHaveText(`Selected address: ${chosenName}`);

      await picker.saveAndContinue.click();

      await expectOpenFromReview(pages.page, animalsPages.addresses, referenceNumber, animalsPages.notificationView.slug);
      await expect(animalsPages.addresses.partyAddressLines('Consignor')).toContainText(chosenName);
    },
  );

  test(
    'an address opened with a return to an animals frontend URL that no page serves goes Back to that URL',
    { tag: '@address-book' },
    async ({ pages, insPages, addressBookApi }) => {
      test.slow();

      const animalsOrigin = originOf('TRADE_IMPORTS_ANIMALS_FRONTEND_BASE_URL');
      const unservedAnimalsReturnUrl = `${animalsOrigin}/germinal-products/notifications`;
      const createdAddress = await createReturnFarm(addressBookApi, `Germinal Return Farm ${Date.now()}`);

      await insPages.addressBookView.openWithReturn(createdAddress.id, unservedAnimalsReturnUrl);
      await insPages.addressBookView.linkBack.click();

      await expect(pages.page).toHaveURL(unservedAnimalsReturnUrl);
    },
  );
});
