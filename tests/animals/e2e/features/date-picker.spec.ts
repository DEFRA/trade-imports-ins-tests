import { test } from '@fixtures';

test.describe('Date picker', { tag: '@duplicated-in-frontend' }, () => {
  test('the arrival date button is blue and its calendar ends above the port of entry question', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    const arrival = animalsPages.arrivalDetails;

    await arrival.arrivalDatePicker.expectToggleBlue();
    await arrival.arrivalDatePicker.open();
    await arrival.arrivalDatePicker.expectCalendarEndsAbove(arrival.fieldLabel('portOfEntry'));
  });

  test('the exit date button is blue and its calendar ends above the port of exit question', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toImportReason();
    const importReason = animalsPages.importReason;
    await importReason.reason('Temporary admission horses').check();

    await importReason.temporaryAdmissionExitDatePicker.expectToggleBlue();
    await importReason.temporaryAdmissionExitDatePicker.open();
    await importReason.temporaryAdmissionExitDatePicker.expectCalendarEndsAbove(importReason.fieldLabel('temporaryAdmissionPortOfExit'));
  });

  test('the date of issue button is blue and its calendar ends above the attachment question', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toAccompanyingDocuments();
    const accompanyingDocuments = animalsPages.accompanyingDocuments;

    await accompanyingDocuments.dateOfIssuePicker.expectToggleBlue();
    await accompanyingDocuments.dateOfIssuePicker.open();
    await accompanyingDocuments.dateOfIssuePicker.expectCalendarEndsAbove(accompanyingDocuments.fieldLabel('file'));
  });
});
