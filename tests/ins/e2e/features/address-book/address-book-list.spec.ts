import { test, expect, type PageFixtures } from '@fixtures';
import { addressWithLineTwoAndCounty, traderAddress } from './trader-address';

const SUBMIT_METHODS = [
  { submitWith: 'button', how: 'the Search button' },
  { submitWith: 'enter', how: 'Enter in the Search field' },
] as const;

const expectSearchListsTheMatch = async (
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
  await expect(insPages.addressBookList.mainLinks).toHaveText([`View ${name}`]);
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
      await expectSearchListsTheMatch({ insPages, addressBookApi }, `Searchable${submitWith}${Date.now()}`, submitWith);
    });
  }

  test('a search matching nothing shows Showing 0 of 0, the column headers, no rows and no links', async ({ insPages }) => {
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(`NoMatch${Date.now()}`, { submitWith: 'button' });

    await expect(insPages.addressBookList.resultsLine).toHaveText('Showing 0 of 0');
    await expect(insPages.addressBookList.columnHeaders).toHaveText(['Name', 'Address', 'Country', 'Action']);
    await expect(insPages.addressBookList.bodyRows).toHaveCount(0);
    await expect(insPages.addressBookList.mainLinks).toHaveText([]);
  });

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

    await insPages.addressBookList.search(String(stamp), { submitWith: 'button' });

    await expect(insPages.addressBookList.nameCell(multiWordName)).toHaveText(new RegExp(`^Green\\nvalley farm ${stamp}$`), {
      useInnerText: true,
    });
    await expect(insPages.addressBookList.nameCell(oneWordName)).toHaveText(new RegExp(`^Hollin${stamp}$`), {
      useInnerText: true,
    });
  });

  test('each stored address line shows on its own line, each but the last ending in a comma, with blank lines left out', async ({
    insPages,
    addressBookApi,
  }) => {
    const stamp = Date.now();
    const fiveLineName = `Fiveline${stamp}`;
    const threeLineName = `Threeline${stamp}`;
    await addressBookApi.createAddress(addressWithLineTwoAndCounty(fiveLineName));
    await addressBookApi.createAddress(traderAddress(threeLineName));
    await insPages.addressBookList.open();

    await insPages.addressBookList.search(String(stamp), { submitWith: 'button' });

    await expect(insPages.addressBookList.addressCell(fiveLineName)).toHaveText(/^3 Change Lane,\nUnit 9,\nCarlisle,\nCumbria,\nCA1 3CC$/, {
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
    test(`a search submitted with ${how} lists the address it matches`, async ({ insPages, addressBookApi }) => {
      await expectSearchListsTheMatch({ insPages, addressBookApi }, `Scriptless${submitWith}${Date.now()}`, submitWith);
    });
  }
});
