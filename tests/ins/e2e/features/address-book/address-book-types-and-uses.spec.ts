import { test, expect } from '@fixtures';
import type { AddressBookEntry } from '@adapters/http/address-book-api-client';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { addressTypes, addressUses, type AddressType, type AddressUse } from '@domain/shared/constants/address-types';
import { unsupportedAddressValue } from '@domain/ins/constants/address-book-types';
import { expectedValidationRefusalOf } from './expected-api-refusal';

type TypeOrUsesField = 'uses' | 'addressType';

const expectValidationRefusalNaming = async (pending: Promise<unknown>, ...fields: TypeOrUsesField[]): Promise<void> => {
  const body = await expectedValidationRefusalOf(pending);
  expect(Object.keys(body.errors).sort()).toEqual([...fields].sort());
};

const withoutField = (entry: AddressBookEntry, field: TypeOrUsesField): AddressBookEntry => {
  const partial: Partial<AddressBookEntry> = { ...entry };
  delete partial[field];
  return partial as AddressBookEntry;
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

  test('an address created with all six uses, listed last to first, reads all six back in that order', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const allSixUsesReversed = Object.values(addressUses).reverse();
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...traderAddress(`All Uses Farm ${Date.now()}`),
      addressType: addressTypes.branch,
      uses: allSixUsesReversed,
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);

    expect(read.uses).toEqual(allSixUsesReversed);
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

  test('a create without an address type is refused naming the address type and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`No Type Farm ${Date.now()}`);

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.createAddress(withoutField(address, 'addressType')),
      'addressType',
    );
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('a create without uses is refused naming the uses and saves nothing', async ({ isolatedOrganisationAddressBookApi }) => {
    const address = traderAddress(`No Uses Farm ${Date.now()}`);

    await expectValidationRefusalNaming(isolatedOrganisationAddressBookApi.createAddress(withoutField(address, 'uses')), 'uses');
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('a create with an empty list of uses is refused naming the uses and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Empty Uses Farm ${Date.now()}`);

    await expectValidationRefusalNaming(isolatedOrganisationAddressBookApi.createAddress({ ...address, uses: [] }), 'uses');
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update without an address type and without uses is refused naming both and the address keeps its original type and uses', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = {
      ...traderAddress(`Kept Both Farm ${Date.now()}`),
      addressType: addressTypes.destinationConsigneeOrImporter,
      uses: [addressUses.consignee, addressUses.importer],
    };
    const created = await isolatedOrganisationAddressBookApi.createAddress(address);

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.updateAddress(created.id, withoutField(withoutField(address, 'addressType'), 'uses')),
      'addressType',
      'uses',
    );

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);
    expect(read.addressType).toBe(addressTypes.destinationConsigneeOrImporter);
    expect(read.uses).toEqual([addressUses.consignee, addressUses.importer]);
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
