import { test, expect } from '@fixtures';
import { traderAddress } from '@domain/ins/constants/trader-address';
import {
  addressBookTabs,
  addressTypes,
  addressUses,
  destinationConsigneeOrImporterTab,
  originOrConsignorTab,
  typeOptionPlaceholder,
  typeOptionTexts,
} from '@domain/shared/constants/address-types';
import { timeouts } from '@config/timeouts';
import {
  createAddressHolding,
  createStamped,
  createdAddressIdsDeletedAfterEachTest,
  isolatedOrganisationAddressIdsDeletedAfterEachTest,
  stampedAddressesOnTab,
  stampedSearchTermOf,
  typeLabelOf,
} from './stamped-addresses';

const createdAddressIds = createdAddressIdsDeletedAfterEachTest();

const typeFilterTermOf = (scenario: string) => `Typefilter ${scenario} ${Date.now()}`;

test.describe('Address book Type filter API', () => {
  const isolatedOrganisationAddressIds = isolatedOrganisationAddressIdsDeletedAfterEachTest();

  test('listing by a use returns exactly the stamped addresses holding it, and none for a use nothing holds', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(isolatedOrganisationAddressBookApi, stamp, isolatedOrganisationAddressIds);

    for (const use of Object.values(addressUses)) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(stampedSearchTermOf(stamp), { use });

      expect(listed.map(({ name }) => name).sort()).toEqual(
        Object.values(stamped)
          .filter(({ uses }) => uses?.includes(use))
          .map(({ name }) => name)
          .sort(),
      );
    }
  });
});

test.describe('Address book Type filter', () => {
  test('each tab, reached through its link, offers Select one with no value and then only its own Types', async ({ insPages }) => {
    await insPages.addressBookList.open();

    for (const tab of addressBookTabs) {
      await insPages.addressBookList.followTab(tab);

      await expect(insPages.addressBookList.selectedTab).toHaveText(tab.label);
      await expect(insPages.addressBookList.typeOptions).toHaveText([
        typeOptionPlaceholder,
        ...tab.typeOptions.map((use) => typeOptionTexts[use]),
      ]);
      await expect(insPages.addressBookList.typeOptions.first()).toHaveAttribute('value', '');
    }
  });

  test('a Type finds the addresses holding it beyond the first page of the tab, counted and without pagination', async ({
    insPages,
    addressBookApi,
  }) => {
    const term = typeFilterTermOf('beyond first page');
    for (const suffix of ['First Consignor', 'Second Consignor']) {
      await createAddressHolding(addressBookApi, createdAddressIds, {
        name: `${term} ${suffix}`,
        addressType: addressTypes.originOrConsignor,
        uses: [addressUses.consignor],
      });
    }
    for (let index = 1; index <= 9; index++) {
      createdAddressIds.push((await addressBookApi.createAddress(traderAddress(`${term} Place Of Origin ${index}`))).id);
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

  test('a Type that runs past one page is counted and paged, and the next page keeps the tab, the search and the Type', async ({
    insPages,
    addressBookApi,
    page,
  }) => {
    const term = typeFilterTermOf('paged');
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
    await expect(insPages.addressBookList.selectedTypeOption).toHaveText(typeOptionTexts.CONSIGNOR);
  });

  test('a Type matching one address counts one', async ({ insPages, addressBookApi }) => {
    const term = typeFilterTermOf('counts one');
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

  test('a Type chosen and not submitted leaves the URL, the results line and the listed rows unchanged', async ({
    insPages,
    addressBookApi,
    page,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);
    await insPages.addressBookList.open();
    await insPages.addressBookList.search(stampedSearchTermOf(stamp), { submitWith: 'button' });
    const originAddresses = stampedAddressesOnTab(stamped, originOrConsignorTab);
    const resultsLine = `Showing 1-${originAddresses.length} of ${originAddresses.length}`;
    await expect(insPages.addressBookList.resultsLine).toHaveText(resultsLine);
    const urlBeforeChoosing = page.url();

    await insPages.addressBookList.chooseType(addressUses.consignor);

    await expect(insPages.addressBookList.selectedTypeOption).toHaveText(typeOptionTexts.CONSIGNOR);
    await expect(page).toHaveURL(urlBeforeChoosing);
    expect(new URL(page.url()).searchParams.get('use')).toBe('');
    await expect(insPages.addressBookList.resultsLine).toHaveText(resultsLine);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(originAddresses.length);
    for (const { name } of originAddresses) {
      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });

  test('the tab stays selected after a Type is submitted, and following another tab keeps the search, resets the Type and lists that tab', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);
    await insPages.addressBookList.open();

    await insPages.addressBookList.filter({ term: stampedSearchTermOf(stamp), submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.consignor.name)).toBeVisible();

    await insPages.addressBookList.followTab(destinationConsigneeOrImporterTab);

    const destinationAddresses = stampedAddressesOnTab(stamped, destinationConsigneeOrImporterTab);
    await expect(insPages.addressBookList.selectedTab).toHaveText(destinationConsigneeOrImporterTab.label);
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toHaveValue(stampedSearchTermOf(stamp));
    await expect(insPages.addressBookList.selectedTypeOption).toHaveText(typeOptionPlaceholder);
    await expect(insPages.addressBookList.resultsLine).toHaveText(
      `Showing 1-${destinationAddresses.length} of ${destinationAddresses.length}`,
    );
    for (const { name, typeLabel } of destinationAddresses) {
      await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabel);
    }
  });

  test('a search for a use label with a Type chosen lists the address holding that use, found on whichever result page it falls', async ({
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

    await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabelOf([addressUses.placeOfOrigin, addressUses.consignor]));
  });
});

test.describe('Address book Type filter without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a Type chosen and submitted with the Search button lists only the addresses holding it', async ({ insPages, addressBookApi }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);
    await insPages.addressBookList.open();

    await insPages.addressBookList.filter({ term: stampedSearchTermOf(stamp), submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.consignor.name)).toBeVisible();
  });
});
