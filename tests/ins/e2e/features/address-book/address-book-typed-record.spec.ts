import { test, expect } from '@fixtures';
import { ADDRESS_USES } from '@adapters/http/address-book-api-client';
import { RestClientError } from '@adapters/http/rest-client';

const baseAddress = {
  addressLine1: '9 Typed Lane',
  townOrCity: 'Carlisle',
  postcode: 'CA1 4DD',
  countryCode: 'GB',
  phone: '01228 555 0109',
  email: 'typed@example.co.uk',
};

interface ValidationProblem {
  type: string;
  errors: Record<string, string>;
}

/** Asserts the caught value is the API's refusal and returns its status and parsed problem body. */
const refusal = (caught: unknown): { status: number; body: ValidationProblem } => {
  expect(caught).toBeInstanceOf(RestClientError);
  const error = caught as RestClientError;
  return { status: error.status, body: JSON.parse(error.responseBody) as ValidationProblem };
};

test.describe('Address book typed record', () => {
  test('an address created with its type and uses reads back with the same type and uses', async ({ addressBookApi }) => {
    const name = `Typed Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({
      name,
      ...baseAddress,
      addressType: 'ORIGIN_OR_CONSIGNOR',
      uses: ['PLACE_OF_ORIGIN', 'CONSIGNOR'],
    });

    const stored = await addressBookApi.getAddress(created.id);

    expect(stored.addressType).toBe('ORIGIN_OR_CONSIGNOR');
    expect(stored.uses).toEqual(['PLACE_OF_ORIGIN', 'CONSIGNOR']);
  });

  test('every one of the six uses is stored and read back', async ({ addressBookApi }) => {
    const name = `All Uses Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({
      name,
      ...baseAddress,
      addressType: 'DESTINATION_CONSIGNEE_OR_IMPORTER',
      uses: [...ADDRESS_USES],
    });

    const stored = await addressBookApi.getAddress(created.id);

    expect(stored.uses).toEqual([...ADDRESS_USES]);
  });

  test('an update with a different set of uses replaces the stored uses', async ({ addressBookApi }) => {
    const name = `Replace Uses Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({
      name,
      ...baseAddress,
      addressType: 'ORIGIN_OR_CONSIGNOR',
      uses: ['PLACE_OF_ORIGIN', 'CONSIGNOR'],
    });

    await addressBookApi.updateAddress(created.id, {
      name,
      ...baseAddress,
      addressType: 'ORIGIN_OR_CONSIGNOR',
      uses: ['CONSIGNOR'],
    });

    const stored = await addressBookApi.getAddress(created.id);
    expect(stored.uses).toEqual(['CONSIGNOR']);
  });

  test('a create carrying a use outside the six is refused naming the uses, and nothing is saved', async ({ addressBookApi }) => {
    const name = `Refused Create Farm ${Date.now()}`;

    const caught = await addressBookApi
      .createAddress({ name, ...baseAddress, uses: ['CONSIGNOR', 'TRANSPORTER'] })
      .catch((error: unknown) => error);

    const { status, body } = refusal(caught);
    expect(status).toBe(400);
    expect(body.type).toBe('https://api.cdp.defra.cloud/problems/validation-error');
    expect(body.errors.uses).toBeDefined();
    expect(await addressBookApi.listAddresses(name)).toHaveLength(0);
  });

  test('an update carrying a use outside the six is refused and the stored uses are unchanged', async ({ addressBookApi }) => {
    const name = `Refused Update Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress, uses: ['PLACE_OF_ORIGIN'] });

    const caught = await addressBookApi
      .updateAddress(created.id, { name, ...baseAddress, uses: ['TRANSPORTER'] })
      .catch((error: unknown) => error);

    const { status, body } = refusal(caught);
    expect(status).toBe(400);
    expect(body.errors.uses).toBeDefined();
    const stored = await addressBookApi.getAddress(created.id);
    expect(stored.uses).toEqual(['PLACE_OF_ORIGIN']);
  });

  test('an address created without a type or uses reads back with none', async ({ addressBookApi }) => {
    const name = `Untyped Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress({ name, ...baseAddress });

    const stored = await addressBookApi.getAddress(created.id);

    expect(stored.addressType).toBeNull();
    expect(stored.uses).toEqual([]);
  });
});
