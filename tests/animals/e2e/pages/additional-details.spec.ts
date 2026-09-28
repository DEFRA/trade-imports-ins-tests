import { test, expect } from '@fixtures';

test.describe('Additional details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAdditionalDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await expect(animalsPages.additionalDetails.certifiedFor('Slaughter')).toBeVisible();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('No')).toBeVisible();
    await expect(animalsPages.additionalDetails.saveAndContinue).toBeVisible();
  });

  test('leaves the additional details unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.additionalDetails.certifiedFor('Slaughter')).not.toBeChecked();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('No')).not.toBeChecked();
  });

  test('accepts valid additional details', async ({ pages, animalsPages }) => {
    await animalsPages.additionalDetails.certifiedFor('Slaughter').check();
    await animalsPages.additionalDetails.containsUnweanedAnimals('No').check();
    await animalsPages.additionalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
