import { test, expect } from '@fixtures';

// The page holds nothing until a query reaches it, so each commodity is found
// by its own code. Cat and Dog share 01061900, so that query returns both.
const expectedGroups = [
  ['Cow (0102)', '0102', ['Bison bison', 'Bos spp.', 'Bos taurus', 'Bubalus bubalis']],
  ['Horse (0101)', '0101', ['Equus caballus']],
  ['Cat (01061900)', '01061900', ['Felis catus']],
  ['Dog (01061900)', '01061900', ['Canis lupus familiaris']],
  ['Fish (0301)', '0301', ['Salmo salar']],
] as const;

test.describe('Commodity selection page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toCommoditySelection();
  });

  test('offers a search box and lists nothing until it is used', async ({ pages }) => {
    await expect(pages.commoditySelection.heading).toBeVisible();
    await expect(pages.commoditySelection.searchBox).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
    await expect(pages.commoditySelection.selectionPanel).toHaveCount(0);
    await expect(pages.commoditySelection.saveAndContinue).toBeVisible();
  });

  test('lists nothing for a query shorter than three characters', async ({ pages }) => {
    await pages.commoditySelection.search('Bo');
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('groups the matching species under their commodity heading', async ({ pages }) => {
    for (const [legend, query, species] of expectedGroups) {
      await pages.commoditySelection.search(query);
      const group = pages.page.getByRole('group', { name: legend });
      await expect(group).toBeVisible();
      for (const name of species) {
        await expect(group.getByRole('checkbox', { name })).toBeVisible();
      }
    }
  });

  test('says so when nothing matches', async ({ pages }) => {
    await pages.commoditySelection.search('zzz');
    await expect(pages.page.getByText('No results found')).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('accepts and persists multiple commodity-species pairs found under different queries', async ({ pages }) => {
    test.slow();

    await pages.commoditySelection.selectSpecies(['Bos taurus', 'Felis catus']);
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    // Commodity details is a hub task of its own, so its back link returns to
    // the overview. Reopen the selection from the row that owns it.
    await pages.consignmentDetails.linkBack.click();
    await expect(pages.overview.heading).toBeVisible();
    await pages.overview.task('What are you importing?').click();

    // Back on the page, both pairs are listed under the running count without
    // any query — a choice made under an earlier query is never lost.
    await expect(pages.commoditySelection.selectionPanel).toContainText('2 selected');
    await expect(pages.commoditySelection.selectionPanel).toContainText('Bos taurus');
    await expect(pages.commoditySelection.selectionPanel).toContainText('Felis catus');

    // And each is ticked again when its own query brings it back on screen.
    await pages.commoditySelection.search('Bos taurus');
    await expect(pages.commoditySelection.species('Bos taurus')).toBeChecked();
    await pages.commoditySelection.search('Felis catus');
    await expect(pages.commoditySelection.species('Felis catus')).toBeChecked();
  });

  test('counts what has been chosen and clears it on request', async ({ pages }) => {
    await pages.commoditySelection.selectSpecies(['Bos taurus']);
    // The panel is written on the server, so it appears on the next render.
    await pages.commoditySelection.search('Salmo');
    await expect(pages.commoditySelection.selectionPanel).toContainText('1 selected');
    await expect(pages.commoditySelection.selectionPanel).toContainText('Bos taurus');

    await pages.commoditySelection.clearAll.click();
    await expect(pages.commoditySelection.selectionPanel).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a commodity' })).toBeVisible();
  });
});
