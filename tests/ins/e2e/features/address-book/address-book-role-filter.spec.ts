import { test, expect } from '@fixtures';
import { addressTypes, addressRoles, heldAsConsignor, heldAsImporter, heldAsPlaceOfOrigin } from '@domain/shared/constants/address-types';
import {
  destinationConsigneeOrImporterTab,
  originOrConsignorTab,
  roleBackedAddressBookTabs,
  roleOptionLabels,
  typeFilterPlaceholder,
  rolesLabelOf,
  rolesQuestionLabels,
} from '@domain/ins/constants/address-book-types';
import { timeouts } from '@config/timeouts';
import { addFormAddressWithLineTwoAndCounty } from '@domain/ins/constants/trader-address';
import { addressIdsDeletedAfterEachTest } from '@utils/address-book-cleanup';
import { createAddressHolding, createRunAddresses, createRunAddressesAndFilterListByRole, runAddressesOnTab } from './run-addresses';

const createdAddressIds = addressIdsDeletedAfterEachTest('addressBookApi');

const UNITED_KINGDOM = 'United Kingdom';

const roleFilterTermOf = (scenario: string) => `Rolefilter ${scenario} ${Date.now()}`;

test.describe('Address book role filter API', () => {
  const isolatedOrganisationAddressIds = addressIdsDeletedAfterEachTest('isolatedOrganisationAddressBookApi');

  test('listing by a role returns exactly the test addresses holding it, and none for a role nothing holds', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds);

    for (const role of Object.values(addressRoles)) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTerm, { roles: [role] });

      expect(listed.map(({ name }) => name).sort()).toEqual(
        Object.values(runAddresses)
          .filter(({ roles }) => roles.includes(role))
          .map(({ name }) => name)
          .sort(),
      );
    }
  });

  test('a search role makes an address holding it match the search though its text does not, and leaves out one holding neither', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const term = roleFilterTermOf('search role');
    const textMatch = `${term} Consignor`;
    const roleMatch = `Search Role Importer ${Date.now()}`;
    const neither = `Search Role Consignor ${Date.now()}`;
    await createAddressHolding(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds, { name: textMatch, ...heldAsConsignor });
    await createAddressHolding(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds, { name: roleMatch, ...heldAsImporter });
    await createAddressHolding(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds, { name: neither, ...heldAsConsignor });

    const listed = (await isolatedOrganisationAddressBookApi.listAddresses(term, { searchRoles: [addressRoles.importer] })).map(
      ({ name }) => name,
    );

    expect(listed).toEqual(expect.arrayContaining([textMatch, roleMatch]));
    expect(listed).not.toContain(neither);
  });
});

