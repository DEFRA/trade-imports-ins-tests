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
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCommoditySelection();
  });

  test('offers a search box and lists nothing until it is used', async ({ pages, animalsPages }) => {
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.searchBox).toBeVisible();
    await expect(animalsPages.commoditySelection.inset).toBeVisible();
    await expect(animalsPages.commoditySelection.searchHint).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
    await expect(animalsPages.commoditySelection.selectionPanel).toHaveCount(0);
    await expect(animalsPages.commoditySelection.saveAndContinue).toBeVisible();
  });

  test('explains commodity codes and links out to the Trade Tariff tool', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.commodityCodeHelp.click();
    await expect(animalsPages.commoditySelection.tradeTariffLink).toBeVisible();
    await expect(animalsPages.commoditySelection.tradeTariffLink).toHaveAttribute('href', 'https://www.gov.uk/trade-tariff');
    await expect(animalsPages.commoditySelection.tradeTariffLink).toHaveAttribute('target', '_blank');
  });

  test('lists nothing for a query shorter than three characters', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.search('Bo');
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('groups the matching species under their commodity heading', async ({ pages, animalsPages }) => {
    for (const [legend, query, species] of expectedGroups) {
      await animalsPages.commoditySelection.search(query);
      const group = pages.page.getByRole('group', { name: legend });
      await expect(group).toBeVisible();
      for (const name of species) {
        await expect(group.getByRole('checkbox', { name })).toBeVisible();
      }
    }
  });

  test('says so when nothing matches', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.search('zzz');
    await expect(pages.page.getByText('No results found')).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('accepts and persists multiple commodity-species pairs found under different queries', async ({ pages, animalsPages }) => {
    test.slow();

    await animalsPages.commoditySelection.selectSpecies(['Bos taurus', 'Felis catus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    // Saving returns to the overview. Reopen the selection from the row that
    // owns it.
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('What are you importing?').click();

    // Back on the page, both pairs are listed under the running count without
    // any query — a choice made under an earlier query is never lost.
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('2 selected');
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('Bos taurus');
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('Felis catus');

    // And each is ticked again when its own query brings it back on screen.
    await animalsPages.commoditySelection.search('Bos taurus');
    await expect(animalsPages.commoditySelection.species('Bos taurus')).toBeChecked();
    await animalsPages.commoditySelection.search('Felis catus');
    await expect(animalsPages.commoditySelection.species('Felis catus')).toBeChecked();
  });

  test('counts what has been chosen and clears it on request', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    // The panel is written on the server, so it appears on the next render.
    await animalsPages.commoditySelection.search('Salmo');
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('Bos taurus');

    await animalsPages.commoditySelection.clearAll.click();
    await expect(animalsPages.commoditySelection.selectionPanel).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(animalsPages.commoditySelection.selectCommodityErrorLink).toBeVisible();
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(/Select a commodity/);
    await animalsPages.commoditySelection.selectCommodityErrorLink.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test('with results listed, keeps the "Select a commodity" error on the search box', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.search('Bos');
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.commoditySelection.errorSummary).toBeVisible();
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(/Select a commodity/);
    await expect(animalsPages.commoditySelection.group('Cow (0102)')).toBeVisible();
    await expect(animalsPages.commoditySelection.group('Cow (0102)')).not.toContainText('Select a commodity');
    await animalsPages.commoditySelection.selectCommodityErrorLink.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test('save and return to overview: empties a cleared selection and shows the task as To do', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.clearAll.click();
    await animalsPages.commoditySelection.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummary).toBeHidden();
    await expect(animalsPages.overview.taskStatus('What are you importing?')).toHaveText('To do');
    await animalsPages.overview.task('What are you importing?').click();
    await expect(animalsPages.commoditySelection.selectionPanel).toHaveCount(0);
  });
});
