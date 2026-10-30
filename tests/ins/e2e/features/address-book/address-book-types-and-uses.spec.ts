import { test, expect } from '@fixtures';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { expectedValidationRefusalOf } from './expected-api-refusal';

const expectValidationRefusalNaming = async (pending: Promise<unknown>, field: 'uses' | 'addressType'): Promise<void> => {
  const body = await expectedValidationRefusalOf(pending);
  expect(Object.keys(body.errors)).toEqual([field]);
};

test.describe('Address book API address type and uses', () => {
  test('an address created with a type and uses reads back by id with the same type and uses', async ({ addressBookApi }) => {
    const created = await addressBookApi.createAddress({
      ...traderAddress(`Typed Farm ${Date.now()}`),
      addressType: 'DESTINATION_CONSIGNEE_OR_IMPORTER',
      uses: ['IMPORTER', 'PLACE_OF_DESTINATION'],
    });

    const read = await addressBookApi.getAddress(created.id);

    expect(read.addressType).toBe('DESTINATION_CONSIGNEE_OR_IMPORTER');
    expect(read.uses).toEqual(['IMPORTER', 'PLACE_OF_DESTINATION']);
  });

  test('an address created with all six uses reads all six back in the order given', async ({ addressBookApi }) => {
    const allSixUses = ['PLACE_OF_ORIGIN', 'CONSIGNOR', 'PLACE_OF_DESTINATION', 'CONSIGNEE', 'IMPORTER', 'BRANCH_ADDRESS'];
    const created = await addressBookApi.createAddress({
      ...traderAddress(`All Uses Farm ${Date.now()}`),
      addressType: 'BRANCH',
      uses: allSixUses,
    });

    const read = await addressBookApi.getAddress(created.id);

    expect(read.uses).toEqual(allSixUses);
  });

  test('an update with a different set of uses reads back with exactly the new set', async ({ addressBookApi }) => {
    const address = traderAddress(`Updated Uses Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress({
      ...address,
      addressType: 'ORIGIN_OR_CONSIGNOR',
      uses: ['PLACE_OF_ORIGIN', 'CONSIGNOR'],
    });

    await addressBookApi.updateAddress(created.id, {
      ...address,
      addressType: 'ORIGIN_OR_CONSIGNOR',
      uses: ['CONSIGNOR', 'BRANCH_ADDRESS', 'IMPORTER'],
    });

    const read = await addressBookApi.getAddress(created.id);
    expect(read.uses).toEqual(['CONSIGNOR', 'BRANCH_ADDRESS', 'IMPORTER']);
  });

  test('a create carrying a use outside the six is refused naming the uses and saves nothing', async ({ addressBookApi }) => {
    const address = traderAddress(`Unknown Use Farm ${Date.now()}`);

    await expectValidationRefusalNaming(addressBookApi.createAddress({ ...address, uses: ['CONSIGNOR', 'TRANSPORTER'] }), 'uses');
    expect(await addressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update carrying a use outside the six is refused naming the uses and the address keeps its original uses', async ({
    addressBookApi,
  }) => {
    const address = traderAddress(`Kept Uses Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress({ ...address, uses: ['PLACE_OF_ORIGIN'] });

    await expectValidationRefusalNaming(addressBookApi.updateAddress(created.id, { ...address, uses: ['TRANSPORTER'] }), 'uses');
    expect((await addressBookApi.getAddress(created.id)).uses).toEqual(['PLACE_OF_ORIGIN']);
  });

  test('a create carrying a type outside the three is refused naming the address type and saves nothing', async ({ addressBookApi }) => {
    const address = traderAddress(`Unknown Type Farm ${Date.now()}`);

    await expectValidationRefusalNaming(addressBookApi.createAddress({ ...address, addressType: 'TRANSPORTER' }), 'addressType');
    expect(await addressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update carrying a type outside the three is refused naming the address type and the address keeps its original type', async ({
    addressBookApi,
  }) => {
    const address = traderAddress(`Kept Type Farm ${Date.now()}`);
    const created = await addressBookApi.createAddress({ ...address, addressType: 'BRANCH' });

    await expectValidationRefusalNaming(
      addressBookApi.updateAddress(created.id, { ...address, addressType: 'TRANSPORTER' }),
      'addressType',
    );
    expect((await addressBookApi.getAddress(created.id)).addressType).toBe('BRANCH');
  });
});
