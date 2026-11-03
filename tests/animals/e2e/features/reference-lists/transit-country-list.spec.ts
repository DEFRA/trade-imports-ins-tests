import { test, expect } from '@fixtures';
import { countryAndSubdivisionNamesWithCountry } from '@resources/reference-data/reference-data';
import { TRANSIT_COUNTRY_SELECT_TEXT } from '@domain/animals/constants/transit-countries-page';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Transit country list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  for (const javaScriptEnabled of [true, false]) {
    test.describe(`with JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, () => {
      test.use({ javaScriptEnabled });

      test('the transit select opens on "Select a country" followed by the captured countries and territories, each territory named with its country', async ({
        animalsJourney,
        animalsPages,
      }) => {
        await animalsJourney.toTransitedCountries();

        await expect(animalsPages.transitedCountries.country.options).toHaveText([
          TRANSIT_COUNTRY_SELECT_TEXT,
          ...countryAndSubdivisionNamesWithCountry(),
        ]);
      });
    });
  }

  test.describe('with JavaScript on', () => {
    test('typing Fra lists France and the French territories, each ending (France)', async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.toTransitedCountries();
      const { country } = animalsPages.transitedCountries;

      await country.search('Fra');

      await expect(country.suggestions).toHaveText(
        countryAndSubdivisionNamesWithCountry().filter((name) => name === 'France' || name.endsWith('(France)')),
      );
    });
  });
});
