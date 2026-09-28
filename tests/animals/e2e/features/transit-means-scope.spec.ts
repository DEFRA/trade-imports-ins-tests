import { test, expect } from '@fixtures';

test.describe('Transit countries scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the transit-countries page is routed only for rail or road; changing the means wipes saved countries', async ({
    journey,
    pages,
    animalsPages,
  }) => {
    await journey.startNotification();
    await journey.unlockSections();

    const transitRow = pages.page.locator('.govuk-task-list__item', { hasText: 'Transit countries' });

    // Arrival details is enforced-at-continue, so the whole page is filled; the
    // means routes the section from that one save.
    const saveArrivalWithMeans = async (means: string) => {
      await animalsPages.overview.task('Arrival details').click();
      await expect(animalsPages.arrivalDetails.heading).toBeVisible();
      await journey.fillArrivalDetails(means);
      await animalsPages.arrivalDetails.saveAndContinue.click();
    };
    // A blank save on the transporter-type page (submit-enforced) returns to the hub.
    const saveThroughTransporters = async () => {
      await expect(animalsPages.transporter.heading).toBeVisible();
      await animalsPages.transporter.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
    };

    // A means outside the overland set (Airplane) skips the transit-countries
    // page — the save walks straight to the transporter-type page — and the hub
    // shows no conditional Transit countries row.
    await saveArrivalWithMeans('Airplane');
    await saveThroughTransporters();
    await expect(transitRow).toHaveCount(0);

    // A road vehicle routes through the transit-countries page; save two countries
    // and the hub row reads Complete.
    await saveArrivalWithMeans('Road Vehicle');
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await saveThroughTransporters();
    await expect(transitRow).toContainText('Complete');

    // Changing to a non-overland means takes the countries out of scope — the
    // page is skipped and the hub row drops.
    await saveArrivalWithMeans('Vessel');
    await saveThroughTransporters();
    await expect(transitRow).toHaveCount(0);

    // Back to a road vehicle: leaving scope wiped the saved countries — the page
    // returns with an empty list.
    await saveArrivalWithMeans('Road Vehicle');
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expect(animalsPages.transitedCountries.row('France')).toHaveCount(0);
    await expect(animalsPages.transitedCountries.row('Belgium')).toHaveCount(0);
  });
});
