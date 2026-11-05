import { commodityLines, speciesLabel } from '@domain/animals/constants/commodity-lines';

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

  test("lists reference-data's groups by commodity heading and each group's species by label, in that order", async ({
    pages,
    animalsPages,
    referenceDataApi,
  }) => {
    for (const query of GROUPING_QUERIES) {
      const groups = await referenceDataApi.listGroups(query);
      expect(groups.length).toBeGreaterThan(0);
      const orderedGroups = [...groups]
        .sort((left, right) => left.code.localeCompare(right.code))
        .map((group) => ({
          ...group,
          species: [...group.species].sort((left, right) => speciesLabel(left).localeCompare(speciesLabel(right))),
        }));

      await animalsPages.commoditySelection.search(query);
      await expect(pages.page.getByRole('checkbox')).toHaveCount(orderedGroups.flatMap((group) => group.species).length);
      const commodityGroups = animalsPages.commoditySelection.commodityGroups;
      await expect(commodityGroups).toHaveCount(orderedGroups.length);
      for (const [index, { code }] of orderedGroups.entries()) {
        await expect(commodityGroups.nth(index)).toHaveAccessibleName(code);
      }
      for (const { code, species } of orderedGroups) {
        const checkboxes = animalsPages.commoditySelection.commodityGroup(code).getByRole('checkbox');
        await expect(checkboxes).toHaveCount(species.length);
        for (const [index, pair] of species.entries()) {
          await expect(checkboxes.nth(index)).toHaveAccessibleName(speciesLabel(pair));
        }
      }
    }
  });

  test('bolds the matched text in the commodity heading and in a species label', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.search(commodityLines.cattle.commodityCode);
    await expect(animalsPages.commoditySelection.commodityGroup(commodityLines.cattle.commodityCode).locator('legend strong')).toHaveText(
      commodityLines.cattle.commodityCode,
    );

    await animalsPages.commoditySelection.search(commodityLines.cattle.searchTerm);
    await expect(animalsPages.commoditySelection.commodityGroup(commodityLines.cattle.commodityCode).locator('label strong')).toHaveText(
      commodityLines.cattle.latinName,
    );
  });

  test('bolds the matched text inside the common name when a search matches it', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.search(commodityLines.raccoonDog.searchTerm);
    await expect(animalsPages.commoditySelection.speciesLabelMatch(commodityLines.raccoonDog)).toHaveText('Dog');
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
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(speciesLabel(commodityLines.cattle));
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(speciesLabel(commodityLines.domesticCat));

    await animalsPages.commoditySelection.search(commodityLines.cattle.searchTerm);
    await expect(animalsPages.commoditySelection.species(commodityLines.cattle)).toBeChecked();
    await animalsPages.commoditySelection.search(commodityLines.domesticCat.searchTerm);
    await expect(animalsPages.commoditySelection.species(commodityLines.domesticCat)).toBeChecked();
  });

  test('counts what has been chosen and clears it on request', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle]);
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText(speciesLabel(commodityLines.cattle));

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
    await animalsPages.commoditySelection.search(commodityLines.cattle.searchTerm);
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(animalsPages.commoditySelection.searchBox).toHaveAccessibleDescription(SEARCH_BOX_DESCRIPTION_WITH_ERROR);
    await expect(animalsPages.commoditySelection.commodityGroup(commodityLines.cattle.commodityCode)).toBeVisible();
    await animalsPages.commoditySelection.errorSummaryLinks.click();
    await expect(animalsPages.commoditySelection.searchBox).toBeFocused();
  });

  test.describe('after a saved selection is cleared and save and return to overview is chosen', () => {
    test.beforeEach(async ({ animalsPages }) => {
      await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle]);
      await animalsPages.commoditySelection.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
      await animalsPages.overview.task('What are you importing?').click();
      await animalsPages.commoditySelection.clearAll.click();
      await animalsPages.commoditySelection.saveAndReturnToOverview.click();
    });

    test('refuses the save with "Select a commodity" and stays on the page', async ({ animalsPages }) => {
      await expect(animalsPages.commoditySelection.heading).toBeVisible();
      await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
      await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
    });

    test('keeps the saved selection when the page is reopened', async ({ animalsPages }) => {
      const referenceNumber = animalsPages.commoditySelection.referenceNumberFromUrl();
      await animalsPages.overview.openTaskAfterReopening(referenceNumber, 'What are you importing?');
      await expect(animalsPages.commoditySelection.selectedSummary).toContainText(speciesLabel(commodityLines.cattle));
    });
  });

  test('lists each chosen commodity with one entry per chosen species offering a Remove control', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle, commodityLines.domesticCat]);
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);

    await expect(animalsPages.commoditySelection.selectedCommodityHeading(commodityLines.cattle.commodityCode)).toBeVisible();
    await expect(animalsPages.commoditySelection.speciesEntry(commodityLines.cattle)).toBeVisible();
    await expect(animalsPages.commoditySelection.removeSpecies(commodityLines.cattle)).toBeVisible();

    await expect(animalsPages.commoditySelection.selectedCommodityHeading(commodityLines.domesticCat.commodityCode)).toBeVisible();
    await expect(animalsPages.commoditySelection.speciesEntry(commodityLines.domesticCat)).toBeVisible();
    await expect(animalsPages.commoditySelection.removeSpecies(commodityLines.domesticCat)).toBeVisible();
  });

  test('removing one chosen species leaves the other chosen and a save persists only the one left', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle, commodityLines.domesticCat]);
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);
    await animalsPages.commoditySelection.pressRemoveSpecies(commodityLines.cattle);

    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.speciesEntry(commodityLines.domesticCat)).toBeVisible();

    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task('What are you importing?').click();
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.speciesEntry(commodityLines.domesticCat)).toBeVisible();
  });
});

test.describe('Commodity selection page without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCommoditySelection();
  });

  test('Search, one species Remove and Clear all all work', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle, commodityLines.domesticCat]);
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);

    await animalsPages.commoditySelection.pressRemoveSpecies(commodityLines.cattle);
    await expect(animalsPages.commoditySelection.selectedSummary).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.speciesEntry(commodityLines.domesticCat)).toBeVisible();

    await animalsPages.commoditySelection.clearAll.click();
    await expect(animalsPages.commoditySelection.selectedSummary).toHaveCount(0);
  });
});
