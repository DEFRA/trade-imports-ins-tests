import { test, expect } from '@fixtures';
import { addressTypeOptions, addressTypes } from '@domain/shared/constants/address-types';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';

const MISSING_TYPE_MESSAGE = 'Select an address type';

test.describe('Choosing an address type before adding an address', () => {
  test('Add a new address opens Choose an address type with its caption, the three types and their hints in order, Continue and Back to the address book', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressTypeFromList();

    const typePage = insPages.addressBookAddressType;
    await expect(pages.page).toHaveURL(new RegExp(`${typePage.expectedUrl}\\?start=true$`));
    await expect(typePage.caption).toBeVisible();
    await expect(typePage.heading).toBeVisible();
    await expect(typePage.radioLabels).toHaveText(addressTypeOptions.map(({ label }) => label));
    await expect(typePage.radioHints).toHaveText(addressTypeOptions.map(({ hint }) => hint));
    await expect(typePage.btnContinue).toBeVisible();

    await typePage.linkBack.click();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
  });

  test('Continue with no type chosen shows Select an address type against the options and in the summary, whose link focuses the first option', async ({
    insPages,
    insJourney,
  }) => {
    const typePage = insPages.addressBookAddressType;
    await insJourney.toAddressType();

    await typePage.continue();

    await expect(typePage.errorSummary).toBeVisible();
    await expect(typePage.inlineError).toContainText(MISSING_TYPE_MESSAGE);
    await typePage.errorSummaryLink(MISSING_TYPE_MESSAGE).click();
    await expect(typePage.radio(addressTypes.originOrConsignor)).toBeFocused();
  });

  for (const { addressType, label } of addressTypeOptions) {
    test(`choosing ${label} opens the add form with its caption and heading and no status tag, and Back shows the type chosen`, async ({
      insPages,
      insJourney,
    }) => {
      await insJourney.toAddressForm({ addressType });

      await expect(insPages.addressBookAdd.caption).toBeVisible();
      await expect(insPages.addressBookAdd.heading).toBeVisible();
      await expect(insPages.addressBookAdd.statusTag).toHaveCount(0);

      await insPages.addressBookAdd.linkBack.click();

      await expect(insPages.addressBookAddressType.radio(addressType)).toBeChecked();
    });
  }

  test('Add a new address from the address book list again starts with no type chosen', async ({ insPages, insJourney }) => {
    await insJourney.toAddressFormFromList({ addressType: addressTypes.branch });
    await insPages.addressBookList.open();

    await insPages.addressBookList.btnAddNewAddress.click();

    await insPages.addressBookAddressType.expectNoTypeChosen();
  });

  test('after a save the next add starts with no type chosen and empty fields', async ({ insPages, insJourney }) => {
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(`Type Step Farm ${Date.now()}`, 'United Kingdom'));
    await insPages.addressBookList.successBanner.waitFor();

    await insPages.addressBookList.btnAddNewAddress.click();

    await insPages.addressBookAddressType.expectNoTypeChosen();
    await insJourney.chooseAddressType();
    await expect(insPages.addressBookAdd.inputName).toHaveValue('');
    await expect(insPages.addressBookAdd.inputAddressLine1).toHaveValue('');
  });

  test('opening the add form with no type chosen lands on Choose an address type', async ({ pages, insPages }) => {
    await insPages.addressBookAdd.open();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAddressType.expectedUrl}$`));
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
  });

  test('Origin or Consignor opens the Country select on Select a country first with United Kingdom selected', async ({
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressForm({ addressType: addressTypes.originOrConsignor });

    await expect(insPages.addressBookAdd.countryOptions.first()).toHaveText('Select a country');
    await expect(insPages.addressBookAdd.selectedCountryOption).toHaveText('United Kingdom');
  });
});
