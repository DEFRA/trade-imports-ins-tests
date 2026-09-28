import { test, expect } from '@fixtures';

const INTERNAL_REFERENCE = 'Imports456GB';

test.describe('Origin of the import page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toOriginOfImport();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(pages.originOfImport.countryOfOrigin).toBeVisible();
    await expect(pages.originOfImport.radioRequiresOriginCode('No')).toBeVisible();
    await expect(pages.originOfImport.saveAndContinue).toBeVisible();
  });

  test('shows the country selector on load', async ({ pages }) => {
    await expect(pages.originOfImport.countryOfOrigin).toBeVisible();
  });

  test('accepts valid origin details', async ({ pages }) => {
    await pages.originOfImport.selectCountry('France');
    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  /**
   * The country does not block the save: a user who has the internal reference
   * but is still waiting on the health certificate to confirm where the animal
   * comes from records what they know and comes back to it. The commodity
   * search is asked for by country of origin, so with the country unanswered
   * there is no next page to offer and the user is set down on the overview.
   * The gap is held at the overview task row and again at the check page.
   */
  test('saves what the user has when submitted without a country', async ({ pages }) => {
    const journeyId = pages.originOfImport.journeyIdFromUrl();

    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.originOfImport.errorSummary).toHaveCount(0);
    await expect(pages.overview.heading).toBeVisible();

    await pages.originOfImport.open(journeyId);
    await expect(pages.originOfImport.countrySelect).toHaveValue('');
    await expect(pages.originOfImport.radioRequiresOriginCode('No')).toBeChecked();
    await expect(pages.originOfImport.internalReference).toHaveValue(INTERNAL_REFERENCE);
  });

  test('shows an error summary when a region of origin code is claimed but not given', async ({ pages }) => {
    await pages.originOfImport.selectCountry('France');
    await pages.originOfImport.radioRequiresOriginCode('Yes').check();
    await pages.originOfImport.saveAndContinue.click();

    await expect(pages.originOfImport.errorSummary).toBeVisible();
  });
});
