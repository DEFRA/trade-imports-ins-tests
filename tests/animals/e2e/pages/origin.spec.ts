import { test, expect } from '@fixtures';
import { countryCodes } from '@domain/animals/constants/country-codes';
import { DEFAULT_REGION_CODE } from '@domain/animals/constants/origin-page';

const FRANCE_REGION_CODE = `${countryCodes.eu.france.value}-${DEFAULT_REGION_CODE}`;
const INTERNAL_REFERENCE = 'Imports456GB';
const REGION_HINT =
  'Check the health certificate for a region of origin code. You can add the code later if you do not have the certificate now.';
const REGION_CODE_LABEL = 'Enter the region of origin code';
const REGION_CODE_HINT = 'Enter up to 5 characters.';
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
    await animalsPages.originOfImport.country.choose(countryCodes.eu.france.display);
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
    await animalsPages.originOfImport.country.choose(countryCodes.eu.france.display);
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
  });

  test('persists a region of origin code selection', async ({ animalsPages, animalsJourney }) => {
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();

    await animalsJourney.fillAndSaveOriginWithRegionCode(DEFAULT_REGION_CODE);

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue(DEFAULT_REGION_CODE);
  });

  test('answering No clears a saved region of origin code', async ({ animalsPages, animalsJourney }) => {
    const { originOfImport, notificationView } = animalsPages;
    const referenceNumber = originOfImport.referenceNumberFromUrl();
    await animalsJourney.fillAndSaveOriginWithRegionCode(DEFAULT_REGION_CODE);

    await originOfImport.open(referenceNumber);
    await originOfImport.radioRequiresOriginCode('No').check();
    await originOfImport.saveAndContinue.click();

    await notificationView.open(referenceNumber);
    await expect(notificationView.regionOfOriginCode).toHaveText('Not applicable');

    await originOfImport.open(referenceNumber);
    await originOfImport.radioRequiresOriginCode('Yes').check();
    await expect(originOfImport.regionCode).toHaveValue('');
  });

  test("persists a territory chosen as the country of origin, named with its country and with its country's code as the region code prefix", async ({
    animalsPages,
    animalsJourney,
  }) => {
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();
    const { value, display } = countryCodes.subdivisions.canaryIslands;

    await animalsJourney.fillAndSaveOriginWithRegionCode('12', {
      countryCode: countryCodes.subdivisions.canaryIslands,
      internalReference: INTERNAL_REFERENCE,
    });

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(animalsPages.originOfImport.country.select).toHaveValue(value);
    await expect(animalsPages.originOfImport.country.field).toHaveValue(display);
    await expect(animalsPages.originOfImport.regionCodePrefix).toBeVisible();
    await expect(animalsPages.originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.spain.value);
  });

  test.describe('region code prefix with JavaScript', () => {
    let originUrl: string;

    test.beforeEach(async ({ pages, animalsPages }) => {
      originUrl = pages.page.url();
      await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    });

    test('shows an empty region code prefix before a country is chosen', async ({ animalsPages }) => {
      const { originOfImport } = animalsPages;

      await expect(originOfImport.regionCodePrefix).toBeVisible();
      await expect(originOfImport.regionCodePrefix).toHaveText('');
    });

    test('shows the code of each country chosen as the region code prefix without leaving the page', async ({ pages, animalsPages }) => {
      const { originOfImport } = animalsPages;

      await originOfImport.country.choose(countryCodes.eu.france.display);
      await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.france.value);

      await originOfImport.country.choose(countryCodes.eu.netherlands.display);
      await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.netherlands.value);
      await expect(pages.page).toHaveURL(originUrl);
    });

    test("shows a chosen territory's country code as the region code prefix without saving", async ({ pages, animalsPages }) => {
      const { originOfImport } = animalsPages;
      await originOfImport.country.choose(countryCodes.subdivisions.canaryIslands.display);

      await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.spain.value);
      await expect(pages.page).toHaveURL(originUrl);
    });

    test('empties the region code prefix when the chosen country is cleared', async ({ animalsPages }) => {
      const { originOfImport } = animalsPages;
      await originOfImport.country.choose(countryCodes.eu.france.display);
      await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.france.value);

      await originOfImport.country.field.fill('');
      await originOfImport.country.field.blur();

      await expect(originOfImport.regionCodePrefix).toHaveText('');
    });

    test.describe('with a refused page', () => {
      test.beforeEach(async ({ animalsPages }) => {
        const { originOfImport } = animalsPages;
        await originOfImport.country.choose(countryCodes.eu.france.display);
        await originOfImport.saveAndContinue.click();
        await expect(originOfImport.errorSummary).toBeVisible();
      });

      test('shows the submitted country code as the region code prefix on a refused page', async ({ animalsPages }) => {
        await expect(animalsPages.originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.france.value);
      });

      test('changes the region code prefix on a refused page when another country is chosen', async ({ animalsPages }) => {
        const { originOfImport } = animalsPages;
        await originOfImport.country.choose(countryCodes.eu.netherlands.display);

        await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.netherlands.value);
      });
    });

    test.describe('page shown again', () => {
      test.beforeEach(async ({ animalsPages, animalsJourney }) => {
        const { originOfImport } = animalsPages;
        const referenceNumber = originOfImport.referenceNumberFromUrl();
        await animalsJourney.fillAndSaveOriginWithRegionCode(DEFAULT_REGION_CODE);
        await originOfImport.open(referenceNumber);
      });

      test('shows the saved country code as the region code prefix when the page is shown again', async ({ animalsPages }) => {
        const { originOfImport } = animalsPages;

        await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.france.value);
        await expect(originOfImport.regionCode).toHaveValue(DEFAULT_REGION_CODE);
      });

      test('changes the region code prefix when another country is chosen on a page shown again', async ({ pages, animalsPages }) => {
        const { originOfImport } = animalsPages;
        const shownAgainUrl = pages.page.url();
        await originOfImport.country.choose(countryCodes.eu.netherlands.display);

        await expect(originOfImport.regionCodePrefix).toHaveText(countryCodes.eu.netherlands.value);
        await expect(pages.page).toHaveURL(shownAgainUrl);
      });
    });

    test('hides the region code prefix from screen readers', async ({ animalsPages }) => {
      await expect(animalsPages.originOfImport.regionCodePrefix).toHaveAttribute('aria-hidden', 'true');
    });

    test('names the region code box by its label and describes it by its hint', async ({ animalsPages }) => {
      const { originOfImport } = animalsPages;

      await expect(originOfImport.regionCode).toHaveAccessibleName(REGION_CODE_LABEL);
      await expect(originOfImport.regionCode).toHaveAccessibleDescription(REGION_CODE_HINT);
    });
  });
});

