import { test, expect } from '@fixtures';

const GBN_REFERENCE = /GBN-AG-\d{2}-[0-9A-HJKMNP-TV-Z]{6}/;

test.describe('Reference strip', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the Draft tag and GBN-AG reference show from the entry page onwards, and not on the dashboard', async ({ animalsPages }) => {
    const strip = animalsPages.overview.journeyStrip;

    // The dashboard precedes any journey — no strip.
    await animalsPages.dashboard.open();
    await expect(animalsPages.dashboard.heading).toBeVisible();
    await expect(strip).toHaveCount(0);

    // The entry page carries the strip from the first request, before anything
    // is saved: creating the notification mints the reference, so it is in the
    // page's own URL by the time the user lands on it.
    await animalsPages.dashboard.btnCreateNewNotification.click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    const journeyId = animalsPages.originOfImport.journeyIdFromUrl();
    await expect(strip).toBeVisible();
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_REFERENCE);
    await expect(strip).toContainText(journeyId);

    // The strip stays put once the first save has committed answers.
    await animalsPages.originOfImport.selectCountry('France');
    await animalsPages.originOfImport.radioRequiresOriginCode('No').check();
    await animalsPages.originOfImport.saveAndContinue.click();

    // The hub carries the strip: blue Draft tag + GBN-AG-shaped reference.
    await animalsPages.overview.open(journeyId);
    await expect(strip).toBeVisible();
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_REFERENCE);

    await animalsPages.overview.task('Where is this consignment coming from?').click();
    await expect(strip).toBeVisible();
    await expect(strip).toContainText(GBN_REFERENCE);

    // Every post-origin task page inherits the strip from the shared layout.
    await animalsPages.overview.open(journeyId);
    await animalsPages.overview.task('What are you importing?').click();
    await expect(animalsPages.commoditySelection.searchBox).toBeVisible();
    await expect(strip).toBeVisible();
    await expect(strip.locator('.govuk-tag')).toHaveText('Draft');
    await expect(strip).toContainText(GBN_REFERENCE);
  });
});
