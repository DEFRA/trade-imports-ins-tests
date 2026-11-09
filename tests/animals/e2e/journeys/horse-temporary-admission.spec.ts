import { commodityLines } from '@domain/animals/constants/commodity-lines';
import { openReviewFromCompleteOverview } from '@page-objects/shared/journey-checks';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import {
  HORSE_TRANSPORT_ID,
  HORSE_TRANSPORTER,
  AIR_OR_SEA_OVERVIEW_TASKS,
  TEMPORARY_ADMISSION_EXIT_DATE,
  certificateDocument,
} from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Horse by sea under temporary admission', () => {
  test(
    'walks a horse-by-sea notification under temporary admission from create to submitted, with every task complete',
    { tag: '@cross-browser' },
    async ({ animalsJourney, animalsPages, pages }) => {
      test.slow();

      const referenceNumber = await animalsJourney.walkHorseBySea(certificateDocument('SEADOC'));
      await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrlPattern(referenceNumber));

      await openReviewFromCompleteOverview(animalsPages.overview, animalsJourney, referenceNumber, AIR_OR_SEA_OVERVIEW_TASKS);

      const importDetails = animalsPages.notificationView.summaryCard('Import details');
      await expect(animalsPages.notificationView.summaryValue(importDetails, 'Country of origin')).toHaveText('Ireland');

      const speciesCard = animalsPages.notificationView.speciesCard(commodityLines.horse);
      await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commodityLines.horse.latinName);
      await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('1');

      const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
      await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText(
        'Temporary admission horses',
      );
      await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Exit date')).toHaveText(TEMPORARY_ADMISSION_EXIT_DATE);
      await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Port of exit')).toContainText('Holyhead Port');

      const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
      await expect(additionalAnimalDetails.getByRole('term')).toHaveText(['Certified for', 'Includes unweaned animals']);
      await expect(additionalAnimalDetails.getByRole('definition')).toHaveText(['Registered equine animal', 'No']);

      const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
      await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Port of entry')).toContainText('Holyhead Port');
      await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(
        meansOfTransport.vessel.display,
      );
      await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Transport identification')).toHaveText(HORSE_TRANSPORT_ID);

      const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
      await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText(HORSE_TRANSPORTER);

      await animalsJourney.submitFromReview();
      await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
    },
  );
});
