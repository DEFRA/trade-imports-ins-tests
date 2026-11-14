import { test, expect } from '@fixtures';
import { CPH_NUMBER_WITH_SLASHES } from '@domain/animals/constants/journey-options';

test.describe('All operator addresses', { tag: '@duplicated-in-frontend' }, () => {
  // The api seed unlocks only origin + commodity, so the review page is reached
  // through the full journey walk — the addresses leg of that walk picks the
  // canned parties whose names and countries are asserted here.
  test(
    'check your answers lists all six operators with the picked name and country',
    { tag: '@cross-browser' },
    async ({ animalsJourney, animalsPages }) => {
      test.slow();

      await animalsJourney.toReview();

      const addresses = animalsPages.notificationView.summaryCard('Addresses');
      const operator = (key: string) => animalsPages.notificationView.summaryValue(addresses, key);

      await expect(operator('Place of origin')).toContainText('Origin Farm');
      await expect(operator('Place of origin')).toContainText('Ireland');

      await expect(operator('Consignor')).toContainText('Astra Rosales');
      await expect(operator('Consignor')).toContainText('Switzerland');

      await expect(operator('Consignee')).toContainText('British Livestock Ltd');
      await expect(operator('Consignee')).toContainText('United Kingdom');

      await expect(operator('Importer')).toContainText('Import Co UK');
      await expect(operator('Importer')).toContainText('United Kingdom');

      await expect(operator('Place of destination')).toContainText('Tech Imports Ltd');
      await expect(operator('Place of destination')).toContainText('United Kingdom');

      await expect(operator('County parish holding (CPH) number')).toContainText(CPH_NUMBER_WITH_SLASHES);
    },
  );
});
