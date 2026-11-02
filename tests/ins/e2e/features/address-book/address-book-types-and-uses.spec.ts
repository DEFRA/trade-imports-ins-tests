import { test, expect } from '@fixtures';
import { traderAddress } from '@domain/ins/constants/trader-address';
import {
  addressTypes,
  addressUses,
  unsupportedAddressValue,
  type AddressType,
  type AddressUse,
} from '@domain/shared/constants/address-types';
import { expectedValidationRefusalOf } from './expected-api-refusal';

const expectValidationRefusalNaming = async (pending: Promise<unknown>, field: 'uses' | 'addressType'): Promise<void> => {
  const body = await expectedValidationRefusalOf(pending);
  expect(Object.keys(body.errors)).toEqual([field]);
};

test.describe('Address book API address type and uses', () => {
  test('an address created with a type and uses reads back by id with the same type and uses', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...traderAddress(`Typed Farm ${Date.now()}`),
      addressType: addressTypes.destinationConsigneeOrImporter,
      uses: [addressUses.importer, addressUses.placeOfDestination],
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);

    expect(read.addressType).toBe(addressTypes.destinationConsigneeOrImporter);
    expect(read.uses).toEqual([addressUses.importer, addressUses.placeOfDestination]);
  });

  test('an address created with all six uses reads all six back in the order given', async ({ isolatedOrganisationAddressBookApi }) => {
    const allSixUses = Object.values(addressUses);
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...traderAddress(`All Uses Farm ${Date.now()}`),
      addressType: addressTypes.branch,
      uses: allSixUses,
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);

    expect(read.uses).toEqual(allSixUses);
  });

  test('an update with a different set of uses reads back with exactly the new set', async ({ isolatedOrganisationAddressBookApi }) => {
    const address = traderAddress(`Updated Uses Farm ${Date.now()}`);
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...address,
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.placeOfOrigin, addressUses.consignor],
    });
    const replacementUses = [addressUses.consignor, addressUses.branchAddress, addressUses.importer];

    await isolatedOrganisationAddressBookApi.updateAddress(created.id, {
      ...address,
      addressType: addressTypes.originOrConsignor,
      uses: replacementUses,
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);
    expect(read.uses).toEqual(replacementUses);
  });

  test('a create carrying a use outside the six is refused naming the uses and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Unknown Use Farm ${Date.now()}`);

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.createAddress({
        ...address,
        uses: [addressUses.consignor, unsupportedAddressValue as AddressUse],
      }),
      'uses',
    );
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update carrying a use outside the six is refused naming the uses and the address keeps its original uses', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Kept Uses Farm ${Date.now()}`);
    const created = await isolatedOrganisationAddressBookApi.createAddress({ ...address, uses: [addressUses.placeOfOrigin] });

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.updateAddress(created.id, { ...address, uses: [unsupportedAddressValue as AddressUse] }),
      'uses',
    );
    expect((await isolatedOrganisationAddressBookApi.getAddress(created.id)).uses).toEqual([addressUses.placeOfOrigin]);
  });

  test('a create carrying a type outside the three is refused naming the address type and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Unknown Type Farm ${Date.now()}`);

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.createAddress({ ...address, addressType: unsupportedAddressValue as AddressType }),
      'addressType',
    );
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update carrying a type outside the three is refused naming the address type and the address keeps its original type', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Kept Type Farm ${Date.now()}`);
    const created = await isolatedOrganisationAddressBookApi.createAddress({ ...address, addressType: addressTypes.branch });

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.updateAddress(created.id, { ...address, addressType: unsupportedAddressValue as AddressType }),
      'addressType',
    );
    expect((await isolatedOrganisationAddressBookApi.getAddress(created.id)).addressType).toBe(addressTypes.branch);
  });
});
