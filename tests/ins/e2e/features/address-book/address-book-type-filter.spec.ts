import { test, expect } from '@fixtures';
import { addressTypes, addressUses, heldAsPlaceOfOrigin } from '@domain/shared/constants/address-types';
import {
  addressBookTabs,
  destinationConsigneeOrImporterTab,
  originOrConsignorTab,
  useOptionLabels,
  useFilterPlaceholder,
} from '@domain/ins/constants/address-book-types';
import { timeouts } from '@config/timeouts';
import {
  addressIdsDeletedAfterEachTest,
  createAddressHolding,
  createStamped,
  createStampedAndFilterListByUse,
  stampedAddressesOnTab,
  usesLabelOf,
} from './stamped-addresses';

const createdAddressIds = addressIdsDeletedAfterEachTest('addressBookApi');

const useFilterTermOf = (scenario: string) => `Usefilter ${scenario} ${Date.now()}`;

test.describe('Address book use filter API', () => {
  const isolatedOrganisationAddressIds = addressIdsDeletedAfterEachTest('isolatedOrganisationAddressBookApi');

  test('listing by a use returns exactly the stamped addresses holding it, and none for a use nothing holds', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const { searchTerm, stamped } = await createStamped(isolatedOrganisationAddressBookApi, isolatedOrganisationAddressIds);

    for (const use of Object.values(addressUses)) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTerm, { use });

      expect(listed.map(({ name }) => name).sort()).toEqual(
        Object.values(stamped)
          .filter(({ uses }) => uses?.includes(use))
          .map(({ name }) => name)
          .sort(),
      );
    }
  });
});

