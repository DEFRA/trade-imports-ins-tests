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

  test('leaves the number of animals empty on load', async ({ animalsPages }) => {
    await expect(animalsPages.consignmentDetails.numberOfAnimals).toHaveValue('');
  });

  test('accepts valid consignment details', async ({ pages, animalsPages }) => {
    await animalsPages.consignmentDetails.numberOfAnimals.fill('1');
    await animalsPages.consignmentDetails.numberOfPackages.fill('5');
    await animalsPages.consignmentDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
