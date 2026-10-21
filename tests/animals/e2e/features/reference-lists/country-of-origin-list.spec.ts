import { test, expect } from '@fixtures';
import { countryAndSubdivisionNamesWithCountry } from '@resources/reference-data/reference-data';
import { skipUnlessComposeEnvironment } from '@utils/playwright/environment';

test.describe('Country of origin list', () => {
  test.beforeEach(() => {
    skipUnlessComposeEnvironment("the list is the stub's MDM fixture, which only the compose stack is sure to serve");
  });

  for (const javaScriptEnabled of [true, false]) {
    test.describe(`with JavaScript ${javaScriptEnabled ? 'on' : 'off'}`, () => {
      test.use({ javaScriptEnabled });

      test('the country of origin list offers the captured origin countries and territories, each territory named with its country', async ({
        animalsJourney,
        animalsPages,
      }) => {
        await animalsJourney.startNotification();
        await animalsPages.overview.task('Where is this consignment coming from?').click();

        await expect(animalsPages.originOfImport.country.selectableOptions).toHaveText(countryAndSubdivisionNamesWithCountry());
      });
    });
  }

  test.describe('with JavaScript on', () => {
    test('typing Fra lists France and the French territories, each ending (France)', async ({ animalsJourney, animalsPages }) => {
      await animalsJourney.startNotification();
      await animalsPages.overview.task('Where is this consignment coming from?').click();
      const { country } = animalsPages.originOfImport;

      await country.field.fill('Fra');

      await expect(country.suggestions).toHaveText(
        countryAndSubdivisionNamesWithCountry().filter((name) => name === 'France' || name.endsWith('(France)')),
      );
    });
  });
});
