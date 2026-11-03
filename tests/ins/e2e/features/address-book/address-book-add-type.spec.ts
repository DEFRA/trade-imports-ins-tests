import { test, expect } from '@fixtures';
import { addressTypeOptions, addressTypes, addressUses } from '@domain/shared/constants/address-types';
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

  const useTickedByAddressType = {
    [addressTypes.originOrConsignor]: addressUses.placeOfOrigin,
    [addressTypes.destinationConsigneeOrImporter]: addressUses.consignee,
    [addressTypes.branch]: addressUses.branchAddress,
  } as const;

  for (const { addressType, label } of addressTypeOptions) {
    test(`after a refused save of ${label}, choosing it again shows the address, the contact details and the ticked use entered`, async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;
      const use = useTickedByAddressType[addressType];
      const entered = {
        ...addFormAddressWithLineTwoAndCounty(`Kept Entry ${label} ${Date.now()}`, 'United Kingdom'),
        email: 'not-an-email',
      };
      await insJourney.toAddressForm({ addressType });
      await addPage.fill(entered);
      await addPage.tickUses([use]);
      await addPage.saveAndContinue();
      await expect(addPage.errorSummary).toBeVisible();

      await addPage.linkBack.click();
      await insJourney.chooseAddressType(addressType);

      await expect(addPage.inputName).toHaveValue(entered.name);
      await expect(addPage.inputAddressLine1).toHaveValue(entered.addressLine1);
      await expect(addPage.inputAddressLine2).toHaveValue(entered.addressLine2);
      await expect(addPage.inputTownOrCity).toHaveValue(entered.townOrCity);
      await expect(addPage.inputCounty).toHaveValue(entered.county);
      await expect(addPage.inputPostcode).toHaveValue(entered.postcode);
      await expect(addPage.selectedCountryOption).toHaveText(entered.country);
      await expect(addPage.inputEmail).toHaveValue(entered.email);
      await expect(addPage.inputPhone).toHaveValue(entered.phone);
      await expect(addPage.usesOption(use)).toBeChecked();
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
