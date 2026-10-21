import { test } from '@fixtures';

test.describe('Date picker', { tag: '@duplicated-in-frontend' }, () => {
  test('the arrival date button is blue and its calendar ends above the port of entry question', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    const { arrivalDatePicker, portOfEntryLabel } = animalsPages.arrivalDetails;

    await arrivalDatePicker.expectToggleBlue();
    await arrivalDatePicker.open();
    await arrivalDatePicker.expectCalendarEndsAbove(portOfEntryLabel);
  });

  test('the exit date button is blue and its calendar ends above the port of exit question', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Temporary admission horses').check();
    const { temporaryAdmissionExitDatePicker, temporaryAdmissionPortOfExitLabel } = animalsPages.importReason;

    await temporaryAdmissionExitDatePicker.expectToggleBlue();
    await temporaryAdmissionExitDatePicker.open();
    await temporaryAdmissionExitDatePicker.expectCalendarEndsAbove(temporaryAdmissionPortOfExitLabel);
  });

  test('the date of issue button is blue and its calendar ends above the attachment question', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.toAccompanyingDocuments();
    const { dateOfIssuePicker, fileUploadLabel } = animalsPages.accompanyingDocuments;

    await dateOfIssuePicker.expectToggleBlue();
    await dateOfIssuePicker.open();
    await dateOfIssuePicker.expectCalendarEndsAbove(fileUploadLabel);
  });
});
