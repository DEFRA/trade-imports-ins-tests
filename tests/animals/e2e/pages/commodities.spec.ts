import { commodityLines } from '@domain/animals/constants/commodity-lines';

import { test, expect } from '@fixtures';

const NO_MATCH_QUERY = 'zzz';

const GROUPING_QUERIES = ['0102', 'cattle', 'horse', 'domestic cat', 'ostrich'];

test.describe('Commodity selection page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toCommoditySelection();
  });

  test('offers a search box and lists nothing until it is used', async ({ pages, animalsPages }) => {
    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.searchBox).toBeVisible();
    await expect(pages.page.getByRole('checkbox')).toHaveCount(0);
    await expect(animalsPages.commoditySelection.selectionPanel).toHaveCount(0);
    await expect(animalsPages.commoditySelection.saveAndContinue).toBeVisible();
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

    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('2 selected');
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText(commodityLines.cattle.latinName);
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText(commodityLines.domesticCat.latinName);

    await animalsPages.commoditySelection.search(commodityLines.cattle.searchTerm);
    await expect(animalsPages.commoditySelection.species(commodityLines.cattle)).toBeChecked();
    await animalsPages.commoditySelection.search(commodityLines.domesticCat.searchTerm);
    await expect(animalsPages.commoditySelection.species(commodityLines.domesticCat)).toBeChecked();
  });

  test('counts what has been chosen and clears it on request', async ({ animalsPages }) => {
    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.cattle]);
    await animalsPages.commoditySelection.search(NO_MATCH_QUERY);
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText('1 selected');
    await expect(animalsPages.commoditySelection.selectionPanel).toContainText(commodityLines.cattle.latinName);

    await animalsPages.commoditySelection.clearAll.click();
    await expect(animalsPages.commoditySelection.selectionPanel).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages, animalsPages }) => {
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a commodity' })).toBeVisible();
  });
});
