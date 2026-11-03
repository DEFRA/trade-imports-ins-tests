import { test, expect } from '@fixtures';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { expectEmptyTransitList } from '@utils/transit-countries-assertions';

const TRANSPORT_AND_ARRIVAL_HEADING = '3. Transport and arrival';
const TASKS_WITHOUT_TRANSIT_COUNTRIES = ['Arrival details', 'Transport details'];
const TASKS_WITH_TRANSIT_COUNTRIES = ['Arrival details', 'Transit countries', 'Transport details'];

test.describe('Transit countries scope', { tag: '@duplicated-in-frontend' }, () => {
  test('the transit-countries page is routed only for rail or road; changing the means wipes saved countries', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.airplane.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(
      TASKS_WITHOUT_TRANSIT_COUNTRIES,
    );

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.railway.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(TASKS_WITH_TRANSIT_COUNTRIES);
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('To do');

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.roadVehicle.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(TASKS_WITH_TRANSIT_COUNTRIES);
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await animalsPages.transitedCountries.addCountry('France');
    await animalsPages.transitedCountries.addCountry('Belgium');
    await animalsPages.transitedCountries.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Transit countries')).toHaveText('Complete');

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.vessel.display);
    await expect(animalsPages.overview.taskTitlesInSectionHeaded(TRANSPORT_AND_ARRIVAL_HEADING)).toHaveText(
      TASKS_WITHOUT_TRANSIT_COUNTRIES,
    );

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.roadVehicle.display);
    await animalsPages.overview.task('Transit countries').click();
    await expect(animalsPages.transitedCountries.heading).toBeVisible();
    await expectEmptyTransitList(animalsPages.transitedCountries);
  });

  test('opening the transit-countries page by its address shows the overview when no means, air or sea is saved', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    const referenceNumber = animalsPages.overview.referenceNumberFromUrl();
    const overviewPath = animalsPages.overview.currentJourneyUrl();

    await animalsPages.transitedCountries.open(referenceNumber);
    await animalsPages.overview.expectShownAt(overviewPath);

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.airplane.display);
    await animalsPages.transitedCountries.open(referenceNumber);
    await animalsPages.overview.expectShownAt(overviewPath);

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.vessel.display);
    await animalsPages.transitedCountries.open(referenceNumber);
    await animalsPages.overview.expectShownAt(overviewPath);
  });

  test('adding a country from a transit-countries page left open after the means changed to air shows the overview', async ({
    pages,
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toTransitedCountries();
    const referenceNumber = animalsPages.transitedCountries.referenceNumberFromUrl();
    const overviewPath = animalsPages.overview.currentJourneyUrl();

    const secondTab = await pages.page.context().newPage();
    try {
      await animalsJourney.saveArrivalDetailsInTab(secondTab, referenceNumber, meansOfTransport.airplane.display);
    } finally {
      await secondTab.close();
    }

    await animalsPages.transitedCountries.country.choose('France');
    await animalsPages.transitedCountries.addCountryButton.click();

    await animalsPages.overview.expectShownAt(overviewPath);
  });
});
