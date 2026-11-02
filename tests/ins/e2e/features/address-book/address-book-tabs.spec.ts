import { test, expect } from '@fixtures';
import type { AddressBookApiClient } from '@adapters/http/address-book-api-client';
import {
  addressBookTabLabels,
  addressBookTabs,
  addressTypes,
  addressUses,
  branchTab,
  destinationConsigneeOrImporterTab,
  originOrConsignorTab,
  unsupportedAddressValue,
  useLabels,
  type AddressBookTab,
  type AddressType,
  type AddressUse,
} from '@domain/shared/constants/address-types';
import { traderAddress } from '@domain/ins/constants/trader-address';
import { E2E_ADDRESS_BOOK_FIXTURES, ensureE2eAddressBook } from '@flows/shared/address-book-seed';

interface StampedAddress {
  name: string;
  addressType?: AddressType;
  uses?: AddressUse[];
  typeLabel: string;
  tabs: readonly AddressBookTab[];
}

const searchTermOf = (stamp: number) => `Tabs ${stamp}`;

const typeLabelOf = (uses: readonly AddressUse[] = []): string => uses.map((use) => useLabels[use]).join(', ');

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

const createStamped = async (api: AddressBookApiClient, stamp: number, createdIds: string[]) => {
  const stamped = stampedAddressesOf(stamp);
  for (const { name, addressType, uses } of Object.values<StampedAddress>(stamped)) {
    createdIds.push((await api.createAddress({ ...traderAddress(name), addressType, uses })).id);
  }
  return stamped;
};

const stampedAddressesOnTab = (stamped: Record<string, StampedAddress>, tab: AddressBookTab): StampedAddress[] =>
  Object.values(stamped).filter(({ tabs }) => tabs.includes(tab));

const createdAddressIds: string[] = [];

test.afterEach(async ({ addressBookApi }) => {
  for (const addressId of createdAddressIds.splice(0)) {
    await addressBookApi.deleteAddress(addressId);
  }
});

test.describe('Address book tabs API', () => {
  const isolatedOrganisationAddressIds: string[] = [];

  test.afterEach(async ({ isolatedOrganisationAddressBookApi }) => {
    for (const addressId of isolatedOrganisationAddressIds.splice(0)) {
      await isolatedOrganisationAddressBookApi.deleteAddress(addressId);
    }
  });

  test('listing by an address type returns exactly the addresses holding one of its uses, an address with no uses under Origin and Consignor only', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(isolatedOrganisationAddressBookApi, stamp, isolatedOrganisationAddressIds);

    for (const tab of addressBookTabs) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTermOf(stamp), { addressType: tab.addressType });

      expect(listed.map(({ name }) => name).sort()).toEqual(
        stampedAddressesOnTab(stamped, tab)
          .map(({ name }) => name)
          .sort(),
      );
    }
  });

  test('listing with no address type returns every live address', async ({ isolatedOrganisationAddressBookApi }) => {
    const stamp = Date.now();
    const stamped = await createStamped(isolatedOrganisationAddressBookApi, stamp, isolatedOrganisationAddressIds);

    const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTermOf(stamp));

    expect(listed.map(({ name }) => name).sort()).toEqual(
      Object.values(stamped)
        .map(({ name }) => name)
        .sort(),
    );
  });
});

test.describe('Address book tabs', () => {
  test('the three tabs read in order, Origin and Consignor is current on a plain open and on an unknown tab, and Transporter is not offered', async ({
    insPages,
  }) => {
    await insPages.addressBookList.open();

    await expect(insPages.addressBookList.tabLinks).toHaveText(addressBookTabLabels);
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);

    await insPages.addressBookList.open({ addressType: unsupportedAddressValue as AddressType });

    await expect(insPages.addressBookList.tabLinks).toHaveText(addressBookTabLabels);
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
  });

  test('each tab opens with its own panel heading, the columns Name, Type, Address, Country and Action, and exactly its stamped addresses with their Type', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);

    for (const tab of addressBookTabs) {
      await insPages.addressBookList.open({ addressType: tab.addressType });
      await insPages.addressBookList.search(searchTermOf(stamp), { submitWith: 'button' });

      const expected = stampedAddressesOnTab(stamped, tab);
      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await expect(insPages.addressBookList.panelHeading).toHaveText(tab.panelHeading);
      await expect(insPages.addressBookList.columnHeaders).toHaveText(['Name', 'Type', 'Address', 'Country', 'Action']);
      await expect(insPages.addressBookList.resultsLine).toHaveText(`Showing 1-${expected.length} of ${expected.length}`);
      await expect(insPages.addressBookList.bodyRows).toHaveCount(expected.length);
      for (const { name, typeLabel } of expected) {
        await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabel);
      }
    }
  });

  test('every shared fixture shows on the tab of its type with its Type label, and a branch fixture is absent from the Origin and Consignor tab', async ({
    insPages,
  }) => {
    const branchFixtureName = 'Animal and Plant Health Agency';

    for (const { name, addressType, uses } of E2E_ADDRESS_BOOK_FIXTURES) {
      const tab = addressBookTabs.find((candidate) => candidate.addressType === addressType);
      if (!tab) {
        throw new Error(`Expected a tab for the fixture ${name}`);
      }
      await insPages.addressBookList.open({ addressType: tab.addressType });
      await insPages.addressBookList.search(name, { submitWith: 'button' });

      await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabelOf(uses));
    }

    await insPages.addressBookList.open({ addressType: originOrConsignorTab.addressType });
    await insPages.addressBookList.search(branchFixtureName, { submitWith: 'button' });

    await expect(insPages.addressBookList.row(branchFixtureName)).toHaveCount(0);
  });
});

test.describe('Address book tabs without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('following the Branch tab loads it, marks it current and lists the stamped branch address', async ({ insPages, addressBookApi }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);
    await insPages.addressBookList.open();

    await insPages.addressBookList.tabLink(branchTab.label).click();
    await insPages.addressBookList.search(searchTermOf(stamp), { submitWith: 'button' });

    await expect(insPages.addressBookList.selectedTab).toHaveText(branchTab.label);
    await expect(insPages.addressBookList.panelHeading).toHaveText(branchTab.panelHeading);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.branchAddress.name)).toBeVisible();
  });
});

test.describe('Address book fixture reconcile', () => {
  test('a fixture record with no type or uses is rewritten with them once, and a second run leaves it untouched', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const fixture = E2E_ADDRESS_BOOK_FIXTURES.find(({ name }) => name === 'Origin Farm');
    if (!fixture) {
      throw new Error('Expected an Origin Farm fixture');
    }
    const { name, addressLine1, townOrCity, postcode, countryCode, phone, email } = fixture;
    await isolatedOrganisationAddressBookApi.createAddress({ name, addressLine1, townOrCity, postcode, countryCode, phone, email });

    await ensureE2eAddressBook(isolatedOrganisationAddressBookApi);

    const afterFirstRun = await isolatedOrganisationAddressBookApi.findByName(name);
    expect(afterFirstRun.addressType).toBe(fixture.addressType);
    expect(afterFirstRun.uses).toEqual(fixture.uses);

    await ensureE2eAddressBook(isolatedOrganisationAddressBookApi);

    const afterSecondRun = await isolatedOrganisationAddressBookApi.findByName(name);
    expect(afterSecondRun.modifiedAt).toBe(afterFirstRun.modifiedAt);
  });
});
