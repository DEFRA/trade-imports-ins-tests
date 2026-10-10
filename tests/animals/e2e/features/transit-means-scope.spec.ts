import { test, expect } from '@fixtures';

test.describe('Transit countries scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('the transit-countries page is routed only for rail or road; changing the means wipes saved countries', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    const transitRow = pages.page.locator('.govuk-task-list__item', { hasText: 'Transit countries' });

    // Arrival details is enforced-at-continue, so the whole page is filled; the
    // means routes the section from that one save.
    const saveArrivalWithMeans = async (means: string) => {
      await animalsPages.overview.task('Arrival details').click();
      await expect(animalsPages.arrivalDetails.heading).toBeVisible();
      await animalsJourney.fillArrivalDetails(means);
      await animalsPages.arrivalDetails.saveAndContinue.click();
      await expect(animalsPages.overview.heading).toBeVisible();
    };

    // A means outside the overland set (Air) leaves the Transit countries
    // row off the hub.
    await saveArrivalWithMeans('Air');
    await expect(transitRow).toHaveCount(0);

    // Rail puts the Transit countries row on the hub.
    await saveArrivalWithMeans('Rail');
    await expect(transitRow).toHaveCount(1);

    // So does Road; save two countries from it and the row reads Complete.
    await saveArrivalWithMeans('Road');
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(transitRow).toContainText('Complete');

    // Changing to a non-overland means takes the countries out of scope — the
    // hub row drops.
    await saveArrivalWithMeans('Sea');
    await expect(transitRow).toHaveCount(0);

    // Back to Road: leaving scope wiped the saved countries — the page
    // returns with an empty list.
    await saveArrivalWithMeans('Road');
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expect(animalsPages.transitedCountries.row('France')).toHaveCount(0);
    await expect(animalsPages.transitedCountries.row('Belgium')).toHaveCount(0);
  });
});
