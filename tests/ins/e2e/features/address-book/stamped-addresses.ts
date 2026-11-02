import { test } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import {
  addressTypes,
  addressUses,
  branchTab,
  destinationConsigneeOrImporterTab,
  originOrConsignorTab,
  useLabels,
  type AddressBookTab,
  type AddressType,
  type AddressUse,
} from '@domain/shared/constants/address-types';
import { traderAddress } from '@domain/ins/constants/trader-address';

export interface StampedAddress {
  name: string;
  addressType?: AddressType;
  uses?: AddressUse[];
  typeLabel: string;
  tabs: readonly AddressBookTab[];
}

export const searchTermOf = (stamp: number) => `Tabs ${stamp}`;

export const typeLabelOf = (uses: readonly AddressUse[] = []): string => uses.map((use) => useLabels[use]).join(', ');

const stampedAddressesOf = (stamp: number) => {
  const named = (suffix: string) => `${searchTermOf(stamp)} ${suffix}`;
  const stampedAddress = (address: Omit<StampedAddress, 'typeLabel'>): StampedAddress => ({
    ...address,
    typeLabel: typeLabelOf(address.uses),
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
    noUses: stampedAddress({
      name: named('No Uses'),
      tabs: [originOrConsignorTab],
    }),
  };
};

export const createStamped = async (api: AddressBookApiClient, stamp: number, createdIds: string[]) => {
  const stamped = stampedAddressesOf(stamp);
  for (const { name, addressType, uses } of Object.values<StampedAddress>(stamped)) {
    createdIds.push((await api.createAddress({ ...traderAddress(name), addressType, uses })).id);
  }
  return stamped;
};

export const stampedAddressesOnTab = (stamped: Record<string, StampedAddress>, tab: AddressBookTab): StampedAddress[] =>
  Object.values(stamped).filter(({ tabs }) => tabs.includes(tab));

export const deleteAddressesCreatedByEachTest = (): string[] => {
  const createdAddressIds: string[] = [];
  test.afterEach(async ({ addressBookApi }) => {
    for (const addressId of createdAddressIds.splice(0)) {
      await addressBookApi.deleteAddress(addressId);
    }
  });
  return createdAddressIds;
};