test.describe('Address book use filter', () => {
  test('each tab, reached through its link, offers Select one with no value and then only its own uses', async ({
    insPages,
    insJourney,
  }) => {
    for (const tab of addressBookTabs) {
      await insJourney.toAddressBookTab(tab);

      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await expect(insPages.addressBookList.useFilterOptions).toHaveText([
        useFilterPlaceholder,
        ...tab.useFilterOptions.map((use) => useOptionLabels[use]),
      ]);
      await expect(insPages.addressBookList.useFilterOptions.first()).toHaveAttribute('value', '');
    }
  });

  test('a use filter finds the addresses holding it beyond the first page of the tab, counted and without pagination', async ({
    insPages,
    addressBookApi,
  }) => {
    const term = useFilterTermOf('beyond first page');
    for (const suffix of ['First Consignor', 'Second Consignor']) {
      await createAddressHolding(addressBookApi, createdAddressIds, {
        name: `${term} ${suffix}`,
        addressType: addressTypes.originOrConsignor,
        uses: [addressUses.consignor],
      });
    }
    for (let index = 1; index <= 9; index++) {
      await createAddressHolding(addressBookApi, createdAddressIds, { name: `${term} Place Of Origin ${index}`, ...heldAsPlaceOfOrigin });
    }
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(term, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 11');

    await insPages.addressBookList.filter({ term, submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-2 of 2');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(2);
    await expect(insPages.addressBookList.row(`${term} First Consignor`)).toBeVisible();
    await expect(insPages.addressBookList.row(`${term} Second Consignor`)).toBeVisible();
    await expect(insPages.addressBookList.pagination).toHaveCount(0);
  });

  test('a use filter that runs past one page is counted and paged, and the next page keeps the tab, the search and the use filter', async ({
    insPages,
    addressBookApi,
    page,
  }) => {
    const term = useFilterTermOf('paged');
    for (let index = 1; index <= 9; index++) {
      await createAddressHolding(addressBookApi, createdAddressIds, {
        name: `${term} Consignor ${index}`,
        addressType: addressTypes.originOrConsignor,
        uses: [addressUses.consignor],
      });
    }
    await insPages.addressBookList.open();

    await insPages.addressBookList.filter({ term, submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 9');
    const href = await insPages.addressBookList.linkNextPage.getAttribute('href');
    const next = new URL(href ?? '', page.url());
    expect(next.searchParams.get('addressType')).toBe(addressTypes.originOrConsignor);
    expect(next.searchParams.get('q')).toBe(term);
    expect(next.searchParams.get('use')).toBe(addressUses.consignor);
    expect(next.searchParams.get('page')).toBe('2');

    await insPages.addressBookList.linkNextPage.click();

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 9-9 of 9');
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.selectedUseFilterOption).toHaveText(useOptionLabels.CONSIGNOR);
  });

  test('a use filter matching one address counts one', async ({ insPages, addressBookApi }) => {
    const term = useFilterTermOf('counts one');
    await createAddressHolding(addressBookApi, createdAddressIds, {
      name: `${term} Consignor`,
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.consignor],
    });
    await createAddressHolding(addressBookApi, createdAddressIds, {
      name: `${term} Place Of Origin`,
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.placeOfOrigin],
    });
    await insPages.addressBookList.open();

    await insPages.addressBookList.filter({ term, submitWith: 'button', use: addressUses.placeOfOrigin });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
  });

  test('a use filter chosen and not submitted leaves the URL, the results line and the listed rows unchanged', async ({
    insPages,
    addressBookApi,
    page,
  }) => {
    const { searchTerm, stamped } = await createStamped(addressBookApi, createdAddressIds);
    await insPages.addressBookList.open();
    await insPages.addressBookList.search(searchTerm, { submitWith: 'button' });
    const originAddresses = stampedAddressesOnTab(stamped, originOrConsignorTab);
    const resultsLine = `Showing 1-${originAddresses.length} of ${originAddresses.length}`;
    await expect(insPages.addressBookList.resultsLine).toHaveText(resultsLine);
    const urlBeforeChoosing = page.url();

    await insPages.addressBookList.chooseUseFilter(addressUses.consignor);

    await expect(insPages.addressBookList.selectedUseFilterOption).toHaveText(useOptionLabels.CONSIGNOR);
    await expect(page).toHaveURL(urlBeforeChoosing);
    expect(new URL(page.url()).searchParams.get('use')).toBe('');
    await expect(insPages.addressBookList.resultsLine).toHaveText(resultsLine);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(originAddresses.length);
    for (const { name } of originAddresses) {
      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });

  test('the tab stays selected after a use filter is submitted, and following another tab keeps the search, resets the use filter and lists that tab', async ({
    insPages,
    addressBookApi,
  }) => {
    const { searchTerm, stamped } = await createStampedAndFilterListByUse(
      { insPages, api: addressBookApi, createdAddressIds },
      addressUses.consignor,
    );

    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.consignor.name)).toBeVisible();

    await insPages.addressBookList.followTab(destinationConsigneeOrImporterTab);

    const destinationAddresses = stampedAddressesOnTab(stamped, destinationConsigneeOrImporterTab);
    await expect(insPages.addressBookList.selectedTab).toHaveText(destinationConsigneeOrImporterTab.label);
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toHaveValue(searchTerm);
    await expect(insPages.addressBookList.selectedUseFilterOption).toHaveText(useFilterPlaceholder);
    await expect(insPages.addressBookList.resultsLine).toHaveText(
      `Showing 1-${destinationAddresses.length} of ${destinationAddresses.length}`,
    );
    for (const { name, usesLabel } of destinationAddresses) {
      await expect(insPages.addressBookList.usesCell(name)).toHaveText(usesLabel);
    }
  });

  test('a search for a use label with a use filter chosen lists the address holding that use, found on whichever result page it falls', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Label Search ${Date.now()}`;
    await createAddressHolding(addressBookApi, createdAddressIds, {
      name,
      addressType: addressTypes.originOrConsignor,
      uses: [addressUses.placeOfOrigin, addressUses.consignor],
    });

    await expect(async () => {
      await insPages.addressBookList.open();
      await insPages.addressBookList.filter({ term: 'consignor', submitWith: 'button', use: addressUses.placeOfOrigin });

      expect(await insPages.addressBookList.followResultPagesUntilRowShows(name)).toBe(true);
    }).toPass({ timeout: timeouts.medium });

    await expect(insPages.addressBookList.usesCell(name)).toHaveText(usesLabelOf([addressUses.placeOfOrigin, addressUses.consignor]));
  });
});

test.describe('Address book use filter without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a use filter chosen and submitted with the Search button lists only the addresses holding it', async ({
    insPages,
    addressBookApi,
  }) => {
    const { stamped } = await createStampedAndFilterListByUse({ insPages, api: addressBookApi, createdAddressIds }, addressUses.consignor);

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.consignor.name)).toBeVisible();
  });
});
