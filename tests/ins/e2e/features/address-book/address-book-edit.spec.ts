import { test, expect } from '@fixtures';

const baseAddress = {
  addressLine1: '3 Change Lane',
  addressLine2: 'Unit 9',
  townOrCity: 'Carlisle',
  county: 'Cumbria',
  postcode: 'CA1 3CC',
  countryCode: 'GB',
  phone: '01228 555 0104',
  email: 'edit@example.co.uk',
};

test.describe('Address book edit', { tag: '@integration' }, () => {
  test('an edit replaces the whole record, clearing the optional fields left blank', async ({ pages, addressBookApi }) => {
    const originalName = `Edit Test Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name: originalName, ...baseAddress });

    const renamed = `${originalName} Renamed`;
    await pages.insAddressBookEdit.open(created.id);
    await expect(pages.insAddressBookEdit.heading).toBeVisible();
    await expect(pages.insAddressBookEdit.inputCounty).toHaveValue(baseAddress.county);

    // Address line 2 and county are omitted, so the form posts them empty. The
    // API replaces the record in full, which is what clears them — a merge
    // would leave the stored values in place.
    await pages.insAddressBookEdit.fill({
      name: renamed,
      addressLine1: baseAddress.addressLine1,
      townOrCity: baseAddress.townOrCity,
      postcode: baseAddress.postcode,
      country: 'United Kingdom',
      phone: baseAddress.phone,
      email: baseAddress.email,
    });
    await pages.insAddressBookEdit.save();

    await expect(pages.page).toHaveURL(new RegExp(`${pages.insAddressBookList.expectedUrl}$`));
    await expect(pages.insAddressBookList.successBanner).toBeVisible();

    const stored = await addressBookApi.getAddress(created.id);
    expect(stored.name).toBe(renamed);
    expect(stored.addressLine2 ?? '').toBe('');
    expect(stored.county ?? '').toBe('');
    expect(stored.townOrCity).toBe(baseAddress.townOrCity);
    expect(stored.deleted).toBe(false);
  });

  test('the edited address replaces the old one in the address book', async ({ pages, addressBookApi }) => {
    // The row locator matches on a regex, so the new name must not contain the
    // old one - otherwise the "gone" assertion matches the renamed row.
    const stamp = Date.now();
    const originalName = `Edit Listing Farm ${stamp}`;
    const created = await addressBookApi.createAddress({ name: originalName, ...baseAddress });

    const renamed = `Relisted Holding ${stamp}`;
    await pages.insAddressBookEdit.open(created.id);
    await pages.insAddressBookEdit.inputName.fill(renamed);
    await pages.insAddressBookEdit.save();

    await expect(pages.insAddressBookList.row(renamed)).toBeVisible();
    await expect(pages.insAddressBookList.row(originalName)).toHaveCount(0);
  });
});
