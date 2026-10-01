import { test, expect } from '@fixtures';

const INTERNAL_REFERENCE = 'Imports456GB';

test.describe('Origin of the import page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginOfImport();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.countryOfOrigin).toBeVisible();
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeVisible();
    await expect(animalsPages.originOfImport.saveAndContinue).toBeVisible();
  });

  test('shows the country selector on load', async ({ animalsPages }) => {
    await expect(animalsPages.originOfImport.countryOfOrigin).toBeVisible();
  });

  test('accepts valid origin details', async ({ pages, animalsPages }) => {
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();

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
  test('saves what the user has when submitted without a country', async ({ animalsPages }) => {
    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();

    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.originOfImport.errorSummary).toHaveCount(0);
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.countrySelect).toHaveValue('');
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeChecked();
    await expect(animalsPages.originOfImport.internalReference).toHaveValue(INTERNAL_REFERENCE);
  });

  test('shows an error summary when a region of origin code is claimed but not given', async ({ animalsPages }) => {
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
  });

  test('persists a region of origin code selection', async ({ animalsPages }) => {
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();

    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();
    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('75');
  });

  test('persists a country subdivision selection', async ({ animalsPages }) => {
    await animalsPages.originOfImport.selectCountry('Canary Islands');
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();

    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();
    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.countrySelect).toHaveValue('ES-CN');
    await expect(animalsPages.originOfImport.countryOfOrigin).toHaveValue('Canary Islands');
  });
});
