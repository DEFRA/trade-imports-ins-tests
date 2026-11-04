import { randomUUID } from 'node:crypto';
import { test } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import type { InsPages } from '@page-objects';
import { addressTypes, addressUses, type AddressClassification, type AddressUse } from '@domain/shared/constants/address-types';
import {
  branchTab,
  destinationConsigneeOrImporterTab,
  originOrConsignorTab,
  useLabels,
  type AddressBookTab,
} from '@domain/ins/constants/address-book-types';
import { traderAddress } from '@domain/ins/constants/trader-address';

export interface StampedAddress extends AddressClassification {
  name: string;
  usesLabel: string;
  tabs: readonly AddressBookTab[];
}

const newStampedSearchTerm = (): string => `Stamped ${randomUUID().replaceAll('-', '')}`;

export const usesLabelOf = (uses: readonly AddressUse[]): string => uses.map((use) => useLabels[use]).join(', ');

const stampedAddressesOf = (searchTerm: string) => {
  const named = (suffix: string) => `${searchTerm} ${suffix}`;
  const stampedAddress = (address: Omit<StampedAddress, 'usesLabel'>): StampedAddress => ({
    ...address,
    usesLabel: usesLabelOf(address.uses),
  });
  return {
    placeOfOriginAndConsignee: stampedAddress({
      name: named('Origin And Consignee'),
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.placeOfOrigin, addressUses.consignee],
      tabs: [originOrConsignorTab, destinationConsigneeOrImporterTab],
    }),
    consignor: stampedAddress({
      name: named('Consignor'),
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.consignor],
      tabs: [originOrConsignorTab],
    }),
    importer: stampedAddress({
      name: named('Importer'),
      addressType: addressTypes.destinationConsigneeOrImporter,
      uses: [addressUses.importer],
      tabs: [destinationConsigneeOrImporterTab],
    }),
    branchAddress: stampedAddress({
      name: named('Branch'),
      addressType: addressTypes.branch,
      uses: [addressUses.branchAddress],
      tabs: [branchTab],
    }),
  };
};

export const createAddressHolding = async (
  api: AddressBookApiClient,
  createdAddressIds: string[],
  { name, addressType, uses }: Pick<StampedAddress, 'name' | 'addressType' | 'uses'>,
): Promise<void> => {
  createdAddressIds.push((await api.createAddress({ ...traderAddress(name), addressType, uses })).id);
};

export const createStamped = async (api: AddressBookApiClient, createdIds: string[]) => {
  const searchTerm = newStampedSearchTerm();
  const stamped = stampedAddressesOf(searchTerm);
  for (const stampedAddress of Object.values<StampedAddress>(stamped)) {
    await createAddressHolding(api, createdIds, stampedAddress);
  }
  return { searchTerm, stamped };
};

export const stampedAddressesOnTab = (stamped: Record<string, StampedAddress>, tab: AddressBookTab): StampedAddress[] =>
  Object.values(stamped).filter(({ tabs }) => tabs.includes(tab));

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

export const createStampedAndFilterListByUse = async (
  { insPages, api, createdAddressIds }: { insPages: InsPages; api: AddressBookApiClient; createdAddressIds: string[] },
  use: AddressUse,
) => {
  const { searchTerm, stamped } = await createStamped(api, createdAddressIds);
  await insPages.addressBookList.open();
  await insPages.addressBookList.filter({ term: searchTerm, submitWith: 'button', use });
  return { searchTerm, stamped };
};
