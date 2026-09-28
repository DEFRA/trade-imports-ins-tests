import { test, expect } from '@fixtures';

test.describe('Additional details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAdditionalDetails();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.additionalDetails.heading).toBeVisible();
    await expect(pages.additionalDetails.certifiedFor('Slaughter')).toBeVisible();
    await expect(pages.additionalDetails.containsUnweanedAnimals('No')).toBeVisible();
    await expect(pages.additionalDetails.saveAndContinue).toBeVisible();
  });

  test('leaves the additional details unchecked on load', async ({ pages }) => {
    await expect(pages.additionalDetails.certifiedFor('Slaughter')).not.toBeChecked();
    await expect(pages.additionalDetails.containsUnweanedAnimals('No')).not.toBeChecked();
  });

  test('accepts valid additional details', async ({ pages }) => {
    await pages.additionalDetails.certifiedFor('Slaughter').check();
    await pages.additionalDetails.containsUnweanedAnimals('No').check();
    await pages.additionalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
