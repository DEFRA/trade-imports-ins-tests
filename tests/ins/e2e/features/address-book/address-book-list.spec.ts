import { escapeRegex } from '@page-objects/shared/escape-regex';
import { test, expect, type PageFixtures } from '@fixtures';
import { expectSearchedListLinks, expectNoMatchesListed } from './expect-address-book-list';
import { destinationConsigneeOrImporterTab, originOrConsignorTab, roleOptionLabels } from '@domain/ins/constants/address-book-types';
import { addressRoles } from '@domain/shared/constants/address-types';
import { addFormAddressWithLineTwoAndCounty, addressWithLineTwoAndCounty, traderAddress } from '@domain/ins/constants/trader-address';

const SUBMIT_METHODS = [
  { submitWith: 'button', how: 'the Search button' },
  { submitWith: 'enter', how: 'Enter in the Search field' },
] as const;

const SEARCHED_ADDRESS_FIELDS = [
  { field: 'addressLine2', label: 'address line 2' },
  { field: 'county', label: 'county' },
] as const;

const LINE_TWO_AND_COUNTY_ADDRESS_CELL = /^1 Trader Lane,\nUnit 9,\nCarlisle,\nCumbria,\nCA1 3CC$/;

const addAddressAndExpectSearchToListIt = async (
  { insPages, addressBookApi }: Pick<PageFixtures, 'insPages' | 'addressBookApi'>,
  name: string,
  submitWith: 'button' | 'enter',
) => {
  await addressBookApi.createAddress(traderAddress(name));
  await insPages.addressBookList.open();

  await insPages.addressBookList.search(name, { submitWith });

  await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
  await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
  await expect(insPages.addressBookList.row(name)).toBeVisible();
  await expectSearchedListLinks(insPages.addressBookList, `View ${name}`);
};

