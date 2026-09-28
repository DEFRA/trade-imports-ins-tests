import { test, expect } from '@fixtures';

test.describe('Country of origin type-ahead', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('filters as you type, submits the country code and persists it', async ({ journey, pages }) => {
    await journey.startNotification();
    await pages.overview.task('Where is this consignment coming from?').click();

    const field = pages.originOfImport.countryOfOrigin;
    await expect(field).toBeVisible();
    await expect(field).toHaveRole('combobox');
    await expect(field).toHaveAccessibleName('Country of origin');

    // The type-ahead enhances a native select. The select stays in the DOM as the
    // no-JavaScript fallback and is what carries the code the form submits, so the
    // full option list is asserted there: the placeholder plus the 31 SPS origin
    // countries. The scroll-only divider rule is gone — a searchable list has no
    // use for it.
    const fallback = pages.originOfImport.countrySelect;
    await expect(fallback.locator('option').first()).toHaveText('Select a country');
    await expect(fallback.locator('option')).toHaveCount(32);

    await field.click();
    await field.fill('Belg');
    await expect(pages.originOfImport.countryOption('Belgium')).toBeVisible();

    await pages.originOfImport.selectCountry('Belgium');
    await expect(field).toHaveValue('Belgium');
    await expect(fallback).toHaveValue('BE');

    await pages.originOfImport.radioRequiresOriginCode('No').check();
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.overview.heading).toBeVisible();

    await pages.overview.task('Where is this consignment coming from?').click();
    await expect(fallback).toHaveValue('BE');
    // The chosen country is left sitting visibly in the search box on return.
    await expect(pages.originOfImport.countryOfOrigin).toHaveValue('Belgium');
  });
});
