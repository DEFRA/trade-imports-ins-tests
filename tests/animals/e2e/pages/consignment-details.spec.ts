import { commodityLines, speciesLabel } from '@domain/animals/constants/commodity-lines';
import { test, expect } from '@fixtures';

test.describe('Commodity details page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfPackages).toBeVisible();
    await expect(animalsPages.consignmentDetails.saveAndContinue).toBeVisible();
  });

  test('captions the page with the description-of-the-goods section', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.caption).toBeVisible();
    await expect(animalsPages.consignmentDetails.headingBelowCaption).toHaveText('Commodity details');
  });

  test('lists the selected commodity with its code and species', async ({ animalsPages }) => {
    const table = animalsPages.consignmentDetails.selectedCommodities.table;
    const { cattle } = commodityLines;

    await expect(table.getByRole('columnheader')).toHaveText(['Commodity code', 'Species', 'Actions']);
    await expect(animalsPages.consignmentDetails.selectedCommodities.rowFor(cattle).getByRole('cell')).toHaveText([
      cattle.commodityCode,
      speciesLabel(cattle),
      `Remove ${cattle.commodityCode} ${speciesLabel(cattle)}`,
    ]);
  });

  test('leaves the number of animals empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toHaveValue('');
  });

  test('accepts valid consignment details', async ({ animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('holds the page on a number of animals above the largest the service stores, keeping the digits typed', async ({ animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('2147483648');
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.animalsAboveMaxErrorLink).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toHaveValue('2147483648');
  });

  test('saves a number of animals exactly at the largest the service stores and shows it back on the page', async ({ animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('2147483647');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Commodity details').click();
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toHaveValue('2147483647');
  });
});

test.describe('Commodity details page with two species of one commodity', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetails([commodityLines.cattle, commodityLines.bison]);
  });

  test('lists every number of animals error before any number of packages error', async ({ animalsPages }) => {
    for (const box of await animalsPages.consignmentDetails.numberOfPackages.all()) {
      await box.fill('abc');
    }
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.errorSummaryLinks).toHaveText([
      'Enter the number of animals',
      'Enter the number of animals',
      'Number of packages must be a whole number, like 5',
      'Number of packages must be a whole number, like 5',
    ]);
    await animalsPages.consignmentDetails.errorSummaryLinks.nth(2).click();
    await expect(animalsPages.consignmentDetails.numberOfPackages.first()).toBeFocused();
  });

  test("lists both species' labels, one per line, in the commodity's Species cell", async ({ animalsPages }) => {
    const speciesCell = animalsPages.consignmentDetails.selectedCommodities.speciesCell(
      animalsPages.consignmentDetails.selectedCommodities.rowFor(commodityLines.cattle),
    );

    expect(await speciesCell.evaluate((el) => (el as HTMLElement).innerText)).toBe(
      `${speciesLabel(commodityLines.bison)},\n${speciesLabel(commodityLines.cattle)}`,
    );
  });
});

test.describe('Commodity details page removing a line while others are typed but not saved', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetails([commodityLines.cattle, commodityLines.domesticCat]);
  });

  test('keeps the number typed for the surviving species after removing another commodity', async ({ animalsPages }) => {
    const { consignmentDetails } = animalsPages;
    await consignmentDetails.fillAnimalCountFor(commodityLines.cattle, 11);
    await consignmentDetails.fillAnimalCountFor(commodityLines.domesticCat, 22);
    await consignmentDetails.selectedCommodities.removeButtonFor(commodityLines.cattle).click();

    await expect(consignmentDetails.selectedCommodities.bodyRows).toHaveCount(1);
    await expect(consignmentDetails.selectedCommodities.rowFor(commodityLines.domesticCat).getByRole('cell')).toHaveText([
      commodityLines.domesticCat.commodityCode,
      speciesLabel(commodityLines.domesticCat),
      `Remove ${commodityLines.domesticCat.commodityCode} ${speciesLabel(commodityLines.domesticCat)}`,
    ]);
    await expect(await consignmentDetails.numberOfAnimalsFor(commodityLines.domesticCat)).toHaveValue('22');
  });
});

test.describe('Commodity details page after counts are saved', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetailsWithSavedCounts({ animals: '2', packages: '5' });
  });

  test('returns from Add another commodity to Commodity details with the saved counts still filled in', async ({ animalsPages }) => {
    await animalsPages.consignmentDetails.addAnotherCommodity.click();
    await expect(animalsPages.commoditySelection.heading).toBeVisible();

    await animalsPages.commoditySelection.searchAndCheckSpecies([commodityLines.domesticCat]);
    await animalsPages.commoditySelection.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(await animalsPages.consignmentDetails.numberOfAnimalsFor(commodityLines.cattle)).toHaveValue('2');
    await expect(await animalsPages.consignmentDetails.numberOfPackagesFor(commodityLines.cattle)).toHaveValue('5');
    await expect(await animalsPages.consignmentDetails.numberOfAnimalsFor(commodityLines.domesticCat)).toHaveValue('');
    await expect(await animalsPages.consignmentDetails.numberOfPackagesFor(commodityLines.domesticCat)).toHaveValue('');
  });
});
