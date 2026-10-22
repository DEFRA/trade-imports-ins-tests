import { test, expect } from '@fixtures';
import { SELECT_ONE_PLACEHOLDER } from '@page-objects/animals/import-reason-page';

test.describe('Import reason page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toImportReason();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.importReason.questionGroup).toBeVisible();
    await expect(animalsPages.importReason.reason('Internal market')).toBeVisible();
    await expect(animalsPages.importReason.saveAndContinue).toBeVisible();
  });

  test('heads the page and titles the browser tab Main import reason', async ({ pages, animalsPages }) => {
    await expect(animalsPages.importReason.mainHeadings).toHaveText(['Main import reason']);
    await expect(pages.page).toHaveTitle('Main import reason - Import notification service - GOV.UK');
  });

  test('leaves the import reason unchecked on load', async ({ animalsPages }) => {
    await expect(animalsPages.importReason.reason('Internal market')).not.toBeChecked();
  });

  test('accepts a valid import reason and returns to the overview', async ({ animalsPages }) => {
    await animalsPages.importReason.reason('Re-entry').check();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('reveals the import purpose under the internal market reason and accepts it', async ({ animalsPages }) => {
    await animalsPages.importReason.reason('Internal market').check();

    await expect(animalsPages.importReason.purpose('Breeding')).toBeVisible();
    await expect(animalsPages.importReason.purpose('Breeding')).not.toBeChecked();

    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('refuses an unanswered purpose under the internal market reason', async ({ pages, animalsPages }) => {
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a purpose in the internal market' })).toBeVisible();
    await expect(animalsPages.importReason.heading).toBeVisible();
  });

  test('shows Select one in the empty search box of every destination country and port of exit', async ({ animalsPages }) => {
    const { importReason } = animalsPages;

    await importReason.reason('Transhipment or onward travel').check();
    await expect(importReason.transhipmentDestinationCountry.field).toHaveAttribute('placeholder', SELECT_ONE_PLACEHOLDER);

    await importReason.reason('Transit').check();
    await expect(importReason.transitPortOfExit.field).toHaveAttribute('placeholder', SELECT_ONE_PLACEHOLDER);
    await expect(importReason.transitDestinationCountry.field).toHaveAttribute('placeholder', SELECT_ONE_PLACEHOLDER);

    await importReason.reason('Temporary admission horses').check();
    await expect(importReason.temporaryAdmissionPortOfExit.field).toHaveAttribute('placeholder', SELECT_ONE_PLACEHOLDER);
  });
});

test.describe('Import reason page without JavaScript', { tag: '@duplicated-in-frontend' }, () => {
  test.use({ javaScriptEnabled: false });

  test('opens every destination country and port of exit select on Select one', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toImportReason();
    const { importReason } = animalsPages;

    await expect(importReason.transhipmentDestinationCountry.options.first()).toHaveText(SELECT_ONE_PLACEHOLDER);
    await expect(importReason.transitPortOfExit.options.first()).toHaveText(SELECT_ONE_PLACEHOLDER);
    await expect(importReason.transitDestinationCountry.options.first()).toHaveText(SELECT_ONE_PLACEHOLDER);
    await expect(importReason.temporaryAdmissionPortOfExit.options.first()).toHaveText(SELECT_ONE_PLACEHOLDER);
  });
});
