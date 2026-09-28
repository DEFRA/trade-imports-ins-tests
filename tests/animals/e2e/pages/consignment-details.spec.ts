import { test, expect } from '@fixtures';

test.describe('Commodity details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toConsignmentDetails();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.consignmentDetails.heading).toBeVisible();
    await expect(pages.consignmentDetails.numberOfAnimals).toBeVisible();
    await expect(pages.consignmentDetails.numberOfPackages).toBeVisible();
    await expect(pages.consignmentDetails.saveAndContinue).toBeVisible();
  });

  test('leaves the number of animals empty on load', async ({ pages }) => {
    await expect(pages.consignmentDetails.numberOfAnimals).toHaveValue('');
  });

  test('accepts valid consignment details', async ({ pages }) => {
    await pages.consignmentDetails.numberOfAnimals.fill('1');
    await pages.consignmentDetails.numberOfPackages.fill('5');
    await pages.consignmentDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
