import { escapeRegex } from '@page-objects/shared/escape-regex';
import { test, expect } from '@fixtures';
import { addressTypes, addressRoles, addressTypesAskingRoles, type AddressTypeAskingRoles } from '@domain/shared/constants/address-types';
import { addressTypeOptions, addressTypeQuestion } from '@domain/ins/constants/address-book-types';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER } from '@domain/ins/constants/address-form';
import type { InsAddressBookAddressTypePage } from '@page-objects/ins/address-book/address-type-page';
import type { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { expectAddressBookList } from './expect-address-book-list';

const expectNoTypeChosen = async (typePage: InsAddressBookAddressTypePage): Promise<void> => {
  for (const { addressType } of addressTypeOptions) {
    await expect(typePage.radio(addressType)).not.toBeChecked();
  }
};

const expectTextboxesEmpty = async (form: InsAddressBookFormPage): Promise<void> => {
  await expect(form.textboxes).toHaveCount(ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER.length);
  for (const textbox of await form.textboxes.all()) {
    await expect(textbox).toHaveValue('');
  }
};

test.describe('Choosing an address type before adding an address', () => {
  test('Add a new address opens Choose an address type with its caption, the four types and their hints in order, Continue and Back to the address book', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressTypeFromList();

    const typePage = insPages.addressBookAddressType;
    await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(typePage.expectedUrl)}\\?start=true$`));
    await expect(typePage.caption).toBeVisible();
    await expect(typePage.heading).toBeVisible();
    await expect(typePage.radios).toHaveCount(addressTypeOptions.length);
    for (const [index, { label, hint }] of addressTypeOptions.entries()) {
      await expect(typePage.radios.nth(index)).toHaveAccessibleName(label);
      await expect(typePage.radios.nth(index)).toHaveAccessibleDescription(hint);
    }
    await expect(typePage.btnContinue).toBeVisible();

    await typePage.linkBack.click();

    await expectAddressBookList({ pages, insPages });
  });

  test('Continue with no type chosen shows Select an address type against the options and in the summary, whose link focuses the first option', async ({
    insPages,
    insJourney,
  }) => {
    const typePage = insPages.addressBookAddressType;
    await insJourney.toAddressType();

    await typePage.continue();

    await expect(typePage.errorSummary).toBeVisible();
    await expect(typePage.radioGroup).toHaveAccessibleDescription(`Error: ${addressTypeQuestion.error}`);
    await typePage.errorSummaryLink(addressTypeQuestion.error).click();
    await expect(typePage.radio(addressTypes.originOrConsignor)).toBeFocused();
  });

  const opensAddForm = (option: (typeof addressTypeOptions)[number]): option is typeof option & { addressType: AddressTypeAskingRoles } =>
    (addressTypesAskingRoles as readonly string[]).includes(option.addressType);

  const addFormOptions = addressTypeOptions.filter(opensAddForm);

  for (const { addressType, label } of addFormOptions) {
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

  const roleTickedByAddressType = {
    [addressTypes.originOrConsignor]: addressRoles.placeOfOrigin,
    [addressTypes.destinationConsigneeOrImporter]: addressRoles.consignee,
    [addressTypes.branch]: addressRoles.branchAddress,
  } as const;

  for (const { addressType, label } of addFormOptions) {
    test(`after a refused save of ${label}, choosing it again shows the address, the contact details and the ticked role entered`, async ({
      insPages,
      insJourney,
    }) => {
      const addPage = insPages.addressBookAdd;
      const role = roleTickedByAddressType[addressType];
      const entered = {
        ...addFormAddressWithLineTwoAndCounty(`Kept Entry ${label} ${Date.now()}`, 'United Kingdom'),
        email: 'not-an-email',
      };
      await insJourney.toAddressForm({ addressType });
      await addPage.fill(entered);
      await addPage.tickRoles([role]);
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
      await expect(addPage.rolesOption(role)).toBeChecked();
    });
  }

  test('Add a new address from the address book list again starts with no type chosen, empty text fields and no role ticked', async ({
    insPages,
    insJourney,
  }) => {
    const addPage = insPages.addressBookAdd;
    await insJourney.toAddressFormFromList({ addressType: addressTypes.branch });
    await addPage.fill(addFormAddressWithLineTwoAndCounty(`Abandoned Entry ${Date.now()}`, 'United Kingdom'));
    await addPage.tickRoles([addressRoles.branchAddress]);
    await insPages.addressBookList.open();

    await insPages.addressBookList.btnAddNewAddress.click();

    await expectNoTypeChosen(insPages.addressBookAddressType);
    await insJourney.chooseAddressType(addressTypes.branch);
    await expectTextboxesEmpty(addPage);
    await expect(addPage.rolesOption(addressRoles.branchAddress)).not.toBeChecked();
  });

  test('after a save the next add starts with no type chosen, empty text fields and no role ticked', async ({ insPages, insJourney }) => {
    const addPage = insPages.addressBookAdd;
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(`Type Step Farm ${Date.now()}`, 'United Kingdom'), {
      roles: [addressRoles.placeOfOrigin],
    });
    await insPages.addressBookList.successBanner.waitFor();

    await insPages.addressBookList.btnAddNewAddress.click();

    await expectNoTypeChosen(insPages.addressBookAddressType);
    await insJourney.chooseAddressType();
    await expectTextboxesEmpty(addPage);
    await expect(addPage.rolesOption(addressRoles.placeOfOrigin)).not.toBeChecked();
  });

  test('opening the add form with no type chosen lands on Choose an address type', async ({ pages, insPages }) => {
    await insPages.addressBookAdd.open();

    await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(insPages.addressBookAddressType.expectedUrl)}$`));
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
  });
});
