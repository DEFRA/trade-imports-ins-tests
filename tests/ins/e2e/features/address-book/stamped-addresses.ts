import { randomUUID } from 'node:crypto';
import { test } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import type { InsPages } from '@page-objects';
import { addressRoles, type AddressRoles, type AddressRole } from '@domain/shared/constants/address-types';
import { roleColumnLabels, tabHolding, type AddressBookTab } from '@domain/ins/constants/address-book-types';
import { traderAddress } from '@domain/ins/constants/trader-address';

export interface StampedAddress extends AddressRoles {
  name: string;
  rolesLabel: string;
}

const newStampedSearchTerm = (): string => `Stamped ${randomUUID().replaceAll('-', '')}`;

export const rolesLabelOf = (roles: readonly AddressRole[]): string => roles.map((role) => roleColumnLabels[role]).join(', ');

const stampedAddressesOf = (searchTerm: string) => {
  const named = (suffix: string) => `${searchTerm} ${suffix}`;
  const stampedAddress = (address: Omit<StampedAddress, 'rolesLabel'>): StampedAddress => ({
    ...address,
    rolesLabel: rolesLabelOf(address.roles),
  });
  return {
    consigneeAndPlaceOfDestination: stampedAddress({
      name: named('Consignee And Destination'),
      roles: [addressRoles.consignee, addressRoles.placeOfDestination],
    }),
    consignor: stampedAddress({
      name: named('Consignor'),
      roles: [addressRoles.consignor],
    }),
    importer: stampedAddress({
      name: named('Importer'),
      roles: [addressRoles.importer],
    }),
    branchAddress: stampedAddress({
      name: named('Branch'),
      roles: [addressRoles.branchAddress],
    }),
  };
};

export const createAddressHolding = async (
  api: AddressBookApiClient,
  createdAddressIds: string[],
  { name, roles }: Pick<StampedAddress, 'name' | 'roles'>,
): Promise<void> => {
  createdAddressIds.push((await api.createAddress({ ...traderAddress(name), roles })).id);
};

export const createStamped = async (api: AddressBookApiClient, createdAddressIds: string[]) => {
  const searchTerm = newStampedSearchTerm();
  const stamped = stampedAddressesOf(searchTerm);
  for (const stampedAddress of Object.values<StampedAddress>(stamped)) {
    await createAddressHolding(api, createdAddressIds, stampedAddress);
  }
  return { searchTerm, stamped };
};

export const stampedAddressesOnTab = (stamped: Record<string, StampedAddress>, tab: AddressBookTab): StampedAddress[] =>
  Object.values(stamped).filter(({ roles }) => tabHolding(roles[0]) === tab);

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

export const createStampedAndFilterListByRole = async (
  { insPages, api, createdAddressIds }: { insPages: InsPages; api: AddressBookApiClient; createdAddressIds: string[] },
  role: AddressRole,
) => {
  const { searchTerm, stamped } = await createStamped(api, createdAddressIds);
  await insPages.addressBookList.open();
  await insPages.addressBookList.filter({ term: searchTerm, submitWith: 'button', role });
  return { searchTerm, stamped };
};
