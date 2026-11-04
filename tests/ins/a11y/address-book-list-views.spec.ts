import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { addFormAddressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';
import { scanNextPage } from '@utils/next-page-scan';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the address book has no accessibility violations when populated and after an address is added', async ({
    insPages,
    addressBookApi,
    runA11yScan,
  }) => {
    const seededName = `A11y List Farm ${Date.now()}`;
    await addressBookApi.createAddress(traderAddress(seededName));

    await test.step('Address book (populated list)', async () => {
      await insPages.addressBookList.open();
      await expect(insPages.addressBookList.row(seededName)).toBeVisible();
      await runA11yScan();
    });

    await test.step('Address book with the success banner', async () => {
      await insPages.addressBookList.btnAddNewAddress.click();
      await insPages.addressBookAdd.heading.waitFor();
      await insPages.addressBookAdd.fill(addFormAddressWithLineTwoAndCounty(`A11y Added Farm ${Date.now()}`, 'United Kingdom'));
      await insPages.addressBookAdd.saveAndContinue();
      await insPages.addressBookList.successBanner.waitFor();
      await runA11yScan();
    });
  });

  test('the address book has no accessibility violations when paginated', async ({ insPages, addressBookApi, runA11yScan }) => {
    const stamp = Date.now();
    await Promise.all(
      Array.from({ length: 9 }, (_, index) => addressBookApi.createAddress(traderAddress(`A11y Paged Farm ${stamp} number ${index}`))),
    );
    await insPages.addressBookList.open();

    await scanNextPage(insPages.addressBookList.linkNextPage, runA11yScan);
  });
});
