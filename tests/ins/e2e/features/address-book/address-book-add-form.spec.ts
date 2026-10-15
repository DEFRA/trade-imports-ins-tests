import { test, expect } from '@fixtures';

const baseAddress = {
  addressLine1: '5 Form Lane',
  addressLine2: 'Unit 2',
  townOrCity: 'Carlisle',
  county: 'Cumbria',
  postcode: 'CA1 4DD',
  countryCode: 'GB',
  phone: '01228 555 0120',
  email: 'form@example.co.uk',
};

const FIELD_NAMES_IN_ORDER = [
  'Name or organisation',
  'Address line 1',
  'Address line 2 (optional)',
  'Town or city',
  'County (optional)',
  'Postcode or Zip code',
];

test.describe('The add-details form for an address entered by hand', () => {
  test('the add-details step groups its fields under Address and Contact details, with Name or organisation and County between Town or city and Postcode', async ({
    insPages,
  }) => {
    await insPages.addressBookAdd.open();

    await expect(insPages.addressBookAdd.sectionHeading('Address')).toBeVisible();
    await expect(insPages.addressBookAdd.sectionHeading('Contact details')).toBeVisible();
    for (const [index, name] of FIELD_NAMES_IN_ORDER.entries()) {
      await expect(insPages.addressBookAdd.textboxes.nth(index)).toHaveAccessibleName(name);
    }
    await expect(insPages.addressBookAdd.inputEmail).toBeVisible();
    await expect(insPages.addressBookAdd.inputPhone).toBeVisible();
  });

  test('for Origin or Consignor the Country select opens on United Kingdom, its blank first option reading Select one', async ({
    insPages,
  }) => {
    await insPages.addressBookAdd.open();

    await expect(insPages.addressBookAdd.selectCountry).toHaveValue('GB');
    await expect(insPages.addressBookAdd.countryOptionsIncludingPlaceholder.first()).toHaveText('Select one');
  });

  test('Cancel and return to address book is a link below Save and continue that returns to the address book and saves nothing', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Cancelled Farm ${Date.now()}`;
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.inputName.fill(name);
    await expect(pages.page.getByRole('button', { name: 'Cancel and return to address book' })).toHaveCount(0);

    const buttonBox = await insPages.addressBookAdd.btnSaveAndContinue.boundingBox();
    const linkBox = await insPages.addressBookAdd.linkCancel.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(linkBox).not.toBeNull();
    expect(linkBox.y).toBeGreaterThan(buttonBox.y);

    await insPages.addressBookAdd.linkCancel.click();

    await expect(pages.page).toHaveURL(new RegExp(`${insPages.addressBookList.expectedUrl}$`));
    await expect(insPages.addressBookList.heading).toBeVisible();
    await expect(insPages.addressBookList.row(name)).toHaveCount(0);
    expect(await addressBookApi.listAddresses(name)).toHaveLength(0);
  });

  test('the edit page groups its fields under Address and Contact details and keeps Name or organisation name', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Form Edit Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    await insPages.addressBookEdit.open(created.id);

    await expect(insPages.addressBookEdit.sectionHeading('Address')).toBeVisible();
    await expect(insPages.addressBookEdit.sectionHeading('Contact details')).toBeVisible();
    await expect(insPages.addressBookEdit.inputName).toHaveValue(name);
  });
});
