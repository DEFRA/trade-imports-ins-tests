import { test, expect, type PageFixtures } from '@fixtures';
import { expectNoMatchesListed } from './expect-address-book-list';
import { addressWithLineTwoAndCounty, traderAddress } from './trader-address';

const SUBMIT_METHODS = [
  { submitWith: 'button', how: 'the Search button' },
  { submitWith: 'enter', how: 'Enter in the Search field' },
] as const;

const SEARCHED_ADDRESS_FIELDS = [
  { field: 'addressLine2', label: 'address line 2' },
  { field: 'county', label: 'county' },
] as const;

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
  await expect(insPages.addressBookList.mainLinks).toHaveText(['Clear search', `View ${name}`]);
};

test.describe('Address book list', () => {
  test('shows the intro and Add a new address, with the Search field hidden until Filter addresses is opened', async ({ insPages }) => {
    await insPages.addressBookList.open();

    await expect(insPages.addressBookList.intro).toBeVisible();
    await expect(insPages.addressBookList.btnAddNewAddress).toBeVisible();
    await expect(insPages.addressBookList.inputSearch).toBeHidden();
    await insPages.addressBookList.filterSummary.click();
    await expect(insPages.addressBookList.inputSearch).toBeVisible();
  });

  for (const { submitWith, how } of SUBMIT_METHODS) {
    test(`a search submitted with ${how} lists the address it matches`, async ({ insPages, addressBookApi }) => {
      await addAddressAndExpectSearchToListIt({ insPages, addressBookApi }, `Searchable${submitWith}${Date.now()}`, submitWith);
    });
  }

  test('a search matching nothing shows Showing 0 of 0, the column headers, no rows and Clear search as the only link', async ({
    insPages,
  }) => {
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`NoMatch${Date.now()}`, { submitWith: 'button' });

    await expectNoMatchesListed(insPages.addressBookList);
  });

  test('an address is found, viewed, kept on No, cancel, deleted on Yes, delete and left out of search, through links alone', async ({
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
    await insPages.addressBookList.pageLink(2).click();
    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 9-9 of 9');
    await expect(insPages.addressBookList.bodyRows).toHaveCount(1);
  });

  for (const { field, label } of SEARCHED_ADDRESS_FIELDS) {
    test(`a search finds an address by a lower-case word inside its ${label}`, async ({ insPages, addressBookApi }) => {
      const stamp = Date.now();
      const name = `${label} Farm ${stamp}`;
      const fieldValue = `Searchable${field}${stamp}`;
      await addressBookApi.createAddress(addressWithLineTwoAndCounty(name, { [field]: fieldValue }));
      await insPages.addressBookList.open();

      await insPages.addressBookList.search(fieldValue.toLowerCase(), { submitWith: 'button' });

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

    await expect(insPages.addressBookList.addressCell(fiveLineName)).toHaveText(/^1 Trader Lane,\nUnit 9,\nCarlisle,\nCumbria,\nCA1 3CC$/, {
      useInnerText: true,
    });
    await expect(insPages.addressBookList.addressCell(threeLineName)).toHaveText(/^1 Trader Lane,\nCarlisle,\nCA1 3CC$/, {
      useInnerText: true,
    });
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
