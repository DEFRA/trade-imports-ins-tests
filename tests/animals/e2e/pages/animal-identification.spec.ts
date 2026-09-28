import { test, expect } from '@fixtures';

test.describe('Animal identification page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toAnimalIdentification();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.animalIdentification.heading).toBeVisible();
    await expect(pages.animalIdentification.earTag).toBeVisible();
    await expect(pages.animalIdentification.passportNumber).toBeVisible();
    // A line of one animal has nothing to add after this record, so the card
    // offers no button of its own — the page's Save and continue captures it.
    await expect(pages.animalIdentification.saveAndAddAnother).toHaveCount(0);
    await expect(pages.animalIdentification.saveAndContinue).toBeVisible();
  });

  test('leaves the ear tag empty on load', async ({ pages }) => {
    await expect(pages.animalIdentification.earTag).toHaveValue('');
  });

  test('accepts a valid ear tag', async ({ pages }) => {
    await pages.animalIdentification.earTag.fill('UK123456789012');
    await pages.animalIdentification.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });
});
