import { test, expect } from '@fixtures';
import { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { addressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { ADDRESS_FORM_FIELD_LABELS, ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER } from '@domain/ins/constants/address-form';
import { expectAbove } from './expect-above';
import { expectAddressBookList } from './expect-address-book-list';

async function expectFieldsGroupedUnderSections(form: InsAddressBookFormPage): Promise<void> {
  await expect(form.sectionHeading('Address')).toBeVisible();
  await expect(form.sectionHeading('Contact details')).toBeVisible();
  await expectAbove(form.sectionHeading('Address'), form.inputName);
  await expectAbove(form.selectCountry, form.sectionHeading('Contact details'));
  await expectAbove(form.sectionHeading('Contact details'), form.inputEmail);
  await expectAbove(form.sectionHeading('Contact details'), form.inputPhone);
}

test.describe('The add-details form for an address entered by hand', () => {
  test('the add-details step groups its fields under Address and Contact details, with Name or organisation first and County between Town or city and Postcode, and the edit page labels the name the same', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    await insJourney.toAddressForm();

    await expectFieldsGroupedUnderSections(insPages.addressBookAdd);
    for (const [index, name] of ADDRESS_FORM_TEXTBOX_LABELS_IN_ORDER.entries()) {
      await expect(insPages.addressBookAdd.textboxes.nth(index)).toHaveAccessibleName(name);
    }

    const created = await addressBookApi.createAddress(addressWithLineTwoAndCounty(`Form Label Farm ${Date.now()}`));
    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.inputName).toHaveAccessibleName(ADDRESS_FORM_FIELD_LABELS.name);
  });

  test('Add a new address on the address book opens the add-details form after a type is chosen, whose Back link returns to Choose an address type', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    await insJourney.toAddressFormFromList();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAdd.expectedUrl}$`));
    await expect(insPages.addressBookAdd.heading).toBeVisible();

    await insPages.addressBookAdd.linkBack.click();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAddressType.expectedUrl}$`));
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
  });

  test('Cancel and return to address book is a link below Save and continue that returns to the address book and saves nothing', async ({
    pages,
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Cancelled Farm ${Date.now()}`;
    await insJourney.toAddressForm();
    await insPages.addressBookAdd.inputName.fill(name);
    await expect(insPages.addressBookAdd.btnCancelAndReturnToAddressBook).toHaveCount(0);

    await expectAbove(insPages.addressBookAdd.btnSaveAndContinue, insPages.addressBookAdd.linkCancelAndReturnToAddressBook);

    await insPages.addressBookAdd.linkCancelAndReturnToAddressBook.click();

    await expectAddressBookList({ pages, insPages });
    await expect(insPages.addressBookList.row(name)).toHaveCount(0);
    expect(await addressBookApi.listAddresses(name)).toHaveLength(0);
  });

  test('the edit page groups its fields under Address and Contact details and opens with the saved name', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Form Edit Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(addressWithLineTwoAndCounty(name));

    await insPages.addressBookEdit.open(created.id);

    await expectFieldsGroupedUnderSections(insPages.addressBookEdit);
    await expect(insPages.addressBookEdit.inputName).toHaveValue(name);
  });
});
