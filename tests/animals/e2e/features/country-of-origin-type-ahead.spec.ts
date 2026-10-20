import { test, expect } from '@fixtures';
import { originPageCountryNames } from '@domain/shared/fixtures/reference-data';

test.describe('Country of origin type-ahead', { tag: '@duplicated-in-frontend' }, () => {
  test('filters as you type, submits the country code and persists it', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    const field = animalsPages.originOfImport.country.field;
    await expect(field).toBeVisible();
    await expect(field).toHaveRole('combobox');
    await expect(field).toHaveAccessibleName('Country of origin');

    const fallback = animalsPages.originOfImport.country.select;
    await expect(fallback.locator('option').first()).toHaveText('Select a country');
    await expect(fallback.locator('option')).toHaveCount(originPageCountryNames().length + 1);

    await field.click();
    await field.fill('Belg');
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

  test('shows the letters typed in bold in a country suggestion', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task('Where is this consignment coming from?').click();

    await animalsPages.originOfImport.country.field.fill('fra');

    await expect(animalsPages.originOfImport.country.boldLettersOf('France')).toHaveText(['Fra']);
  });
});
