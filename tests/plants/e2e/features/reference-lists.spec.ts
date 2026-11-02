import { test, expect } from '@fixtures';
import { countryByCode, countryAndSubdivisionNames, portLabel, portsOfEntry } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { POTATOES } from '@flows/plants/journey';
import { PLACE_OF_LANDING_SELECT_TEXT } from '@domain/plants/constants/arrival-details-page';
import { ORIGIN_COUNTRY_SELECT_TEXT } from '@domain/plants/constants/origin-page';

test.describe('Plants reference lists', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the origin list offers the captured SPS origin countries and their territories, by name', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);

    await expect(plantsPages.origin.country.options).toHaveText([ORIGIN_COUNTRY_SELECT_TEXT, ...countryAndSubdivisionNames()]);
  });

  test('the place of landing list offers every captured port, in the order reference data serves them', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);
    await plantsJourney.toArrivalDetails(countryByCode('FR').display);

    await expect(plantsPages.arrivalDetails.placeOfLanding.options).toHaveText([
      PLACE_OF_LANDING_SELECT_TEXT,
      ...portsOfEntry.map(portLabel),
    ]);
  });
});
