import { test, expect } from '@fixtures';
import { destinationCountryNames } from '@domain/shared/fixtures/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Transit country list', { tag: ['@integration'] }, () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  test('the transit country search offers the origin countries and their territories, each territory named with its country, in alphabetical order', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toTransitedCountries();

    await expect(animalsPages.transitedCountries.countryOptions).toHaveText(destinationCountryNames());
  });
});
