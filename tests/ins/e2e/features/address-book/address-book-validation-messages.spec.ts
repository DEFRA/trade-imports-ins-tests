import { test, expect } from '@fixtures';
import type { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';
import { traderAddress, traderAddressInUnofferedCountry } from '@domain/ins/constants/trader-address';
import { ADDRESS_FORM_VALIDATION_MESSAGES } from '@domain/ins/constants/address-form';
import { addressUses } from '@domain/shared/constants/address-types';
import { expectedValidationRefusalOf } from './expected-api-refusal';

const expectOnlyFourMessagesAtTopAndAgainstFields = async (form: InsAddressBookFormPage): Promise<void> => {
  await expect(form.errorSummaryLinks).toHaveText([
    ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired,
    ADDRESS_FORM_VALIDATION_MESSAGES.postcodeRequired,
    ADDRESS_FORM_VALIDATION_MESSAGES.countryRequired,
    ADDRESS_FORM_VALIDATION_MESSAGES.phoneRequired,
  ]);
  await expect(form.inputName).toHaveAccessibleDescription(new RegExp(ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired));
  await expect(form.inputPostcode).toHaveAccessibleDescription(new RegExp(ADDRESS_FORM_VALIDATION_MESSAGES.postcodeRequired));
  await expect(form.selectCountry).toHaveAccessibleDescription(new RegExp(ADDRESS_FORM_VALIDATION_MESSAGES.countryRequired));
  await expect(form.inputPhone).toHaveAccessibleDescription(new RegExp(ADDRESS_FORM_VALIDATION_MESSAGES.phoneRequired));
};

test.describe('Address book validation messages', () => {
  test('saving the add form with a use ticked and name, postcode, country and phone left blank shows only those four messages, at the top and against each field', async ({
    insPages,
    insJourney,
  }) => {
    const address = traderAddress('Blank Fields Farm');

    await insJourney.toAddressForm();
    await insPages.addressBookAdd.fill({
      name: '',
      addressLine1: address.addressLine1,
      townOrCity: address.townOrCity,
      postcode: '',
      country: '',
      email: address.email,
      phone: '',
    });
    await insPages.addressBookAdd.tickUses([addressUses.placeOfOrigin]);
    await insPages.addressBookAdd.saveAndContinue();

    await expect(insPages.addressBookAdd.heading).toBeVisible();
    await expectOnlyFourMessagesAtTopAndAgainstFields(insPages.addressBookAdd);
  });

  test('saving the edit form of an address whose stored country is not offered, with name, postcode and phone cleared and no country chosen, shows the four messages and saves nothing', async ({
    insPages,
    addressBookApi,
  }) => {
    const address = traderAddressInUnofferedCountry(`Message Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress(address);

    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.fill({
      name: '',
      addressLine1: address.addressLine1,
      townOrCity: address.townOrCity,
      postcode: '',
      country: '',
      email: address.email,
      phone: '',
    });
    await insPages.addressBookEdit.save();

    await expect(insPages.addressBookEdit.heading).toBeVisible();
    await expectOnlyFourMessagesAtTopAndAgainstFields(insPages.addressBookEdit);
    expect(await addressBookApi.getAddress(created.id)).toMatchObject(address);
  });

  test('the address book API refuses a blank name, postcode, country and phone with the same messages, keyed by field', async ({
    addressBookApi,
  }) => {
    const searchMarkerTown = `Refused Town ${Date.now()}`;

    const body = await expectedValidationRefusalOf(
      addressBookApi.createAddress({ ...traderAddress(''), townOrCity: searchMarkerTown, postcode: '', countryCode: '', phone: '' }),
    );

    expect(body.errors.name).toContain(ADDRESS_FORM_VALIDATION_MESSAGES.nameRequired);
    expect(body.errors.postcode).toContain(ADDRESS_FORM_VALIDATION_MESSAGES.postcodeRequired);
    expect(body.errors.countryCode).toContain(ADDRESS_FORM_VALIDATION_MESSAGES.countryRequired);
    expect(body.errors.phone).toContain(ADDRESS_FORM_VALIDATION_MESSAGES.phoneRequired);
    expect(await addressBookApi.listAddresses(searchMarkerTown)).toHaveLength(0);
  });
});
