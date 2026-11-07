import { test, expect } from '@fixtures';
import { createAnimalsPages, createSharedPages, type AnimalsPages, type SharedPages } from '@page-objects';
import { AnimalsJourney } from '@flows/animals/journey';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { expectEmptyTransitList } from '@utils/transit-countries-assertions';

const TRANSPORT_AND_ARRIVAL_HEADING = '3. Transport and arrival';
const TASKS_WITHOUT_TRANSIT_COUNTRIES = ['Arrival details', 'Transport details'];
const TASKS_WITH_TRANSIT_COUNTRIES = ['Arrival details', 'Transit countries', 'Transport details'];

const expectOverviewShownFor = async (pages: SharedPages, animalsPages: AnimalsPages, referenceNumber: string): Promise<void> => {
  await expect(animalsPages.overview.heading).toBeVisible();
  await expect(pages.page).toHaveURL((url) => url.pathname === animalsPages.overview.expectedUrl(referenceNumber));
};

test.describe('Transit countries scope', { tag: '@duplicated-in-frontend' }, () => {
  test(
    'the transit-countries page is routed only for rail or road; changing the means wipes saved countries',
    { tag: '@cross-browser' },
    async ({ animalsJourney, animalsPages }) => {
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
      await animalsPages.transitedCountries.saveAndReturnToOverview.click();
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
    },
  );

  test('opening the transit-countries page by its address shows the overview when no means, air or sea is saved', async ({
    pages,
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.answerCommodity();
    const referenceNumber = animalsPages.overview.referenceNumberFromUrl();

    await animalsPages.transitedCountries.open(referenceNumber);
    await expectOverviewShownFor(pages, animalsPages, referenceNumber);

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.airplane.display);
    await animalsPages.transitedCountries.open(referenceNumber);
    await expectOverviewShownFor(pages, animalsPages, referenceNumber);

    await animalsJourney.saveArrivalDetailsFromOverview(meansOfTransport.vessel.display);
    await animalsPages.transitedCountries.open(referenceNumber);
    await expectOverviewShownFor(pages, animalsPages, referenceNumber);
  });

  test('adding a country from a transit-countries page left open after the means changed to air shows the overview', async ({
    pages,
    animalsJourney,
    animalsPages,
    journeyContext,
  }) => {
    await animalsJourney.toTransitedCountries();
    const referenceNumber = animalsPages.transitedCountries.referenceNumberFromUrl();

    const secondTab = await pages.page.context().newPage();
    try {
      const secondTabPages = createAnimalsPages(secondTab);
      const secondTabJourney = new AnimalsJourney(secondTabPages, createSharedPages(secondTab), journeyContext);
      await secondTabPages.arrivalDetails.open(referenceNumber);
      await secondTabJourney.saveArrivalDetailsOnOpenPage({ means: meansOfTransport.airplane.display });
    } finally {
      await secondTab.close();
    }

    await animalsPages.transitedCountries.country.choose('France');
    await animalsPages.transitedCountries.addCountryButton.click();

    await expectOverviewShownFor(pages, animalsPages, referenceNumber);
  });
});
