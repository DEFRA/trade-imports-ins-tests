import { test, expect } from '@fixtures';
import { getRelativeAppDateText } from '@utils/date-utils';

const COMPLETE = 'Complete';
const TO_DO = 'To do';
const IMPORT_REASON_TASK = 'Main reason for import';
const ADDITIONAL_DETAILS_TASK = 'Additional details';

test.describe('Reason and purpose scope', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('purpose is owed only for the internal market and is wiped when the reason changes', async ({
    animalsJourney,
    pages,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    // No reason saved yet: the task is not complete.
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(TO_DO);

    // Internal market: the purpose reveals under the reason, so reason + purpose
    // go in on one submit, which finishes the reason task on its own while
    // Additional details is still to do.
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
    await expect(animalsPages.overview.taskStatus(ADDITIONAL_DETAILS_TASK)).toHaveText(TO_DO);

    // Transit: the purpose is no longer owed, but the reason-gated exit details
    // (port of exit + destination country) come into scope and reveal under the
    // reason, so the walk answers them on the same submit.
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.transitPortOfExit.selectOption({ index: 1 });
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
    await expect(animalsPages.overview.taskStatus(ADDITIONAL_DETAILS_TASK)).toHaveText(TO_DO);

    // Back to the internal market: leaving scope wiped the saved purpose, so no
    // purpose radio is pre-selected and the task is owed again. The assertion is
    // scoped to the purpose radios — the reason radio is checked on this page.
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Internal market').check();
    await expect(pages.page.locator('input[name="purposeInInternalMarket"]:checked')).toHaveCount(0);

    // The purpose is owed again, and it is now enforced where it is asked: a
    // blank save returns the page with the error rather than walking on.
    await animalsPages.importReason.saveAndContinue.click();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: 'Select a purpose in the internal market' })).toBeVisible();
    await expect(animalsPages.additionalDetails.heading).toHaveCount(0);

    // Answering the newly owed purpose completes the row again.
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
  });

  test('re-entry alone completes the main reason for import while additional details is still to do', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Re-entry').check();
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
    await expect(animalsPages.overview.taskStatus(ADDITIONAL_DETAILS_TASK)).toHaveText(TO_DO);
  });

  test('transhipment with a destination country completes the main reason for import while additional details is still to do', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Transhipment or onward travel').check();
    await animalsPages.importReason.transhipmentDestinationCountry.selectOption('FR');
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
    await expect(animalsPages.overview.taskStatus(ADDITIONAL_DETAILS_TASK)).toHaveText(TO_DO);
  });

  test('temporary admission horses with an exit date and port of exit completes the main reason for import while additional details is still to do', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsJourney.unlockSections();

    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Temporary admission horses').check();
    await animalsPages.importReason.temporaryAdmissionExitDate.fill(getRelativeAppDateText({ monthOffset: 2 }));
    await animalsPages.importReason.temporaryAdmissionPortOfExit.selectOption({ index: 1 });
    await animalsPages.importReason.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
    await expect(animalsPages.overview.taskStatus(ADDITIONAL_DETAILS_TASK)).toHaveText(TO_DO);
  });
});
