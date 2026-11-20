import { test, expect } from '@fixtures';
import { type AddressType } from '@domain/shared/constants/address-types';
import {
  addressBookTabLabels,
  originOrConsignorTab,
  roleBackedAddressBookTabs,
  rolesLabelOf,
  tabHolding,
  transporterTab,
  transporterTypeFilterLabels,
  unsupportedAddressType,
} from '@domain/ins/constants/address-book-types';
import { E2E_ADDRESS_BOOK_FIXTURES } from '@flows/shared/address-book-seed';
import { commercialTransporterDetails, transporterRequestOf } from '@domain/ins/constants/trader-transporter';
import { transporterTypes } from '@domain/ins/constants/transporter-types';
import { createRunAddresses, runAddressesOnTab } from './run-addresses';

test.describe('Address book tabs API', () => {
  test("listing by a tab's roles returns exactly the addresses holding any of them", async ({ isolatedOrganisationAddressBookApi }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(isolatedOrganisationAddressBookApi);

    for (const tab of roleBackedAddressBookTabs) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTerm, { roles: tab.roleFilterOptions });

      expect(listed.map(({ name }) => name).sort()).toEqual(
        runAddressesOnTab(runAddresses, tab)
          .map(({ name }) => name)
          .sort(),
      );
    }
  });

  test('listing with no role returns every live address', async ({ isolatedOrganisationAddressBookApi }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(isolatedOrganisationAddressBookApi);

    const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTerm);

    expect(listed.map(({ name }) => name).sort()).toEqual(
      Object.values(runAddresses)
        .map(({ name }) => name)
        .sort(),
    );
  });
});

test.describe('Address book tabs', () => {
  test('the three tabs read in order, Origin and Consignor is current on a plain open and on an unknown tab, and Transporter is offered', async ({
    insPages,
  }) => {
    await insPages.addressBookList.open();

    await expect(insPages.addressBookList.tabLinks).toHaveText(addressBookTabLabels);
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);

    await insPages.addressBookList.open({ addressType: unsupportedAddressType as AddressType });

    await expect(insPages.addressBookList.tabLinks).toHaveText(addressBookTabLabels);
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
  });

  test('each role-backed tab opens with its own panel heading, the columns Name, Type, Address, Country and Action, and exactly the addresses the test added, with their roles', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(addressBookApi);

    for (const tab of roleBackedAddressBookTabs) {
      await insJourney.toAddressBookTab(tab, { search: searchTerm });

      const expected = runAddressesOnTab(runAddresses, tab);
      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await expect(insPages.addressBookList.panelHeading).toHaveText(tab.panelHeading);
      await expect(insPages.addressBookList.columnHeaders).toHaveText(['Name', 'Type', 'Address', 'Country', 'Action']);
      await expect(insPages.addressBookList.resultsLine).toHaveText(`Showing 1-${expected.length} of ${expected.length}`);
      await expect(insPages.addressBookList.bodyRows).toHaveCount(expected.length);
      for (const { name, rolesLabel } of expected) {
        await expect(insPages.addressBookList.rolesCell(name)).toHaveText(rolesLabel);
      }
    }
  });

  test('the Transporter tab opens with its own panel heading, the columns Name, Address, Approval number and Type, and the transporter the test added', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const name = `Tabs Transporter ${Date.now()}`;
    await addressBookApi.createTransporter(
      transporterRequestOf(commercialTransporterDetails(name, 'NI/TA/2026/0099'), transporterTypes.commercial),
    );

    await insJourney.toAddressBookTab(transporterTab, { search: name });

    await expect(insPages.addressBookList.selectedTab).toHaveText(transporterTab.label);
    await expect(insPages.addressBookList.panelHeading).toHaveText(transporterTab.panelHeading);
    await expect(insPages.addressBookList.columnHeaders).toHaveText(['Name', 'Address', 'Approval number', 'Type', 'Action']);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.transporterApprovalNumberCell(name)).toHaveText('NI/TA/2026/0099');
    await expect(insPages.addressBookList.transporterTypeCell(name)).toHaveText(transporterTypeFilterLabels.COMMERCIAL);
  });

  test('every shared fixture shows on the tab holding its roles, with its roles label', async ({ insPages, insJourney }) => {
    for (const { name, roles } of E2E_ADDRESS_BOOK_FIXTURES) {
      await insJourney.toAddressBookTab(tabHolding(roles[0]), { search: name });

      await expect(insPages.addressBookList.rolesCell(name)).toHaveText(rolesLabelOf(roles));
    }
  });
});
