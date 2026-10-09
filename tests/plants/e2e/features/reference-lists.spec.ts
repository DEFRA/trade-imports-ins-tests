import { test, expect } from '@fixtures';
import { countriesOrigin, countryByCode, portLabel, portsOfEntry } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

const POTATOES = 'Potatoes (seed or ware)';
const SEED_POTATOES = 'Seed potatoes';

const potatoLine = {
  Variety: 'Maris Piper',
  Quantity: '250',
  'Intended use': 'Planting',
};

test.describe('Plants reference lists', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the origin list offers the captured SPS origin countries, in the order reference data serves them', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
    await plantsJourney.toOrigin();

    await expect(plantsPages.origin.countryOptions).toHaveText(countriesOrigin.map(({ name }) => name));
  });

  test('the place of landing list offers every captured port, in the order reference data serves them', async ({
    plantsPages,
    plantsJourney,
  }) => {
    await plantsJourney.startNotification();
    await plantsJourney.chooseCommodityType(POTATOES);
    await plantsJourney.addCommodityLine(SEED_POTATOES, potatoLine);
    await plantsJourney.toOrigin();
    await plantsJourney.toArrivalDetails(countryByCode('FR').display);

    await expect(plantsPages.arrivalDetails.placeOfLandingOptions).toHaveText(portsOfEntry.map(portLabel));
  });
});
