import { test, expect } from '@fixtures';
import { countryAndSubdivisionNamesWithCountry } from '@resources/reference-data/reference-data';
import { ORIGIN_COUNTRY_SEARCH_PLACEHOLDER, ORIGIN_COUNTRY_SELECT_TEXT } from '@domain/animals/constants/origin-page';
import { SEARCH_BOX_ASSISTIVE_DESCRIPTION } from '@domain/shared/constants/type-ahead';

test.describe('Country of origin type-ahead', { tag: '@duplicated-in-frontend' }, () => {
  test('filters as you type, submits the country code and persists it', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    const field = animalsPages.originOfImport.country.field;
    await expect(field).toBeVisible();
    await expect(field).toHaveRole('combobox');
    await expect(field).toHaveAccessibleName('Country of origin');

    const fallback = animalsPages.originOfImport.country.select;
    await expect(fallback.locator('option').first()).toHaveText(ORIGIN_COUNTRY_SELECT_TEXT);
    await expect(fallback.locator('option')).toHaveCount(countryAndSubdivisionNamesWithCountry().length + 1);

    await animalsPages.originOfImport.country.search('Belg');
    await expect(animalsPages.originOfImport.country.option('Belgium')).toBeVisible();

    await animalsPages.originOfImport.country.choose('Belgium');
    await expect(field).toHaveValue('Belgium');
    await expect(fallback).toHaveValue('BE');

    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await expect(fallback).toHaveValue('BE');
    await expect(animalsPages.originOfImport.country.field).toHaveValue('Belgium');
  });

  test('shows the search box placeholder and no hint', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    await expect(animalsPages.originOfImport.country.field).toHaveAttribute('placeholder', ORIGIN_COUNTRY_SEARCH_PLACEHOLDER);
    await expect(animalsPages.originOfImport.country.field).toHaveAccessibleDescription(SEARCH_BOX_ASSISTIVE_DESCRIPTION);
    await expect(animalsPages.originOfImport.country.hint).toHaveCount(0);
  });

  test('shows the letters typed in bold in a country suggestion', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    await animalsPages.originOfImport.country.search('fra');

    await expect(animalsPages.originOfImport.country.boldLettersOf('France')).toHaveText(['Fra']);
  });
});

test.describe('Country of origin without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test('shows no hint, begins with Select a country, and saves the chosen country', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();
    const referenceNumber = animalsPages.originOfImport.referenceNumberFromUrl();
    const { country } = animalsPages.originOfImport;
    const { select } = country;

    await expect(country.field).toHaveAccessibleDescription('');
    await expect(country.hint).toHaveCount(0);
    await expect(select.locator('option').first()).toHaveText(ORIGIN_COUNTRY_SELECT_TEXT);

    await select.selectOption({ label: 'Belgium' });
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    await animalsPages.originOfImport.open(referenceNumber);
    await expect(select).toHaveValue('BE');
  });
});
