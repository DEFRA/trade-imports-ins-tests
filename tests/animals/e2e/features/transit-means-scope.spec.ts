import type { Page } from '@playwright/test';
import { test, expect, type PageFixtures } from '@fixtures';

test.describe('Transit countries scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  const transitRowOn = (page: Page) => page.locator('.govuk-task-list__item', { hasText: 'Transit countries' });

  // The means of transport is the one answer Arrival details needs to
  // continue, and that one save routes the section.
  const saveArrivalWithMeans = async (animalsPages: PageFixtures['animalsPages'], means: string) => {
    await animalsPages.overview.task('Arrival details').click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await animalsPages.arrivalDetails.meansOfTransport.selectOption({ label: means });
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  };

  test('the transit-countries page is routed only for rail or road; changing the means wipes saved countries', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    const transitRow = transitRowOn(pages.page);

    // A means outside the overland set (Air) leaves the Transit countries
    // row off the hub.
    await saveArrivalWithMeans(animalsPages, 'Air');
    await expect(transitRow).toHaveCount(0);

    // Rail puts the Transit countries row on the hub, To do while no country is saved.
    await saveArrivalWithMeans(animalsPages, 'Rail');
    await expect(transitRow).toHaveCount(1);
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('To do');

    // So does Road; save two countries from it and the row reads Complete.
    await saveArrivalWithMeans(animalsPages, 'Road');
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(transitRow).toContainText('Complete');

    // Changing to a non-overland means takes the countries out of scope — the
    // hub row drops.
    await saveArrivalWithMeans(animalsPages, 'Sea');
    await expect(transitRow).toHaveCount(0);

    // Back to Road: leaving scope wiped the saved countries — the page
    // returns with an empty list.
    await saveArrivalWithMeans(animalsPages, 'Road');
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expect(animalsPages.transitedCountries.row('France')).toHaveCount(0);
    await expect(animalsPages.transitedCountries.row('Belgium')).toHaveCount(0);
  });

  test('the Transit countries task stays off the overview until a commodity is chosen, then sits between Arrival details and Transport details as To do', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    const transitRow = transitRowOn(pages.page);

    await saveArrivalWithMeans(animalsPages, 'Road');
    await expect(transitRow).toHaveCount(0);

    await animalsJourney.answerCommodity();
    await expect(animalsPages.overview.region('3. Transport and arrival').getByRole('link')).toHaveText([
      'Arrival details',
      'Transit countries',
      'Transport details',
    ]);
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('To do');

    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('Complete');
  });

  test('a cat consignment travelling by air has no Transit countries task, before or after arrival details are saved', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();

    const transitRow = transitRowOn(pages.page);

    await animalsPages.overview.task('What are you importing?').click();
    await animalsPages.commoditySelection.selectSpecies(['Felis catus']);
    await animalsPages.commoditySelection.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(transitRow).toHaveCount(0);

    await saveArrivalWithMeans(animalsPages, 'Air');
    await expect(transitRow).toHaveCount(0);
  });
});
