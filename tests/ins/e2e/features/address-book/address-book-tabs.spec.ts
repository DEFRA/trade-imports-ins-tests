import { test, expect } from '@fixtures';
import { type AddressType } from '@domain/shared/constants/address-types';
import {
  addressBookTabLabels,
  branchTab,
  originOrConsignorTab,
  roleBackedAddressBookTabs,
  rolesLabelOf,
  tabHolding,
  transporterTab,
  unsupportedAddressType,
} from '@domain/ins/constants/address-book-types';
import { transporterTypes } from '@domain/ins/constants/transporter-types';
import { branchAddressFixture, E2E_ADDRESS_BOOK_FIXTURES } from '@flows/shared/address-book-seed';
import { addressIdsDeletedAfterEachTest, createRunAddresses, runAddressesOnTab } from './run-addresses';

const createdAddressIds = addressIdsDeletedAfterEachTest('addressBookApi');

test.describe('Address book tabs API', () => {
  const isolatedOrganisationAddressIds = addressIdsDeletedAfterEachTest('isolatedOrganisationAddressBookApi');

  test("listing by a tab's roles returns exactly the addresses holding any of them", async ({ isolatedOrganisationAddressBookApi }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds);

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
    const { searchTerm, runAddresses } = await createRunAddresses(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds);

    const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTerm);

    expect(listed.map(({ name }) => name).sort()).toEqual(
      Object.values(runAddresses)
        .map(({ name }) => name)
        .sort(),
    );
  });
});

test.describe('Address book tabs', () => {
  test('the four tabs read in order, Origin and Consignor is current on a plain open and on an unknown tab, and Transporter is offered', async ({
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
    const { searchTerm, runAddresses } = await createRunAddresses(addressBookApi, createdAddressIds);

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
    await addressBookApi.createTransporter({
      name,
      addressLine1: '4 Shore Road',
      townOrCity: 'Antrim',
      postcode: 'BT41 4LB',
      countryCode: 'GB-NIR',
      phone: '+44 28 9446 1200',
      email: 'ops@shoreroad.example',
      type: transporterTypes.commercial,
      approvalNumber: 'NI/TA/2026/0099',
    });

    await insJourney.toAddressBookTab(transporterTab, { search: name });

    await expect(insPages.addressBookList.selectedTab).toHaveText(transporterTab.label);
    await expect(insPages.addressBookList.panelHeading).toHaveText(transporterTab.panelHeading);
    await expect(insPages.addressBookList.columnHeaders).toHaveText(['Name', 'Address', 'Approval number', 'Type', 'Action']);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.transporterApprovalNumberCell(name)).toHaveText('NI/TA/2026/0099');
    await expect(insPages.addressBookList.transporterTypeCell(name)).toHaveText('Commercial');
  });

  test('every shared fixture shows on the tab holding its roles, with its roles label, and a branch fixture is absent from the Origin and Consignor tab', async ({
    insPages,
    insJourney,
  }) => {
    for (const { name, roles } of E2E_ADDRESS_BOOK_FIXTURES) {
      await insJourney.toAddressBookTab(tabHolding(roles[0]), { search: name });

      await expect(insPages.addressBookList.rolesCell(name)).toHaveText(rolesLabelOf(roles));
    }

    await insJourney.toAddressBookTab(originOrConsignorTab, { search: branchAddressFixture.name });

    await expect(insPages.addressBookList.row(branchAddressFixture.name)).toHaveCount(0);
  });
});

test.describe('Address book tabs without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('following the Branch tab loads it, marks it current and lists the branch address the test added', async ({
    insPages,
    addressBookApi,
  }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(addressBookApi, createdAddressIds);
    await insPages.addressBookList.open();

    await insPages.addressBookList.tabLink(branchTab.label).click();
    await insPages.addressBookList.search(searchTerm, { submitWith: 'button' });

    await expect(insPages.addressBookList.selectedTab).toHaveText(branchTab.label);
    await expect(insPages.addressBookList.panelHeading).toHaveText(branchTab.panelHeading);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(runAddresses.branchAddress.name)).toBeVisible();
  });
});
