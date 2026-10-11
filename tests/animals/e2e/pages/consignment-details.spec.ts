import { test, expect } from '@fixtures';

test.describe('Commodity details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toConsignmentDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toBeVisible();
    await expect(animalsPages.consignmentDetails.numberOfPackages).toBeVisible();
    await expect(animalsPages.consignmentDetails.saveAndContinue).toBeVisible();
  });

  test('captions the page "Description of the goods"', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.caption).toBeVisible();
  });

  test('lists the selected commodity with its code, common name and species', async ({ animalsPages }) => {
    const table = animalsPages.consignmentDetails.selectedCommodities;
    await expect(table.getByRole('columnheader')).toHaveText(['Commodity code', 'Common name', 'Species', 'Actions']);
    await expect(table.getByRole('row').nth(1).getByRole('cell')).toHaveText(['0102', 'Cow', 'Bos taurus', 'Remove Cow']);
  });

  test('leaves the number of animals empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toHaveValue('');
  });

  test('accepts valid consignment details', async ({ pages, animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('save and continue: when the number of packages is blank, refuses the save with an error on that line', async ({ animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(animalsPages.consignmentDetails.errorSummary).toBeVisible();
    await expect(animalsPages.consignmentDetails.packagesRequiredErrorLink).toBeVisible();
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
  });
});

test.describe('Commodity details page — a commodity not counted in packages', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toCommoditySelection();
    await animalsPages.commoditySelection.selectSpecies(['Salmo salar']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await animalsPages.overview.task('Commodity details').click();
    await animalsPages.consignmentDetails.heading.waitFor();
  });

  test('save and continue: saves a line that is not asked for a number of packages without one', async ({ pages, animalsPages }) => {
    await expect(animalsPages.consignmentDetails.numberOfPackages).toHaveCount(0);
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.overview.heading).toBeVisible();
  });
});

test.describe('Commodity details page — two species', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toCommoditySelection();
    await animalsPages.commoditySelection.selectSpecies(['Bos taurus', 'Bison bison']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await animalsPages.overview.task('Commodity details').click();
    await animalsPages.consignmentDetails.heading.waitFor();
  });

  test('validation: lists every number of animals error before any number of packages error', async ({ animalsPages }) => {
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

  test("lists both species' Latin names in the commodity's Species cell", async ({ animalsPages }) => {
    const cowRow = animalsPages.consignmentDetails.selectedCommodities.getByRole('row').nth(1);
    await expect(cowRow).toContainText('Bison bison');
    await expect(cowRow).toContainText('Bos taurus');
  });
});
