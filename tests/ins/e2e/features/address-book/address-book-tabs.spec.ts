import { test, expect } from '@fixtures';
import { heldAsConsignor, type AddressType } from '@domain/shared/constants/address-types';
import {
  addressBookTabLabels,
  addressBookTabs,
  branchTab,
  originOrConsignorTab,
  tabOf,
  unsupportedAddressValue,
} from '@domain/ins/constants/address-book-types';
import { E2E_ADDRESS_BOOK_FIXTURES, ensureE2eAddressBook, placeOfOriginFixture } from '@flows/shared/address-book-seed';
import {
  addressIdsDeletedAfterEachTest,
  createStamped,
  stampedAddressesOnTab,
  stampedSearchTermOf,
  usesLabelOf,
} from './stamped-addresses';

const createdAddressIds = addressIdsDeletedAfterEachTest('addressBookApi');

test.describe('Address book tabs API', () => {
  const isolatedOrganisationAddressIds = addressIdsDeletedAfterEachTest('isolatedOrganisationAddressBookApi');

  test('listing by an address type returns exactly the addresses holding one of its uses', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(isolatedOrganisationAddressBookApi, stamp, isolatedOrganisationAddressIds);

    for (const tab of addressBookTabs) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(stampedSearchTermOf(stamp), { addressType: tab.addressType });

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

    const listed = await isolatedOrganisationAddressBookApi.listAddresses(stampedSearchTermOf(stamp));

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

  test('each tab opens with its own panel heading, the columns Name, Type, Address, Country and Action, and exactly its stamped addresses with their uses', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);

    for (const tab of addressBookTabs) {
      await insJourney.toAddressBookTab(tab, { search: stampedSearchTermOf(stamp) });

      const expected = stampedAddressesOnTab(stamped, tab);
      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await expect(insPages.addressBookList.panelHeading).toHaveText(tab.panelHeading);
      await expect(insPages.addressBookList.columnHeaders).toHaveText(['Name', 'Type', 'Address', 'Country', 'Action']);
      await expect(insPages.addressBookList.resultsLine).toHaveText(`Showing 1-${expected.length} of ${expected.length}`);
      await expect(insPages.addressBookList.bodyRows).toHaveCount(expected.length);
      for (const { name, usesLabel } of expected) {
        await expect(insPages.addressBookList.usesCell(name)).toHaveText(usesLabel);
      }
    }
  });

  test('every shared fixture shows on the tab of its type with its uses label, and a branch fixture is absent from the Origin and Consignor tab', async ({
    insPages,
    insJourney,
  }) => {
    const branchFixtureName = 'Animal and Plant Health Agency';

    for (const { name, addressType, uses } of E2E_ADDRESS_BOOK_FIXTURES) {
      await insJourney.toAddressBookTab(tabOf(addressType), { search: name });

      await expect(insPages.addressBookList.usesCell(name)).toHaveText(usesLabelOf(uses));
    }

    await insJourney.toAddressBookTab(originOrConsignorTab, { search: branchFixtureName });

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
    await insPages.addressBookList.search(stampedSearchTermOf(stamp), { submitWith: 'button' });

    await expect(insPages.addressBookList.selectedTab).toHaveText(branchTab.label);
    await expect(insPages.addressBookList.panelHeading).toHaveText(branchTab.panelHeading);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.branchAddress.name)).toBeVisible();
  });
});

test.describe('Address book fixture reconcile', () => {
  test('a fixture record holding a different use is rewritten with the fixture type and uses once, and a second run leaves it untouched', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const { name, addressLine1, townOrCity, postcode, countryCode, phone, email } = placeOfOriginFixture;
    await isolatedOrganisationAddressBookApi.createAddress({
      name,
      addressLine1,
      townOrCity,
      postcode,
      countryCode,
      phone,
      email,
      ...heldAsConsignor,
    });

    await ensureE2eAddressBook(isolatedOrganisationAddressBookApi);

    const afterFirstRun = await isolatedOrganisationAddressBookApi.findByName(name);
    expect(afterFirstRun.addressType).toBe(placeOfOriginFixture.addressType);
    expect(afterFirstRun.uses).toEqual(placeOfOriginFixture.uses);

    await ensureE2eAddressBook(isolatedOrganisationAddressBookApi);

    const afterSecondRun = await isolatedOrganisationAddressBookApi.findByName(name);
    expect(afterSecondRun.modifiedAt).toBe(afterFirstRun.modifiedAt);
  });
});
