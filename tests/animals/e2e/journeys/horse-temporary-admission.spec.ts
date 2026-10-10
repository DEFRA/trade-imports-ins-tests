import { SET_BASES } from '@page-objects/shared/sets';
import { fileUploadPaths } from '@resources/file-upload/paths';
import { HORSE_TRANSPORT_ID, HORSE_TRANSPORTER, TEMPORARY_ADMISSION_EXIT_DATE } from '@flows/animals/journey';

import { test, expect } from '@fixtures';

const HORSE_BY_SEA_TASKS = [
  'Where is this consignment coming from?',
  'What are you importing?',
  'Main reason for import',
  'Commodity details',
  'Identification details',
  'Additional details',
  'Arrival details',
  'Transport details',
  'Upload documents',
  'Roles and addresses',
  'Contact address for this consignment',
];

test.describe('Horse by sea under temporary admission', { tag: ['@integration'] }, () => {
  test('walks a horse-by-sea notification under temporary admission from create to submitted, with every task complete', async ({
    animalsJourney,
    animalsPages,
    pages,
  }) => {
    test.slow();

    const journeyId = await animalsJourney.walkOpeningRunHorseBySea({
      reference: `SEADOC${Date.now()}`,
      issueDate: '03/01/2026',
      filePath: fileUploadPaths.safeFile1kbPdf,
      type: 'VETERINARY_HEALTH_CERTIFICATE',
    });
    await expect(pages.page).toHaveURL(new RegExp(`${SET_BASES.liveAnimals}/notifications/${journeyId}/notification-view$`));

    await animalsPages.overview.open(journeyId);
    for (const task of HORSE_BY_SEA_TASKS) {
      await expect(animalsPages.overview.taskStatus(task)).toHaveText('Complete');
    }
    await expect(animalsPages.overview.taskStatuses).toHaveCount(HORSE_BY_SEA_TASKS.length);
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { level: 3, name: 'Main import reason' })).toBeVisible();

    const importDetails = animalsPages.notificationView.summaryCard('Import details');
    await expect(animalsPages.notificationView.summaryValue(importDetails, 'Country of origin')).toHaveText('Ireland');

    const speciesCard = animalsPages.notificationView.summaryCard('Horse (0101) — Equus caballus');
    await expect(animalsPages.notificationView.summaryValue(speciesCard, 'Species')).toHaveText('Equus caballus');
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
