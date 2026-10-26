import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';
import { SEARCH_HINT, SELECT_COMMODITY_ERROR } from '@domain/animals/constants/commodity-selection-page';

const NO_MATCH_QUERY = 'zzz';

const GROUPING_QUERIES = ['0102', 'cattle', 'horse', 'domestic cat', 'ostrich'];

const SEARCH_BOX_DESCRIPTION_WITH_ERROR = `${SEARCH_HINT} Error: ${SELECT_COMMODITY_ERROR}`;

test.describe('Commodity selection page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCommoditySelection();
  });

  test('offers a search box and lists nothing until it is used', async ({ pages, animalsPages }) => {
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.searchBox).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
    await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
    await expect(animalsPages.commoditySelection.saveAndContinue).toBeVisible();
  });

  test('shows the ITAHC inset and the search hint', async ({ animalsPages }) => {
    await expect(animalsPages.commoditySelection.itahcInset).toBeVisible();
    await expect(animalsPages.commoditySelection.searchHint).toBeVisible();
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

  test("groups the matching species under their commodity code, in reference-data's order", async ({
    pages,
    animalsPages,
    referenceDataApi,
  }) => {
    for (const query of GROUPING_QUERIES) {
      const groups = await referenceDataApi.listGroups(query);
      await animalsPages.commoditySelection.search(query);
      await expect(pages.page.getByRole('checkbox')).toHaveCount(groups.flatMap((group) => group.species).length);
      for (const { code, species } of groups) {
        const checkboxes = animalsPages.commoditySelection.commodityGroup(code).getByRole('checkbox');
        await expect(checkboxes).toHaveCount(species.length);
        for (const [index, { latinName }] of species.entries()) {
          await expect(checkboxes.nth(index)).toHaveAccessibleName(latinName);
        }
      }
    }
  });

  test('says so when nothing matches', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);
    await expect(pages.page.getByText('No results found')).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
  });

  test('accepts and persists multiple commodity-species pairs found under different queries', async ({ pages, animalsPages }) => {
    test.slow();

    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle, commodityLines.domesticCat]);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('What are you importing?').click();

    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('2 selected');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(commodityLines.cattle.latinName);
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(commodityLines.domesticCat.latinName);

    await animalsPages.commoditySelection.search(commodityLines.cattle.searchTerm);
    await expect(animalsPages.commoditySelection.species(commodityLines.cattle)).toBeChecked();
    await animalsPages.commoditySelection.search(commodityLines.domesticCat.searchTerm);
    await expect(animalsPages.commoditySelection.species(commodityLines.domesticCat)).toBeChecked();
  });

  test('counts what has been chosen and clears it on request', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle]);
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(commodityLines.cattle.latinName);

    await animalsPages.commoditySelection.clearAll.click();
    await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
  });

  test('shows an error on the search box when submitted empty', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.commoditySelection.errorSummary).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(SEARCH_BOX_DESCRIPTION_WITH_ERROR);
    await animalsPages.commoditySelection.errorSummaryLinks.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test('with results listed, keeps the "Select a commodity" error on the search box', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.search('Bos');
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(SEARCH_BOX_DESCRIPTION_WITH_ERROR);
    await expect(animalsPages.commoditySelection.commodityGroup(commodityLines.cattle.commodityCode)).toBeVisible();
    await animalsPages.commoditySelection.errorSummaryLinks.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test.describe('after a saved selection is cleared with save and return to overview', () => {
    test.beforeEach(async ({ animalsPages }) => {
      await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle]);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.clearAll.click();
      await animalsPages.commoditySelection.saveAndReturnToOverview.click();
      await expect(animalsPages.overview.heading).toBeVisible();
    });

    test('shows the commodity task as To do', async ({ animalsPages }) => {
      await expect(animalsPages.overview.taskStatus('What are you importing?')).toHaveText('To do');
    });

    test('refuses save and continue with "Select a commodity" on reopening the page', async ({ animalsPages }) => {
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.saveAndContinue.click();
      await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    });
  });
});
