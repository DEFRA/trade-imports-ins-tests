import { test, expect } from '@fixtures';
import type { AddressBookRequest } from '@adapters/http/address-book-api-client';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { addressRoles, type AddressRole } from '@domain/shared/constants/address-types';
import { destinationConsigneeOrImporterTab, unsupportedAddressValue } from '@domain/ins/constants/address-book-types';
import { expectedValidationRefusalOf } from './expected-api-refusal';

type RefusedField = 'roles' | 'countryCode';

const expectValidationRefusalNaming = async (pending: Promise<unknown>, field: RefusedField): Promise<void> => {
  const body = await expectedValidationRefusalOf(pending);
  expect(Object.keys(body.errors)).toEqual([field]);
};

const withoutRoles = (request: AddressBookRequest): AddressBookRequest => {
  const partial: Partial<AddressBookRequest> = { ...request };
  delete partial.roles;
  return partial as AddressBookRequest;
};

test.describe('Address book API roles', () => {
  test('an address created with roles reads back by id with the same roles', async ({ isolatedOrganisationAddressBookApi }) => {
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...traderAddress(`Roles Farm ${Date.now()}`),
      roles: [addressRoles.importer, addressRoles.placeOfDestination],
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);

    expect(read.roles).toEqual([addressRoles.importer, addressRoles.placeOfDestination]);
  });

  test('an address created with the three receiving roles, listed last to first, reads all three back in that order', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const receivingRolesReversed = destinationConsigneeOrImporterTab.roleFilterOptions.toReversed();
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...traderAddress(`Receiving Roles Farm ${Date.now()}`),
      roles: receivingRolesReversed,
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);

    expect(read.roles).toEqual(receivingRolesReversed);
  });

  test('an update with a different set of roles reads back with exactly the new set', async ({ isolatedOrganisationAddressBookApi }) => {
    const address = traderAddress(`Updated Roles Farm ${Date.now()}`);
    const created = await isolatedOrganisationAddressBookApi.createAddress({ ...address, roles: [addressRoles.consignee] });

    await isolatedOrganisationAddressBookApi.updateAddress(created.id, {
      ...address,
      roles: [addressRoles.importer, addressRoles.consignee],
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);
    expect(read.roles).toEqual([addressRoles.importer, addressRoles.consignee]);
  });

  test('a create without roles is refused naming the roles and saves nothing', async ({ isolatedOrganisationAddressBookApi }) => {
    const address = traderAddress(`No Roles Farm ${Date.now()}`);

    await expectValidationRefusalNaming(isolatedOrganisationAddressBookApi.createAddress(withoutRoles(address)), 'roles');
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('a create with an empty list of roles is refused naming the roles and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Empty Roles Farm ${Date.now()}`);

    await expectValidationRefusalNaming(isolatedOrganisationAddressBookApi.createAddress({ ...address, roles: [] }), 'roles');
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update without roles is refused naming the roles and the address keeps its original roles', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = { ...traderAddress(`Kept Roles Farm ${Date.now()}`), roles: [addressRoles.consignee, addressRoles.importer] };
    const created = await isolatedOrganisationAddressBookApi.createAddress(address);

    await expectValidationRefusalNaming(isolatedOrganisationAddressBookApi.updateAddress(created.id, withoutRoles(address)), 'roles');

    expect((await isolatedOrganisationAddressBookApi.getAddress(created.id)).roles).toEqual([
      addressRoles.consignee,
      addressRoles.importer,
    ]);
  });

  test('a create carrying a role outside the six is refused naming the roles and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Unknown Role Farm ${Date.now()}`);

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.createAddress({
        ...address,
        roles: [addressRoles.consignor, unsupportedAddressValue as AddressRole],
      }),
      'roles',
    );
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update carrying a role outside the six is refused naming the roles and the address keeps its original roles', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Kept Known Roles Farm ${Date.now()}`);
    const created = await isolatedOrganisationAddressBookApi.createAddress({ ...address, roles: [addressRoles.placeOfOrigin] });

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.updateAddress(created.id, { ...address, roles: [unsupportedAddressValue as AddressRole] }),
      'roles',
    );
    expect((await isolatedOrganisationAddressBookApi.getAddress(created.id)).roles).toEqual([addressRoles.placeOfOrigin]);
  });

  test('a create holding a sending role and a receiving role is refused naming the roles and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Mixed Roles Farm ${Date.now()}`);

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.createAddress({ ...address, roles: [addressRoles.placeOfOrigin, addressRoles.consignee] }),
      'roles',
    );
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an update adding a branch address role to a receiving address is refused naming the roles and the address keeps its original roles', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = traderAddress(`Kept Receiving Roles Farm ${Date.now()}`);
    const created = await isolatedOrganisationAddressBookApi.createAddress({ ...address, roles: [addressRoles.importer] });

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.updateAddress(created.id, {
        ...address,
        roles: [addressRoles.importer, addressRoles.branchAddress],
      }),
      'roles',
    );
    expect((await isolatedOrganisationAddressBookApi.getAddress(created.id)).roles).toEqual([addressRoles.importer]);
  });

  test('a create holding a receiving role outside the United Kingdom is refused naming the country and saves nothing', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const address = { ...traderAddress(`Abroad Consignee Farm ${Date.now()}`), countryCode: 'FR' };

    await expectValidationRefusalNaming(
      isolatedOrganisationAddressBookApi.createAddress({ ...address, roles: [addressRoles.consignee] }),
      'countryCode',
    );
    expect(await isolatedOrganisationAddressBookApi.listAddresses(address.name)).toEqual([]);
  });

  test('an address holding sending roles outside the United Kingdom is saved', async ({ isolatedOrganisationAddressBookApi }) => {
    const created = await isolatedOrganisationAddressBookApi.createAddress({
      ...traderAddress(`Abroad Consignor Farm ${Date.now()}`),
      countryCode: 'FR',
      roles: [addressRoles.placeOfOrigin, addressRoles.consignor],
    });

    const read = await isolatedOrganisationAddressBookApi.getAddress(created.id);

    expect(read.countryCode).toBe('FR');
    expect(read.roles).toEqual([addressRoles.placeOfOrigin, addressRoles.consignor]);
  });
});
