import { test, expect } from '@fixtures';
import type { AddressTypeOption } from '@page-objects/ins/address-book/address-type-page';

const TYPES: { label: AddressTypeOption; hint: string }[] = [
  { label: 'Origin or Consignor', hint: 'Place of origin, Consignor' },
  { label: 'Destination, Consignee or Importer', hint: 'Place of destination, Consignee, Importer' },
  { label: 'Branch', hint: 'Branch address' },
];

test.describe('Choosing an address type before adding an address', () => {
  test('Add a new address opens Choose an address type, with its caption, its question and a Back link to the address book', async ({
    insPages,
  }) => {
    await insPages.addressBookList.open();
    await insPages.addressBookList.btnAddNewAddress.click();

    await expect(insPages.addressBookAddressType.caption).toBeVisible();
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
    await expect(insPages.addressBookAddressType.radioGroup).toBeVisible();

    await insPages.addressBookAddressType.linkBack.click();
    await expect(insPages.addressBookList.heading).toBeVisible();
  });

  test('the three address types are offered in order, each with its hint, and no Transporter', async ({ insPages }) => {
    await insPages.addressBookAddressType.open();

    const { options } = insPages.addressBookAddressType;
    await expect(options).toHaveCount(TYPES.length);
    for (const [index, { label, hint }] of TYPES.entries()) {
      await expect(options.nth(index)).toHaveAccessibleName(label);
      await expect(options.nth(index)).toHaveAccessibleDescription(hint);
    }
    await expect(insPages.addressBookAddressType.option('Transporter')).toHaveCount(0);
    await expect(insPages.addressBookAddressType.btnContinue).toBeVisible();
  });

  test('continuing with no type chosen shows Select an address type at the top and on the radios, linking to the first option', async ({
    pages,
    insPages,
  }) => {
    await insPages.addressBookAddressType.open();
    await insPages.addressBookAddressType.btnContinue.click();

    await expect(insPages.addressBookAddressType.errorSummary).toBeVisible();
    await expect(pages.page).toHaveTitle('Error: Choose an address type - Import notification service - GOV.UK');
    await expect(insPages.addressBookAddressType.radioGroup).toHaveAccessibleDescription(/Select an address type/);

    await insPages.addressBookAddressType.errorSummaryLink('Select an address type').click();
    await expect(insPages.addressBookAddressType.options.nth(0)).toBeFocused();
  });

  for (const { label } of TYPES) {
    test(`choosing ${label} opens Add address and contact details, and Back returns to the type still chosen`, async ({
      pages,
      insPages,
    }) => {
      await insPages.addressBookAddressType.open();
      await insPages.addressBookAddressType.choose(label);

      await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAdd.expectedUrl}$`));
      await expect(insPages.addressBookAdd.caption).toBeVisible();
      await expect(insPages.addressBookAdd.heading).toBeVisible();
      await expect(insPages.addressBookAdd.journeyStrip).toHaveCount(0);

      await insPages.addressBookAdd.linkBack.click();

      await expect(insPages.addressBookAddressType.heading).toBeVisible();
      await expect(insPages.addressBookAddressType.option(label)).toBeChecked();
    });
  }

  test('opening the address form with no type chosen goes to Choose an address type', async ({ pages, insPages }) => {
    await insPages.addressBookList.open();
    await insPages.addressBookList.btnAddNewAddress.click();
    await expect(insPages.addressBookAddressType.heading).toBeVisible();

    await pages.page.goto(insPages.addressBookAdd.expectedUrl);

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookAddressType.expectedUrl}$`));
    await expect(insPages.addressBookAddressType.heading).toBeVisible();
  });

  test('Add a new address again from the address book starts with no type selected and empty fields', async ({ insPages }) => {
    await insPages.addressBookAddressType.open();
    await insPages.addressBookAddressType.choose('Branch');
    await insPages.addressBookAdd.inputName.fill('Half finished farm');
    await insPages.addressBookAdd.linkBack.click();
    await expect(insPages.addressBookAddressType.option('Branch')).toBeChecked();

    await insPages.addressBookList.open();
    await insPages.addressBookList.btnAddNewAddress.click();

    await expect(insPages.addressBookAddressType.heading).toBeVisible();
    for (const { label } of TYPES) {
      await expect(insPages.addressBookAddressType.option(label)).not.toBeChecked();
    }

    await insPages.addressBookAddressType.choose('Origin or Consignor');
    await expect(insPages.addressBookAdd.inputName).toHaveValue('');
  });

  test('after a save the next add starts with no type selected', async ({ pages, insPages }) => {
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.fill({
      name: `Type Test Farm ${Date.now()}`,
      addressLine1: '1 Type Lane',
      townOrCity: 'Carlisle',
      postcode: 'CA1 5EE',
      country: 'United Kingdom',
      phone: '01228 555 0112',
      email: 'types@example.co.uk',
    });
    await insPages.addressBookAdd.save();
    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));

    await insPages.addressBookAddressType.open();

    for (const { label } of TYPES) {
      await expect(insPages.addressBookAddressType.option(label)).not.toBeChecked();
    }
  });
});
