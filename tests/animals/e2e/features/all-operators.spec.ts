import { test, expect } from '@fixtures';
import { CPH_NUMBER_DISPLAY } from '@domain/animals/constants/journey-options';

test.describe('All operator addresses', { tag: '@duplicated-in-frontend' }, () => {
  test(
    'check your answers lists all six operators with the picked name and country',
    { tag: ['@cross-browser', '@ios'] },
    async ({ animalsJourney, animalsPages }) => {
      test.slow();

      await animalsJourney.toReview();

      const addresses = animalsPages.notificationView.addressesCard;
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

      await expect(operator('County parish holding (CPH) number')).toContainText(CPH_NUMBER_DISPLAY);
    },
  );
});
