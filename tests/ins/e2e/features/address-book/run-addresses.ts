import { randomUUID } from 'node:crypto';
import { test } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import type { InsPages } from '@page-objects';
import { addressRoles, type HeldRoles, type AddressRole } from '@domain/shared/constants/address-types';
import { roleOptionLabels, rolesLabelOf, tabHolding, type AddressBookTab } from '@domain/ins/constants/address-book-types';
import { traderAddress } from '@domain/ins/constants/trader-address';

export interface RunAddress extends HeldRoles {
  name: string;
  rolesLabel: string;
}

const newRunSearchTerm = (): string => `Run ${randomUUID().replaceAll('-', '')}`;

const runAddressesOf = (searchTerm: string) => {
  const named = (suffix: string) => `${searchTerm} ${suffix}`;
  const runAddress = (address: Omit<RunAddress, 'rolesLabel'>): RunAddress => ({
    ...address,
    rolesLabel: rolesLabelOf(address.roles),
  });
  return {
    consigneeAndPlaceOfDestination: runAddress({
      name: named('Consignee And Destination'),
      roles: [addressRoles.consignee, addressRoles.placeOfDestination],
    }),
    consignor: runAddress({
      name: named('Consignor'),
      roles: [addressRoles.consignor],
    }),
    importer: runAddress({
      name: named('Importer'),
      roles: [addressRoles.importer],
    }),
    branchAddress: runAddress({
      name: named('Branch'),
      roles: [addressRoles.branchAddress],
    }),
  };
};

export const createAddressHolding = async (
  api: AddressBookApiClient,
  createdAddressIds: string[],
  { name, roles }: Pick<RunAddress, 'name' | 'roles'>,
): Promise<void> => {
  createdAddressIds.push((await api.createAddress({ ...traderAddress(name), roles })).id);
};

export const createRunAddresses = async (api: AddressBookApiClient, createdAddressIds: string[]) => {
  const searchTerm = newRunSearchTerm();
  const runAddresses = runAddressesOf(searchTerm);
  for (const runAddress of Object.values<RunAddress>(runAddresses)) {
    await createAddressHolding(api, createdAddressIds, runAddress);
  }
  return { searchTerm, runAddresses };
};

export const runAddressesOnTab = (runAddresses: Record<string, RunAddress>, tab: AddressBookTab): RunAddress[] =>
  Object.values(runAddresses).filter(({ roles }) => tabHolding(roles[0]) === tab);

export const addressIdsDeletedAfterEachTest = (apiFixtureName: 'addressBookApi' | 'isolatedOrganisationAddressBookApi'): string[] => {
  const createdAddressIds: string[] = [];
  test.afterEach(async ({ addressBookApi, isolatedOrganisationAddressBookApi }) => {
    const api = apiFixtureName === 'addressBookApi' ? addressBookApi : isolatedOrganisationAddressBookApi;
    for (const addressId of createdAddressIds.splice(0)) {
      await api.deleteAddress(addressId);
    }
  });
  return createdAddressIds;
};

export const createRunAddressesAndFilterListByRole = async (
  { insPages, api, createdAddressIds }: { insPages: InsPages; api: AddressBookApiClient; createdAddressIds: string[] },
  role: AddressRole,
) => {
  const { searchTerm, runAddresses } = await createRunAddresses(api, createdAddressIds);
  await insPages.addressBookList.open();
  await insPages.addressBookList.filter({ term: searchTerm, submitWith: 'button', label: roleOptionLabels[role] });
  return { searchTerm, runAddresses };
};
