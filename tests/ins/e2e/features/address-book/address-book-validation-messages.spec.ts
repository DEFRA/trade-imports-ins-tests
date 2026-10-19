import { test, expect } from '@fixtures';
import { RestClientError } from '@adapters/http/rest-client';
import type { InsAddressBookFormPage } from '@page-objects/ins/address-book/form-page';

const MESSAGES = {
  name: 'Enter a name or organisation name',
  postcode: 'Enter a postcode or Zip code',
  country: 'Select a country',
  phone: 'Enter a phone number',
};

const baseAddress = {
  addressLine1: '1 Message Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 5EE',
  countryCode: 'GB',
  phone: '01228 555 0111',
  email: 'messages@example.co.uk',
};

interface ValidationProblem {
  type: string;
  errors: Record<string, string[]>;
}

/** Asserts the caught value is the API's refusal and returns its status and parsed problem body. */
const refusal = (caught: unknown): { status: number; body: ValidationProblem } => {
  expect(caught).toBeInstanceOf(RestClientError);
  const error = caught as RestClientError;
  return { status: error.status, body: JSON.parse(error.responseBody) as ValidationProblem };
};

/** The four messages are in the summary and describe their own field. */
const expectFourMessages = async (form: InsAddressBookFormPage): Promise<void> => {
  await expect(form.errorSummary).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.name)).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.postcode)).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.country)).toBeVisible();
  await expect(form.errorSummaryLink(MESSAGES.phone)).toBeVisible();
  await expect(form.inputName).toHaveAccessibleDescription(new RegExp(MESSAGES.name));
  await expect(form.inputPostcode).toHaveAccessibleDescription(new RegExp(MESSAGES.postcode));
  await expect(form.selectCountry).toHaveAccessibleDescription(new RegExp(MESSAGES.country));
  await expect(form.inputPhone).toHaveAccessibleDescription(new RegExp(MESSAGES.phone));
};

test.describe('Address book validation messages', () => {
  test('saving the add form with name, postcode, country and phone left blank shows each message at the top and against its field', async ({
    insPages,
  }) => {
    await insPages.addressBookAdd.open();
    await insPages.addressBookAdd.fill({
      name: '',
      addressLine1: baseAddress.addressLine1,
      townOrCity: baseAddress.townOrCity,
      postcode: '',
      country: '',
      email: baseAddress.email,
      phone: '',
    });
    await insPages.addressBookAdd.save();

    await expect(insPages.addressBookAdd.heading).toBeVisible();
    await expectFourMessages(insPages.addressBookAdd);
  });

  test('saving the edit form with name, postcode, country and phone cleared shows the same messages, and nothing is saved', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Message Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.fill({
      name: '',
      addressLine1: baseAddress.addressLine1,
      townOrCity: baseAddress.townOrCity,
      postcode: '',
      country: '',
      email: baseAddress.email,
      phone: '',
    });
    await insPages.addressBookEdit.save();

    await expect(insPages.addressBookEdit.heading).toBeVisible();
    await expectFourMessages(insPages.addressBookEdit);

    const stored = await addressBookApi.getAddress(created.id);
    expect(stored.name).toBe(name);
    expect(stored.postcode).toBe(baseAddress.postcode);
  });

  test('the address book API refuses a blank name, postcode, country and phone with the same messages, keyed by field', async ({
    addressBookApi,
  }) => {
    // Name and postcode are blank, so the town is the searchable marker.
    const townOrCity = `Refused Town ${Date.now()}`;
    const caught = await addressBookApi
      .createAddress({ ...baseAddress, townOrCity, name: '', postcode: '', countryCode: '', phone: '' })
      .catch((error: unknown) => error);

    const { status, body } = refusal(caught);
    expect(status).toBe(400);
    expect(body.type).toBe('https://api.cdp.defra.cloud/problems/validation-error');
    expect(body.errors.name).toContain(MESSAGES.name);
    expect(body.errors.postcode).toContain(MESSAGES.postcode);
    expect(body.errors.countryCode).toContain(MESSAGES.country);
    expect(body.errors.phone).toContain(MESSAGES.phone);
    expect(await addressBookApi.listAddresses(townOrCity)).toHaveLength(0);
  });
});
