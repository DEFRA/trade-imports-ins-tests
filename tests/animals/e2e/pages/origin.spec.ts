import { test, expect } from '@fixtures';

const INTERNAL_REFERENCE = 'Imports456GB';
const REGION_HINT =
  'Check the health certificate for a region of origin code. You can add the code later if you do not have the certificate now.';
const INTERNAL_REFERENCE_HINT = 'Enter any internal reference you want to use to identify this consignment, or leave blank.';
const REMOVED_INTERNAL_REFERENCE_LIMIT = 'It can be up to 58 characters.';
const INTERNAL_REFERENCE_LIMIT_ERROR = 'Internal reference must be 58 characters or less';
const ORIGIN_TASK = 'Where is this consignment coming from?';
const COMPLETE = 'Complete';
const IMPORT_DETAILS = 'Import details';
const REGION_CODE_ROW = 'Region of origin code';
const NOT_APPLICABLE = 'Not applicable';

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
    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();

    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.saveAndContinue.click();

    // With a country chosen the opening run carries on to commodities, not the overview.
    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('75');
  });

  test('shows the region of origin code hint and the internal reference hint without its length limit', async ({ pages, animalsPages }) => {
    await expect(animalsPages.originOfImport.regionRequirementGroup).toContainText(REGION_HINT);
    await expect(animalsPages.originOfImport.internalReference).toHaveAccessibleDescription(INTERNAL_REFERENCE_HINT);
    await expect(pages.page.getByText(REMOVED_INTERNAL_REFERENCE_LIMIT)).toHaveCount(0);
  });

  test('the region code box stops typing at five characters, with autocomplete and spellcheck off', async ({ animalsPages }) => {
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();

    await animalsPages.originOfImport.regionCode.pressSequentially('ABCDEFG');

    await expect(animalsPages.originOfImport.regionCode).toHaveValue('ABCDE');
    await expect(animalsPages.originOfImport.regionCode).toHaveAttribute('maxlength', '5');
    await expect(animalsPages.originOfImport.regionCode).toHaveAttribute('autocomplete', 'off');
    await expect(animalsPages.originOfImport.regionCode).toHaveAttribute('spellcheck', 'false');
  });

  test('answering No clears a saved region of origin code', async ({ animalsPages }) => {
    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.saveAndContinue.click();
    await animalsPages.originOfImport.open(journeyId);

    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await animalsPages.notificationView.open(journeyId);
    await expect(
      animalsPages.notificationView.summaryValue(animalsPages.notificationView.summaryCard(IMPORT_DETAILS), REGION_CODE_ROW),
    ).toHaveText(NOT_APPLICABLE);
    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeChecked();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('');
  });

  test('a region code typed with no country is kept on the page but saved only once a country gives it its prefix', async ({
    animalsPages,
  }) => {
    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();
    const regionCodeValue = () =>
      animalsPages.notificationView.summaryValue(animalsPages.notificationView.summaryCard(IMPORT_DETAILS), REGION_CODE_ROW);
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.internalReference.fill('A'.repeat(59));

    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
    await expect(animalsPages.originOfImport.errorLinkNamed(INTERNAL_REFERENCE_LIMIT_ERROR)).toBeVisible();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('75');

    await animalsPages.originOfImport.internalReference.fill('');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.notificationView.open(journeyId);
    await expect(regionCodeValue()).not.toContainText('75');

    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('');
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.saveAndContinue.click();
    await animalsPages.notificationView.open(journeyId);
    await expect(regionCodeValue()).toHaveText('FR-75');
  });

  test('the origin task reads Complete only once the region of origin code question is answered', async ({ animalsPages }) => {
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.taskStatus(ORIGIN_TASK)).not.toHaveText(COMPLETE);

    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.taskStatus(ORIGIN_TASK)).toHaveText(COMPLETE);

    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.taskStatus(ORIGIN_TASK)).toHaveText(COMPLETE);
  });

  test('persists a country subdivision selection', async ({ animalsPages }) => {
    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();

    await animalsPages.originOfImport.selectCountry('Canary Islands');
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await animalsPages.originOfImport.saveAndContinue.click();

    await animalsPages.originOfImport.open(journeyId);
    await expect(animalsPages.originOfImport.countrySelect).toHaveValue('ES-CN');
    await expect(animalsPages.originOfImport.countryOfOrigin).toHaveValue('Canary Islands');
  });
});
