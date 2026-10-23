import { test } from '@fixtures';
import { expectBlueToggleAndCalendarEndingAbove } from '@utils/date-picker-assertions';

test.describe('Date picker', { tag: '@duplicated-in-frontend' }, () => {
  test('the arrival date button is blue and its calendar ends above the port of entry question', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    const arrival = animalsPages.arrivalDetails;

    await expectBlueToggleAndCalendarEndingAbove(arrival.arrivalDatePicker, arrival.fieldLabel('portOfEntry'));
  });

  test('the exit date button is blue and its calendar ends above the port of exit question', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toImportReason();
    const importReason = animalsPages.importReason;
    await importReason.reason('Temporary admission horses').check();

    await expectBlueToggleAndCalendarEndingAbove(
      importReason.temporaryAdmissionExitDatePicker,
      importReason.fieldLabel('temporaryAdmissionPortOfExit'),
    );
  });

  test('the date of issue button is blue and its calendar ends above the attachment question', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toAccompanyingDocuments();
    const accompanyingDocuments = animalsPages.accompanyingDocuments;

    await expectBlueToggleAndCalendarEndingAbove(accompanyingDocuments.dateOfIssuePicker, accompanyingDocuments.fieldLabel('file'));
  });
});
