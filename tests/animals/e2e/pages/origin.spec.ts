import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/animals/constants/country-codes';

const INTERNAL_REFERENCE = 'Imports456GB';
const REGION_HINT =
  'Check the health certificate for a region of origin code. You can add the code later if you do not have the certificate now.';
const INTERNAL_REFERENCE_HINT = 'Enter any internal reference you want to use to identify this consignment, or leave blank.';

test.describe('Origin of the import page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginOfImport();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.country.field).toBeVisible();
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeVisible();
    await expect(animalsPages.originOfImport.saveAndContinue).toBeVisible();
  });

  test('shows the country selector on load', async ({ animalsPages }) => {
    await expect(animalsPages.originOfImport.country.field).toBeVisible();
  });

  test('shows the region of origin code hint and the internal reference hint without its length limit', async ({ animalsPages }) => {
    const { regionRequirementGroup, internalReference } = animalsPages.originOfImport;

    await expect(regionRequirementGroup).toHaveAccessibleDescription(REGION_HINT);
    await expect(internalReference).toHaveAccessibleDescription(INTERNAL_REFERENCE_HINT);
  });

  test('gives the revealed region code label the small label class and the internal reference box the full-width input class', async ({
    animalsPages,
  }) => {
    const { regionCodeLabel, internalReference } = animalsPages.originOfImport;
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();

    await expect(regionCodeLabel).toHaveAttribute('class', 'govuk-label govuk-label--s');
    await expect(internalReference).toHaveAttribute('class', 'govuk-input');
  });

  test('the region code box stops typing at five characters, with autocomplete and spellcheck off', async ({ animalsPages }) => {
    const { regionCode } = animalsPages.originOfImport;
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();

    await regionCode.pressSequentially('ABCDEFG');

    await expect(regionCode).toHaveValue('ABCDE');
    await expect(regionCode).toHaveAttribute('autocomplete', 'off');
    await expect(regionCode).toHaveAttribute('spellcheck', 'false');
  });

  test('accepts valid origin details', async ({ pages, animalsPages }) => {
    await animalsPages.originOfImport.country.choose('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('saves what the user has when submitted without a country', async ({ animalsPages }) => {
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();

    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.originOfImport.errorSummary).toHaveCount(0);
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(animalsPages.originOfImport.country.select).toHaveValue('');
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('No')).toBeChecked();
    await expect(animalsPages.originOfImport.internalReference).toHaveValue(INTERNAL_REFERENCE);
  });

  test('shows an error summary when a region of origin code is claimed but not given', async ({ animalsPages }) => {
    await animalsPages.originOfImport.country.choose('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
  });

  test('persists a region of origin code selection', async ({ animalsPages }) => {
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();

    await animalsPages.originOfImport.country.choose('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('75');
    await animalsPages.originOfImport.saveAndContinue.click();

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('75');
  });

  test('answering No clears a saved region of origin code', async ({ animalsPages }) => {
    const { originOfImport, notificationView } = animalsPages;
    const referenceNumber = originOfImport.referenceNumberFromUrl();
    await originOfImport.country.choose('France');
    await originOfImport.radioRequiresOriginCode('Yes').check();
    await originOfImport.regionCode.fill('75');
    await originOfImport.saveAndContinue.click();

    await originOfImport.open(referenceNumber);
    await originOfImport.radioRequiresOriginCode('No').check();
    await originOfImport.saveAndContinue.click();

    await notificationView.open(referenceNumber);
    await expect(notificationView.summaryValue(notificationView.summaryCard('Import details'), 'Region of origin code')).toHaveText(
      'Not applicable',
    );

    await originOfImport.open(referenceNumber);
    await originOfImport.radioRequiresOriginCode('Yes').check();
    await expect(originOfImport.regionCode).toHaveValue('');
  });

  test("persists a territory chosen as the country of origin, named with its country and with its country's code as the region code prefix", async ({
    animalsPages,
  }) => {
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();
    const { value, display } = countryCodes.subdivisions.canaryIslands;

    await animalsPages.originOfImport.country.choose(display);
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('12');
    await animalsPages.originOfImport.internalReference.fill(INTERNAL_REFERENCE);
    await animalsPages.originOfImport.saveAndContinue.click();

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(animalsPages.originOfImport.country.select).toHaveValue(value);
    await expect(animalsPages.originOfImport.country.field).toHaveValue(display);
    await expect(animalsPages.originOfImport.regionCodePrefix).toHaveText('ES');
  });
});
