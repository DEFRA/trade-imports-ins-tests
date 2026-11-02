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
import { createStamped, deleteAddressesCreatedByEachTest, searchTermOf, stampedAddressesOnTab, typeLabelOf } from './stamped-addresses';

const createdAddressIds = deleteAddressesCreatedByEachTest();

const typeFilterTermOf = (stamp: number) => `Typefilter ${stamp}`;

test.describe('Address book Type filter API', () => {
  const isolatedOrganisationAddressIds: string[] = [];

  test.afterEach(async ({ isolatedOrganisationAddressBookApi }) => {
    for (const addressId of isolatedOrganisationAddressIds.splice(0)) {
      await isolatedOrganisationAddressBookApi.deleteAddress(addressId);
    }
  });

  test('listing by a use returns exactly the stamped addresses holding it, and none for a use nothing holds', async ({
    isolatedOrganisationAddressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(isolatedOrganisationAddressBookApi, stamp, isolatedOrganisationAddressIds);

    for (const use of Object.values(addressUses)) {
      const listed = await isolatedOrganisationAddressBookApi.listAddresses(searchTermOf(stamp), { use });

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
    const term = typeFilterTermOf(Date.now());
    for (const suffix of ['First Consignor', 'Second Consignor']) {
      createdAddressIds.push(
        (
          await addressBookApi.createAddress({
            ...traderAddress(`${term} ${suffix}`),
            addressType: addressTypes.originOrConsignor,
            uses: [addressUses.consignor],
          })
        ).id,
      );
    }
    for (let index = 1; index <= 9; index++) {
      createdAddressIds.push((await addressBookApi.createAddress(traderAddress(`${term} Without Uses ${index}`))).id);
    }
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(term, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 11');

    await insPages.addressBookList.search(term, { submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-2 of 2');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(2);
    await expect(insPages.addressBookList.row(`${term} First Consignor`)).toBeVisible();
    await expect(insPages.addressBookList.row(`${term} Second Consignor`)).toBeVisible();
    await expect(insPages.addressBookList.pagination).toHaveCount(0);
  });

  test('a Type that runs past one page is counted and paged, the next page keeps the tab, the search and the Type, and a Type matching one address counts one', async ({
    insPages,
    addressBookApi,
  }) => {
    const term = typeFilterTermOf(Date.now());
    for (let index = 1; index <= 9; index++) {
      createdAddressIds.push(
        (
          await addressBookApi.createAddress({
            ...traderAddress(`${term} Consignor ${index}`),
            addressType: addressTypes.originOrConsignor,
            uses: [addressUses.consignor],
          })
        ).id,
      );
    }
    createdAddressIds.push(
      (
        await addressBookApi.createAddress({
          ...traderAddress(`${term} Place Of Origin`),
          addressType: addressTypes.originOrConsignor,
          uses: [addressUses.placeOfOrigin],
        })
      ).id,
    );
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(term, { submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 9');
    await expect(insPages.addressBookList.linkNextPage).toHaveAttribute(
      'href',
      `/address-book?${new URLSearchParams({ addressType: addressTypes.originOrConsignor, q: term, use: addressUses.consignor, page: '2' })}`,
    );

    await insPages.addressBookList.linkNextPage.click();

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 9-9 of 9');
    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.selectedTypeOption).toHaveText(typeOptionTexts.CONSIGNOR);

    await insPages.addressBookList.search(term, { submitWith: 'button', use: addressUses.placeOfOrigin });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
  });

  test('the tab stays selected after a Type is submitted, and following another tab keeps the search, resets the Type and lists that tab', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(searchTermOf(stamp), { submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.selectedTab).toHaveText(originOrConsignorTab.label);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.consignor.name)).toBeVisible();

    await insPages.addressBookList.followTab(destinationConsigneeOrImporterTab);

    const destinationAddresses = stampedAddressesOnTab(stamped, destinationConsigneeOrImporterTab);
    await expect(insPages.addressBookList.selectedTab).toHaveText(destinationConsigneeOrImporterTab.label);
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toHaveValue(searchTermOf(stamp));
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
    createdAddressIds.push(
      (
        await addressBookApi.createAddress({
          ...traderAddress(name),
          addressType: addressTypes.originOrConsignor,
          uses: [addressUses.placeOfOrigin, addressUses.consignor],
        })
      ).id,
    );

    await expect(async () => {
      await insPages.addressBookList.open();
      await insPages.addressBookList.search('consignor', { submitWith: 'button', use: addressUses.placeOfOrigin });

      expect(await insPages.addressBookList.followResultPagesUntilRowShows(name)).toBe(true);
    }).toPass({ timeout: timeouts.medium });

    await expect(insPages.addressBookList.typeCell(name)).toHaveText(typeLabelOf([addressUses.placeOfOrigin, addressUses.consignor]));
  });
});

test.describe('Address book Type filter without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('a Type chosen and submitted with the Search button lists the same addresses', async ({ insPages, addressBookApi }) => {
    const stamp = Date.now();
    const stamped = await createStamped(addressBookApi, stamp, createdAddressIds);
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(searchTermOf(stamp), { submitWith: 'button', use: addressUses.consignor });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
    await expect(insPages.addressBookList.row(stamped.consignor.name)).toBeVisible();
  });
});
