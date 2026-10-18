import { test, expect } from '@fixtures';
import { countryByCode, originPageCountryNames, portLabel, portsOfEntry } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';
import { POTATOES } from '@flows/plants/journey';

test.describe('Plants reference lists', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the origin list offers the captured SPS origin countries and their territories, by name', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);

    await expect(plantsPages.origin.countryOptions).toHaveText(originPageCountryNames());
  });

  test('the place of landing list offers every captured port, in the order reference data serves them', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.toOriginOfNewNotification(POTATOES);
    await plantsJourney.toArrivalDetails(countryByCode('FR').display);

    await expect(plantsPages.arrivalDetails.placeOfLandingOptions).toHaveText(portsOfEntry.map(portLabel));
  });
});