test.describe('Address book role filter', () => {
  test('each role-backed tab, reached through its link, offers Select one with no value and then only its own roles', async ({
    insPages,
    insJourney,
  }) => {
    for (const tab of roleBackedAddressBookTabs) {
      await insJourney.toAddressBookTab(tab);

      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await expect(insPages.addressBookList.typeFilterOptions).toHaveText([
        typeFilterPlaceholder,
        ...tab.roleFilterOptions.map((role) => roleOptionLabels[role]),
      ]);
      await expect(insPages.addressBookList.typeFilterOptions.first()).toHaveAttribute('value', '');
    }
  });

  test('a role filter finds the addresses holding it beyond the first page of the tab, counted and without pagination', async ({
    insPages,
    addressBookApi,
  }) => {
    const term = roleFilterTermOf('beyond first page');
    for (const suffix of ['First Consignor', 'Second Consignor']) {
      await createAddressHolding(addressBookApi, createdAddressIds, {
        name: `${term} ${suffix}`,
        roles: [addressRoles.consignor],
      });
    }
    for (let index = 1; index <= 9; index++) {
      await createAddressHolding(addressBookApi, createdAddressIds, { name: `${term} Place Of Origin ${index}`, ...heldAsPlaceOfOrigin });
    }
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(term, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 11');

    await insPages.addressBookList.filter({ term, submitWith: 'button', label: roleOptionLabels[addressRoles.consignor] });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-2 of 2');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(2);
    await expect(insPages.addressBookList.row(`${term} First Consignor`)).toBeVisible();
    await expect(insPages.addressBookList.row(`${term} Second Consignor`)).toBeVisible();
    await expect(insPages.addressBookList.pagination).toHaveCount(0);
  });

  test('a role filter that runs past one page is counted and paged, and the next page keeps the tab, the search and the role filter', async ({
    insPages,
    addressBookApi,
    page,
  }) => {
    const term = roleFilterTermOf('paged');
    for (let index = 1; index <= 9; index++) {
      await createAddressHolding(addressBookApi, createdAddressIds, {
        name: `${term} Consignor ${index}`,
        roles: [addressRoles.consignor],
      });
    }
    await insPages.addressBookList.open();

    await insPages.addressBookList.filter({ term, submitWith: 'button', label: roleOptionLabels[addressRoles.consignor] });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 9');
    const href = await insPages.addressBookList.nextPageLink.getAttribute('href');
    const next = new URL(href ?? '', page.url());
    expect(next.searchParams.get('addressType')).toBe(addressTypes.originOrConsignor);
    expect(next.searchParams.get('q')).toBe(term);
    expect(next.searchParams.get('role')).toBe(addressRoles.consignor);
    expect(next.searchParams.get('page')).toBe('2');

    await insPages.addressBookList.nextPageLink.click();

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 9-9 of 9');
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.selectedTypeFilterOption).toHaveText(roleOptionLabels.CONSIGNOR);
  });

  test('a role filter matching one address counts one', async ({ insPages, addressBookApi }) => {
    const term = roleFilterTermOf('counts one');
    await createAddressHolding(addressBookApi, createdAddressIds, {
      name: `${term} Consignor`,
      roles: [addressRoles.consignor],
    });
    await createAddressHolding(addressBookApi, createdAddressIds, {
      name: `${term} Place Of Origin`,
      roles: [addressRoles.placeOfOrigin],
    });
    await insPages.addressBookList.open();

    await insPages.addressBookList.filter({ term, submitWith: 'button', label: roleOptionLabels[addressRoles.placeOfOrigin] });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
  });

  test('a role filter chosen and not submitted leaves the URL, the results line and the listed rows unchanged', async ({
    insPages,
    addressBookApi,
    page,
  }) => {
    const { searchTerm, runAddresses } = await createRunAddresses(addressBookApi, createdAddressIds);
    await insPages.addressBookList.open();
    await insPages.addressBookList.search(searchTerm, { submitWith: 'button' });
    const originAddresses = runAddressesOnTab(runAddresses, originOrConsignorTab);
    const resultsLine = `Showing 1-${originAddresses.length} of ${originAddresses.length}`;
    await expect(insPages.addressBookList.resultsLine).toHaveText(resultsLine);
    const urlBeforeChoosing = page.url();

    await insPages.addressBookList.chooseTypeFilter(roleOptionLabels[addressRoles.consignor]);

    await expect(insPages.addressBookList.selectedTypeFilterOption).toHaveText(roleOptionLabels.CONSIGNOR);
    await expect(page).toHaveURL(urlBeforeChoosing);
    expect(new URL(page.url()).searchParams.get('role')).toBe('');
    await expect(insPages.addressBookList.resultsLine).toHaveText(resultsLine);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(originAddresses.length);
    for (const { name } of originAddresses) {
      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });

  test('the tab stays selected after a role filter is submitted, listing only the address holding the role', async ({
    insPages,
    addressBookApi,
  }) => {
    const { runAddresses } = await createRunAddressesAndFilterListByRole(
      { insPages, api: addressBookApi, createdAddressIds },
      addressRoles.consignor,
    );

    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(runAddresses.consignor.name)).toBeVisible();
  });

  test('following another tab after a role filter keeps the search, resets the role filter and lists that tab', async ({
    insPages,
    addressBookApi,
  }) => {
    const { searchTerm, runAddresses } = await createRunAddressesAndFilterListByRole(
      { insPages, api: addressBookApi, createdAddressIds },
      addressRoles.consignor,
    );

    await insPages.addressBookList.followTab(destinationConsigneeOrImporterTab);

    const destinationAddresses = runAddressesOnTab(runAddresses, destinationConsigneeOrImporterTab);
    await expect(insPages.addressBookList.selectedTab).toHaveText(destinationConsigneeOrImporterTab.label);
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toHaveValue(searchTerm);
    await expect(insPages.addressBookList.selectedTypeFilterOption).toHaveText(typeFilterPlaceholder);
    await expect(insPages.addressBookList.resultsLine).toHaveText(
      `Showing 1-${destinationAddresses.length} of ${destinationAddresses.length}`,
    );
    for (const { name, rolesLabel } of destinationAddresses) {
      await expect(insPages.addressBookList.rolesCell(name)).toHaveText(rolesLabel);
    }
  });

  test('an address saved with Consignor ticked is found by searching Consignor, and one saved with only Place of origin ticked is not', async ({
    insPages,
    insJourney,
  }) => {
    const nameSuffix = Date.now();
    const consignorName = `Label Role Farm ${nameSuffix}`;
    const placeOfOriginName = `Label Role Farm ${nameSuffix} Other`;
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(consignorName, UNITED_KINGDOM), {
      roles: [addressRoles.consignor],
    });
    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(placeOfOriginName, UNITED_KINGDOM), {
      roles: [addressRoles.placeOfOrigin],
    });

    await expect(async () => {
      await insPages.addressBookList.search(rolesQuestionLabels[addressRoles.consignor], { submitWith: 'button' });

      expect(await insPages.addressBookList.followNextPageUntilShown(insPages.addressBookList.row(consignorName))).toBe(true);
    }).toPass({ timeout: timeouts.medium });

    await insPages.addressBookList.search(rolesQuestionLabels[addressRoles.consignor], { submitWith: 'button' });

    expect(await insPages.addressBookList.followNextPageUntilShown(insPages.addressBookList.row(placeOfOriginName))).toBe(false);
  });

  test('a search for a role label with a role filter chosen lists the address holding that role, found on whichever result page it falls', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Label Search ${Date.now()}`;
    await createAddressHolding(addressBookApi, createdAddressIds, {
      name,
      roles: [addressRoles.placeOfOrigin, addressRoles.consignor],
    });

    await expect(async () => {
      await insPages.addressBookList.open();
      await insPages.addressBookList.filter({
        term: 'consignor',
        submitWith: 'button',
        label: roleOptionLabels[addressRoles.placeOfOrigin],
      });

      expect(await insPages.addressBookList.followNextPageUntilShown(insPages.addressBookList.row(name))).toBe(true);
    }).toPass({ timeout: timeouts.medium });

    await expect(insPages.addressBookList.rolesCell(name)).toHaveText(rolesLabelOf([addressRoles.placeOfOrigin, addressRoles.consignor]));
  });
});

test.describe('Address book role filter without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a role filter chosen and submitted with the Search button lists only the addresses holding it', async ({
    insPages,
    addressBookApi,
  }) => {
    const { runAddresses } = await createRunAddressesAndFilterListByRole(
      { insPages, api: addressBookApi, createdAddressIds },
      addressRoles.consignor,
    );

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(runAddresses.consignor.name)).toBeVisible();
  });
});
