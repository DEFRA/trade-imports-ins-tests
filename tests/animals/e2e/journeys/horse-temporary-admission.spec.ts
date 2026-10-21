import { commodityLines, speciesCardTitle } from '@domain/animals/constants/commodity-lines';
import { SET_BASES } from '@page-objects/shared/sets';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { HORSE_TRANSPORT_ID, HORSE_TRANSPORTER, OPENING_RUN_TASKS, TEMPORARY_ADMISSION_EXIT_DATE } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

test.describe('Horse by sea under temporary admission', () => {
  test('walks a horse-by-sea notification under temporary admission from create to submitted, with every task complete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const referenceNumber = await animalsJourney.walkOpeningRunHorseBySea({
      reference: `SEADOC${Date.now()}`,
      issueDate: '03/01/2026',
      filePath: fileUploadPaths.safeFile1kbPdf,
      type: 'VETERINARY_HEALTH_CERTIFICATE',
    });
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${referenceNumber}/notification-view$`));

    await animalsPages.overview.open(referenceNumber);
    for (const task of OPENING_RUN_TASKS) {
      await expect(animalsPages.overview.taskStatus(task)).toHaveText('Complete');
    }
    await expect(animalsPages.overview.taskStatuses).toHaveCount(OPENING_RUN_TASKS.length);
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Country of origin')).toHaveText('Ireland');

    const speciesCard = animalsPages.notificationView.summaryCard(speciesCardTitle(commodityLines.horse));
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText(commodityLines.horse.latinName);
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Number of animals')).toHaveText('1');

    const reasonForImport = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Reason for import')).toHaveText('Temporary admission horses');
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Exit date')).toHaveText(TEMPORARY_ADMISSION_EXIT_DATE);
    await expect(animalsPages.notificationView.summaryValue(reasonForImport, 'Port of exit')).toContainText('Holyhead Port');

    const additionalAnimalDetails = animalsPages.notificationView.summaryCard('Additional animal details');
    await expect(animalsPages.notificationView.summaryValue(additionalAnimalDetails, 'Certified for')).toHaveText(
      'Registered equine animal',
    );

    const arrivalDetails = animalsPages.notificationView.summaryCard('Arrival details');
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Port of entry')).toContainText('Holyhead Port');
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Means of transport to the port of entry')).toHaveText(
      'Vessel',
    );
    await expect(animalsPages.notificationView.summaryValue(arrivalDetails, 'Transport identification')).toHaveText(HORSE_TRANSPORT_ID);

    const transportDetails = animalsPages.notificationView.summaryCard('Transport details');
    await expect(animalsPages.notificationView.summaryValue(transportDetails, 'Name')).toContainText(HORSE_TRANSPORTER);

    await animalsJourney.submitFromReview();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();
  });
});
