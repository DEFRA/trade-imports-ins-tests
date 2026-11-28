import { test, expect } from '@fixtures';
import { ALL_ANSWERS_WITHOUT_DOCUMENT } from '@domain/animals/constants/journey-options';

test.describe('Notification copy', () => {
  test('carries the trade answers and clears the shipment answers from the submitted version', async ({
    animalsSeededJourney,
    animalsNotificationActions,
    animalsPages,
    journeyContext,
  }) => {
    test.slow();
    const TRADE_ROWS = [
      'Where is this consignment coming from?',
      'What are you importing?',
      'Main import reason',
      'Additional details',
      'Consignment addresses',
    ];
    const SHIPMENT_ROWS = ['Commodity details', 'Identification details', 'Arrival details', 'Transport details', 'Upload documents'];
    const sourceReferenceNumber = await animalsSeededJourney.createSubmittedNotification(ALL_ANSWERS_WITHOUT_DOCUMENT);

    await animalsNotificationActions.copyFromNotificationView(sourceReferenceNumber);
    const copiedReferenceNumber = journeyContext.referenceNumber;

    for (const task of TRADE_ROWS) {
      await expect(animalsPages.overview.taskStatus(task)).toHaveText('Complete');
    }
    for (const task of SHIPMENT_ROWS) {
      await expect(animalsPages.overview.taskStatus(task)).toHaveText('To do');
    }
    await expect(animalsPages.overview.animalsTotalRegion).toContainText('0');
    await expect(animalsPages.overview.packagesTotalRegion.locator('> *')).toHaveText([
      'Packages/boxes',
      'Total number of packages in this consignment',
    ]);

    await animalsPages.originOfImport.open(copiedReferenceNumber);
    await expect(animalsPages.originOfImport.internalReference).toHaveValue(ALL_ANSWERS_WITHOUT_DOCUMENT.internalReference);

    await animalsPages.additionalDetails.open(copiedReferenceNumber);
    await expect(animalsPages.additionalDetails.certifiedFor('Slaughter')).toBeChecked();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('No')).toBeChecked();
  });

  test('copies the submitted version when an amendment in progress has not been resubmitted', async ({
    animalsSeededJourney,
    animalsNotificationActions,
    animalsPages,
    journeyContext,
  }) => {
    test.slow();
    const sourceReferenceNumber = await animalsSeededJourney.createSubmittedNotification(ALL_ANSWERS_WITHOUT_DOCUMENT);
    await animalsNotificationActions.amendNotification(sourceReferenceNumber);
    await animalsNotificationActions.changeInternalReferenceOnAmendment(sourceReferenceNumber, 'ChangedRef1');

    await animalsNotificationActions.copyNotification(sourceReferenceNumber);
    const copiedReferenceNumber = journeyContext.referenceNumber;

    await animalsPages.originOfImport.open(copiedReferenceNumber);
    await expect(animalsPages.originOfImport.internalReference).toHaveValue(ALL_ANSWERS_WITHOUT_DOCUMENT.internalReference);
  });
});
