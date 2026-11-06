import { test, expect, WCAG_STANDARD } from '@fixtures/a11y';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { addressDetailsMissingRequiredFields } from '@domain/ins/constants/address-details';

test.describe(`Accessibility ${WCAG_STANDARD.name}`, { tag: '@a11y' }, () => {
  test('the Choose an address type page has no accessibility violations when the error is shown', async ({
    insPages,
    insJourney,
    runA11yScan,
  }) => {
    await insJourney.toAddressType();
    await insPages.addressBookAddressType.continue();
    await expect(insPages.addressBookAddressType.errorSummary).toBeVisible();

    await runA11yScan();
  });

  test('the add address form has no accessibility violations when errors are shown', async ({ insPages, insJourney, runA11yScan }) => {
    await insJourney.toAddressForm();
    await insPages.addressBookAdd.fill(addressDetailsMissingRequiredFields);
    await insPages.addressBookAdd.saveAndContinue();
    await expect(insPages.addressBookAdd.errorSummary).toBeVisible();

    await runA11yScan();
  });

  test('the edit address form has no accessibility violations when errors are shown', async ({ insPages, addressBookApi, runA11yScan }) => {
    const created = await addressBookApi.createAddress(traderAddress(`A11y Error Farm ${Date.now()}`));
    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.heading.waitFor();
    await insPages.addressBookEdit.fill({ ...addressDetailsMissingRequiredFields, country: 'United Kingdom' });
    await insPages.addressBookEdit.save();
    await expect(insPages.addressBookEdit.errorSummary).toBeVisible();

    await runA11yScan();
  });
});
