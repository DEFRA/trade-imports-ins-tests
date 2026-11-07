import type { AnimalsPages } from '@page-objects';
import type { AnimalsSeededJourney } from '@flows/animals/seeded-journey';
import { test, expect } from '@fixtures';
import { MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';

const ARRIVAL_DETAILS_TASK = 'Arrival details';
const CHANGE_IMPORT_DETAILS = 'Change import details';
const AMENDED_REFERENCE = 'AMENDED-REF';
const AMEND = 'Amend';

const openOriginFromImportDetailsChangeLink = async (
  animalsPages: AnimalsPages,
  animalsSeededJourney: AnimalsSeededJourney,
): Promise<string> => {
  const reference = await animalsSeededJourney.createAmendNotification();
  await animalsPages.notificationView.open(reference);
  await animalsPages.notificationView.changeLink(CHANGE_IMPORT_DETAILS).click();
  await expect(animalsPages.originOfImport.heading).toBeVisible();
  return reference;
};

test.describe('Amendment page endings', () => {
  test('Amend opens the review page with the Amend tag, the reference and Cancel amend', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
    animalsNotificationActions,
  }) => {
    const reference = await animalsSeededJourney.createSubmittedNotification();
    await animalsNotificationActions.amendNotification(reference);

    await expect(pages.page).toHaveURL(animalsPages.notificationView.expectedUrl(reference));
    await expect(animalsPages.notificationView.statusTag).toHaveText(AMEND);
    await expect(animalsPages.notificationView.referenceNumberCaption).toContainText(reference);
    await expect(animalsPages.notificationView.cancelAmend).toBeVisible();
  });

  test.describe('a page opened from Overview while amending', () => {
    test.beforeEach(async ({ animalsPages, animalsSeededJourney }) => {
      const reference = await animalsSeededJourney.createAmendNotification();
      await animalsPages.overview.open(reference);
      await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
      await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    });

    test('ends with Save and continue beside Save and return to overview', async ({ animalsPages }) => {
      await expect(animalsPages.arrivalDetails.buttonGroup.getByRole('button')).toHaveText([
        'Save and continue',
        'Save and return to overview',
      ]);
    });

    test('shows Cancel and return to overview on its own line', async ({ animalsPages }) => {
      await expect(animalsPages.arrivalDetails.cancelAndReturnToOverview).toBeVisible();
    });

    test('shows Cancel amend in the strip', async ({ animalsPages }) => {
      await expect(animalsPages.arrivalDetails.cancelAmend).toBeVisible();
    });
  });

  test('the strip shows Amend and Cancel amend on Overview while amending', async ({ animalsPages, animalsSeededJourney }) => {
    const reference = await animalsSeededJourney.createAmendNotification();

    await animalsPages.overview.open(reference);

    await expect(animalsPages.overview.statusTag).toHaveText(AMEND);
    await expect(animalsPages.overview.cancelAmend).toBeVisible();
  });

  test('Cancel and return to overview while amending opens Overview and keeps the saved value', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.arrivalDetails.open(reference);
    await animalsPages.arrivalDetails.transportIdentification.fill('NOT-SAVED');

    await animalsPages.arrivalDetails.cancelAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.arrivalDetails.open(reference);
    await expect(animalsPages.arrivalDetails.transportIdentification).toHaveValue(MANDATORY_ANSWERS.transportIdentification);
  });

  test('a Change link opens the page that collects the answer, and Save and continue opens What are you importing?', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await openOriginFromImportDetailsChangeLink(animalsPages, animalsSeededJourney);

    await expect(pages.page).toHaveURL(animalsPages.originOfImport.changeContextUrl(reference));
    await animalsPages.originOfImport.internalReference.fill(AMENDED_REFERENCE);
    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(pages.page).not.toHaveURL(/\/notification-view/);
  });

  test('while amending, the origin page and the CPH number page end with Save and continue alone, and the contact address page ends as it does on a draft', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();

    await animalsPages.originOfImport.open(reference);
    await expect(animalsPages.originOfImport.formButtons).toHaveText(['Save and continue']);
    await expect(animalsPages.originOfImport.formLinks).toHaveCount(0);

    await animalsPages.cphNumber.open(reference);
    await expect(animalsPages.cphNumber.formButtons).toHaveText(['Save and continue']);
    await expect(animalsPages.cphNumber.saveAndReturnToOverview).toHaveCount(0);

    await animalsPages.contactAddress.open(reference);
    await expect(animalsPages.contactAddress.formButtons).toHaveText(['Save and continue', 'Save and return to overview']);
    await expect(animalsPages.contactAddress.cancelAndReturnToOverview).toBeVisible();
  });

  test('Continue on an amend review with an answer missing stays on the review and shows There is a problem, naming what is missing', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.arrivalDetails.open(reference);
    await animalsPages.arrivalDetails.arrivalDate.fill('');
    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();

    await animalsPages.notificationView.open(reference);
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);

    await animalsPages.notificationView.continueButton.click();

    await expect(pages.page).toHaveURL(/\/notification-view\?refused=1$/);
    await expect(animalsPages.notificationView.errorSummary).toBeVisible();
    await expect(animalsPages.notificationView.errorSummary).toContainText('There is a problem');
    await expect(animalsPages.notificationView.errorSummaryLinks).toHaveText(['Complete arrival details']);
    await expect(animalsPages.notificationView.statusTag).toHaveText(AMEND);
    await expect(animalsPages.declaration.heading).not.toBeVisible();
  });
});