test.describe('Origin of the import page without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toOriginOfImport();
  });

  test('hides the region code prefix on first view', async ({ animalsPages }) => {
    const { originOfImport } = animalsPages;
    await originOfImport.radioRequiresOriginCode('Yes').check();

    await expect(originOfImport.regionCode).toBeVisible();
    await originOfImport.expectRegionCodePrefixHidden();
  });

  test('hides the region code prefix when the page is shown again after a save', async ({ animalsPages, animalsJourney }) => {
    const { originOfImport } = animalsPages;
    const referenceNumber = originOfImport.referenceNumberFromUrl();
    await animalsJourney.fillAndSaveOriginWithRegionCode(DEFAULT_REGION_CODE);
    await originOfImport.open(referenceNumber);

    await expect(originOfImport.regionCode).toHaveValue(DEFAULT_REGION_CODE);
    await originOfImport.expectRegionCodePrefixHidden();
  });

  test('hides the region code prefix on a refused page', async ({ animalsPages, animalsJourney }) => {
    const { originOfImport } = animalsPages;
    await animalsJourney.fillAndSaveOriginWithRegionCode('');

    await expect(originOfImport.errorSummary).toBeVisible();
    await originOfImport.expectRegionCodePrefixHidden();
  });

  for (const typed of [DEFAULT_REGION_CODE, FRANCE_REGION_CODE]) {
    test(`stores a region code typed as ${typed} as ${FRANCE_REGION_CODE}`, async ({ animalsPages, animalsJourney }) => {
      const { originOfImport, notificationView } = animalsPages;
      const referenceNumber = originOfImport.referenceNumberFromUrl();

      await animalsJourney.fillAndSaveOriginWithRegionCode(typed);

      await notificationView.open(referenceNumber);
      await expect(notificationView.regionOfOriginCode).toHaveText(FRANCE_REGION_CODE);
    });
  }

  test('refuses a region code longer than 5 characters after the country code', async ({ animalsPages, animalsJourney }) => {
    const { originOfImport } = animalsPages;
    await originOfImport.removeRegionCodeMaxlength();
    await animalsJourney.fillAndSaveOriginWithRegionCode('FR-ABCDEF');

    await expect(originOfImport.errorSummary).toBeVisible();
    await expect(originOfImport.regionCodeMaxLengthErrorLink).toBeVisible();
  });
});