test.describe('Address book list', () => {
  test(
    'shows the intro and Add a new address, with the Search field hidden until Filter addresses is opened',
    { tag: '@cross-browser' },
    async ({ insPages }) => {
      await insPages.addressBookList.open();

      await expect(insPages.addressBookList.intro).toBeVisible();
      await expect(insPages.addressBookList.btnAddNewAddress).toBeVisible();
      await expect(insPages.addressBookList.inputSearch).toBeHidden();
      await insPages.addressBookList.filterSummary.click();
      await expect(insPages.addressBookList.inputSearch).toBeVisible();
    },
  );

  for (const { submitWith, how } of SUBMIT_METHODS) {
    test(`a search submitted with ${how} lists the address it matches`, async ({ insPages, addressBookApi }) => {
      await addAddressAndExpectSearchToListIt({ insPages, addressBookApi }, `Searchable${submitWith}${Date.now()}`, submitWith);
    });
  }

  test('a search matching nothing shows Showing 0 of 0, the column headers, no rows and Clear search as the only link below the tabs', async ({
    insPages,
  }) => {
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`NoMatch${Date.now()}`, { submitWith: 'button' });

    await expectNoMatchesListed(insPages.addressBookList);
  });

  test('Clear search returns to the searched tab with its Type filter kept, no search applied and the Search field empty', async ({
    pages,
    insPages,
  }) => {
    const { addressType } = destinationConsigneeOrImporterTab;
    await insPages.addressBookList.open({ addressType });
    await insPages.addressBookList.filter({
      term: `NoMatch${Date.now()}`,
      label: roleOptionLabels[addressRoles.importer],
      submitWith: 'button',
    });

    await insPages.addressBookList.linkClearSearch.click();

    await expect(pages.page).toHaveURL(new RegExp(`${escapeRegex(insPages.addressBookList.expectedUrl)}\\?`));
    expect(Object.fromEntries(new URL(pages.page.url()).searchParams)).toEqual({ addressType, role: addressRoles.importer });
    await expect(insPages.addressBookList.selectedTab).toHaveText(destinationConsigneeOrImporterTab.label);
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toHaveValue('');
    await expect(insPages.addressBookList.selectedTypeFilterOption).toHaveText(roleOptionLabels.IMPORTER);
  });

  test('an address is found from the dashboard, viewed, kept on No, cancel, then deleted on Yes, delete and no longer found by search', async ({
    insPages,
    addressBookApi,
  }) => {
    const name = `Walk Through Farm ${Date.now()}`;
    await addressBookApi.createAddress(traderAddress(name));

    await insPages.dashboard.open();
    await insPages.dashboard.linkAddressBook.click();
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await insPages.addressBookList.viewLink(name).click();
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
    await insPages.addressBookView.btnDelete.click();
    await expect(insPages.addressBookDelete.heading).toBeVisible();
    await insPages.addressBookDelete.cancel();
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
    await insPages.addressBookView.btnDelete.click();
    await insPages.addressBookDelete.confirm();

    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address deleted`);
    await insPages.addressBookList.search(name, { submitWith: 'button' });
    await expectNoMatchesListed(insPages.addressBookList);
  });

  test('lists 8 addresses a page and the rest on the next page', async ({ insPages, addressBookApi }) => {
    const stamp = Date.now();
    await Promise.all(
      Array.from({ length: 9 }, (_, index) => addressBookApi.createAddress(traderAddress(`Paged Farm ${stamp} number ${index}`))),
    );
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`Paged Farm ${stamp}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-8 of 9');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(8);
    await insPages.addressBookList.paginationPageLink(2).click();
    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 9-9 of 9');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
  });

  test('a search over five pages links the first, current, neighbouring and last pages, with an ellipsis for each gap', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const { addressBookList } = insPages;
    await Promise.all(
      Array.from({ length: 33 }, (_, index) => addressBookApi.createAddress(traderAddress(`Truncated Farm ${stamp} number ${index}`))),
    );
    await addressBookList.open();

    await addressBookList.search(`Truncated Farm ${stamp}`, { submitWith: 'button' });

    await expect(addressBookList.resultsLine).toHaveText('Showing 1-8 of 33');
    await expect(addressBookList.paginationItems).toHaveText(['1', '2', '⋯', '5']);
    await expect(addressBookList.currentPaginationPageLink).toHaveText('1');
    await addressBookList.paginationPageLink(5).click();
    await expect(addressBookList.resultsLine).toHaveText('Showing 33-33 of 33');
    await expect(addressBookList.paginationItems).toHaveText(['1', '⋯', '4', '5']);
    await expect(addressBookList.currentPaginationPageLink).toHaveText('5');
    await addressBookList.paginationPageLink(4).click();
    await expect(addressBookList.resultsLine).toHaveText('Showing 25-32 of 33');
    await expect(addressBookList.paginationItems).toHaveText(['1', '⋯', '3', '4', '5']);
    await expect(addressBookList.currentPaginationPageLink).toHaveText('4');
  });

  for (const { field, label } of SEARCHED_ADDRESS_FIELDS) {
    test(`a search finds an address by a lower-case word inside its ${label}`, async ({ insPages, addressBookApi }) => {
      const stamp = Date.now();
      const name = `${label} Farm ${stamp}`;
      const searchedWord = `Searchable${field}${stamp}`;
      await addressBookApi.createAddress(addressWithLineTwoAndCounty(name, { [field]: `North ${searchedWord} Side` }));
      await insPages.addressBookList.open();

      await insPages.addressBookList.search(searchedWord.toLowerCase(), { submitWith: 'button' });

      await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
      await expect(insPages.addressBookList.row(name)).toBeVisible();
    });
  }

  test('a multi-word name shows its first word then the rest on two lines, and a one-word name on one line', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const multiWordName = `Green valley farm ${stamp}`;
    const oneWordName = `Hollin${stamp}`;
    await addressBookApi.createAddress(traderAddress(multiWordName));
    await addressBookApi.createAddress(traderAddress(oneWordName));
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(multiWordName, { submitWith: 'button' });

    await expect(insPages.addressBookList.nameCell(multiWordName)).toHaveText(new RegExp(`^Green\\nvalley farm ${stamp}$`), {
      useInnerText: true,
    });
    await insPages.addressBookList.search(oneWordName, { submitWith: 'button' });
    await expect(insPages.addressBookList.nameCell(oneWordName)).toHaveText(new RegExp(`^Hollin${stamp}$`), {
      useInnerText: true,
    });
  });

  test('each stored address line shows on its own line, each but the last ending in a comma, with blank lines left out', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const fiveLineName = `Lines ${stamp} fiveline`;
    const threeLineName = `Lines ${stamp} threeline`;
    await addressBookApi.createAddress(addressWithLineTwoAndCounty(fiveLineName));
    await addressBookApi.createAddress(traderAddress(threeLineName));
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`Lines ${stamp}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.addressCell(fiveLineName)).toHaveText(LINE_TWO_AND_COUNTY_ADDRESS_CELL, {
      useInnerText: true,
    });
    await expect(insPages.addressBookList.addressCell(threeLineName)).toHaveText(/^1 Trader Lane,\nCarlisle,\nCA1 3CC$/, {
      useInnerText: true,
    });
  });

  test('an address added through the form lands on the Origin and Consignor tab of the list with its success banner, its address and country, and a View link to its own page', async ({
    pages,
    insPages,
    insJourney,
  }) => {
    const name = `Added Farm ${Date.now()}`;

    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(name, 'France'));

    await expect(pages.page).toHaveURL(insPages.addressBookList.tabUrlPattern(originOrConsignorTab));
    await expect(
      insPages.addressBookList.successBanner.getByText(`${name} address added to your address book`, { exact: true }),
    ).toBeVisible();
    await insPages.addressBookList.search(name, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-1 of 1');
    await expect(insPages.addressBookList.addressCell(name)).toHaveText(LINE_TWO_AND_COUNTY_ADDRESS_CELL, {
      useInnerText: true,
    });
    await expect(insPages.addressBookList.countryCell(name)).toHaveText('France');
    await insPages.addressBookList.viewLink(name).click();
    await expect(insPages.addressBookView.heading(name)).toBeVisible();
  });

  test('an address added through the form lands on the list with its success banner, and is listed ahead of an older address', async ({
    insPages,
    insJourney,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const olderName = `Newest first ${stamp} older`;
    const newerName = `Newest first ${stamp} newer`;
    await addressBookApi.createAddress(traderAddress(olderName));

    await insJourney.addAddressFromList(addFormAddressWithLineTwoAndCounty(newerName, 'France'));
    await expect(insPages.addressBookList.successBanner).toContainText(`${newerName} address added to your address book`);
    await insPages.addressBookList.search(`Newest first ${stamp}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 1-2 of 2');
    await expect(insPages.addressBookList.viewLinks).toHaveText([`View ${newerName}`, `View ${olderName}`]);
  });

  test('an address added through the form is found by a search on its name, part of its address and part of its country name', async ({
    insPages,
    insJourney,
  }) => {
    const stamp = Date.now();
    const name = `Findable Farm ${stamp}`;
    const details = { ...addFormAddressWithLineTwoAndCounty(name, 'France'), addressLine1: `${stamp} Drover Lane` };
    await insJourney.addAddressFromList(details);

    for (const term of [name, `${stamp} drover`, 'fran']) {
      await insPages.addressBookList.search(term, { submitWith: 'button' });

      await expect(insPages.addressBookList.row(name)).toBeVisible();
    }
  });

  test('the success banner after an edit is still showing 10 seconds later, and a reload shows no banner', async ({
    pages,
    insPages,
    addressBookApi,
  }) => {
    const name = `Banner Farm ${Date.now()}`;
    const created = await addressBookApi.createAddress(traderAddress(name));
    await pages.page.clock.install();
    await insPages.addressBookEdit.open(created.id);
    await insPages.addressBookEdit.save();

    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address updated`);
    await pages.page.clock.runFor(10_000);
    await expect(insPages.addressBookList.successBanner).toContainText(`${name} address updated`);
    await pages.page.reload();

    await expect(insPages.addressBookList.heading).toBeVisible();
    await expect(insPages.addressBookList.successBanner).toHaveCount(0);
  });
});

test.describe('Address book list without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Filter addresses opens to show the Search field', async ({ insPages }) => {
    await insPages.addressBookList.open();
    await expect(insPages.addressBookList.inputSearch).toBeHidden();

    await insPages.addressBookList.filterSummary.click();

    await expect(insPages.addressBookList.inputSearch).toBeVisible();
  });

  for (const { submitWith, how } of SUBMIT_METHODS) {
    test(`a search submitted with ${how} and JavaScript is off lists the address it matches`, async ({ insPages, addressBookApi }) => {
      await addAddressAndExpectSearchToListIt({ insPages, addressBookApi }, `Scriptless${submitWith}${Date.now()}`, submitWith);
    });
  }
});
