import { test, expect } from '@fixtures';

const COMPLETE = 'Complete';
const TO_DO = 'To do';
const ORIGIN_TASK = 'Where is this consignment coming from?';
const IMPORT_REASON_TASK = 'Main reason for import';
const COMMODITY_SELECTION_TASK = 'What are you importing?';
const ARRIVAL_DETAILS_TASK = 'Arrival details';
const IMPOSSIBLE_ARRIVAL_DATE = '31/2/2026';
const ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const COMMODITY_DETAILS_TASK = 'Commodity details';
const ADDITIONAL_DETAILS_TASK = 'Additional details';
const IMPOSSIBLE_EXIT_DATE = '31/2/2026';
const EXIT_DATE_ERROR = 'Enter a real date';
const CHANGE_REASON_FOR_IMPORT = 'Change reason for import';

test.describe('Save and return to overview', { tag: ['@integration'] }, () => {
  test('main reason for import: when a required answer is missing, saves, leaves the task not complete and keeps the answers', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    // Act
    await animalsPages.importReason.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.importReason.errorSummary).toBeHidden();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).not.toHaveText(COMPLETE);
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await expect(animalsPages.importReason.reason('Transit')).toBeChecked();
  });

  test('main reason for import: when transit has a destination country but no port of exit, saves without an error and keeps transit and the country', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');

    // Act
    await animalsPages.importReason.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.importReason.errorSummary).toBeHidden();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).not.toHaveText(COMPLETE);
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await expect(animalsPages.importReason.reason('Transit')).toBeChecked();
    await expect(animalsPages.importReason.transitDestinationCountry).toHaveValue('FR');
    await expect(animalsPages.importReason.transitPortOfExit).toHaveValue('');
  });

  test('main reason for import: when the reason changes from internal market to transit, clears the saved purpose', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Internal market').check();
    await animalsPages.importReason.purpose('Breeding').check();
    await animalsPages.importReason.saveAndContinue.click();
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Transit').check();

    // Act
    await animalsPages.importReason.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await animalsPages.importReason.reason('Internal market').check();
    await expect(animalsPages.importReason.purpose('Breeding')).not.toBeChecked();
  });

  test('main reason for import: when no reason is chosen, keeps every earlier answer', async ({ animalsPages, animalsSeededJourney }) => {
    // Arrange
    const reference = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsPages.importReason.open(reference);
    await animalsPages.importReason.clearChoices();

    // Act
    await animalsPages.importReason.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(COMPLETE);
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await expect(animalsPages.importReason.reason('Internal market')).toBeChecked();
    await expect(animalsPages.importReason.purpose('Breeding')).toBeChecked();
  });

  test("main reason for import: when the exit date is not a real date, refuses the save with the exit date's error and keeps nothing", async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Temporary admission horses').check();
    await animalsPages.importReason.temporaryAdmissionExitDate.fill(IMPOSSIBLE_EXIT_DATE);
    await animalsPages.importReason.temporaryAdmissionPortOfExit.selectOption({ index: 1 });

    // Act
    await animalsPages.importReason.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.importReason.heading).toBeVisible();
    await expect(animalsPages.importReason.errorSummary).toBeVisible();
    await expect(animalsPages.importReason.temporaryAdmissionExitDateError).toContainText(EXIT_DATE_ERROR);
    await animalsPages.overview.open(animalsPages.importReason.journeyIdFromUrl());
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(TO_DO);
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await expect(animalsPages.importReason.heading).toBeVisible();
    await expect(animalsPages.importReason.reason('Temporary admission horses')).not.toBeChecked();
    await expect(animalsPages.importReason.temporaryAdmissionExitDate).toHaveValue('');
    await expect(animalsPages.importReason.temporaryAdmissionPortOfExit).toHaveValue('');
  });

  test('main reason for import while amending: Save and return with transit and no port of exit saves without an error and goes to the review', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    // Arrange
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.notificationView.open(reference);
    await animalsPages.notificationView.changeLink(CHANGE_REASON_FOR_IMPORT).click();
    await expect(animalsPages.importReason.heading).toBeVisible();
    await animalsPages.importReason.reason('Transit').check();
    await animalsPages.importReason.transitDestinationCountry.selectOption('FR');

    // Act
    await animalsPages.importReason.saveAndReturn.click();

    // Assert
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(animalsPages.notificationView.heading).toBeVisible();
    const reasonCard = animalsPages.notificationView.summaryCard('Reason for import');
    await expect(animalsPages.notificationView.summaryValue(reasonCard, 'Reason for import')).toHaveText('Transit');
  });

  test('additional details: when both questions are unanswered, saves without an error and keeps the earlier answers', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    // Arrange
    const reference = await animalsSeededJourney.createDraftNotification('readyToSubmit');
    await animalsPages.additionalDetails.open(reference);
    await animalsPages.additionalDetails.clearChoices();

    // Act
    await animalsPages.additionalDetails.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeHidden();
    await animalsPages.overview.task(ADDITIONAL_DETAILS_TASK).click();
    await expect(animalsPages.additionalDetails.certifiedFor('Slaughter')).toBeChecked();
    await expect(animalsPages.additionalDetails.containsUnweanedAnimals('No')).toBeChecked();
  });

  test('origin of the import: when the region code is left blank, saves "Yes", leaves the task not complete and keeps the answer', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('');

    // Act
    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(ORIGIN_TASK)).not.toHaveText(COMPLETE);
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
  });

  test('arrival details: when the arrival date names no day, refuses the save and keeps nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(IMPOSSIBLE_ARRIVAL_DATE);

    // Act
    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummary).toBeVisible();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(ARRIVAL_DATE_ERROR);
    await animalsPages.overview.open(animalsPages.arrivalDetails.journeyIdFromUrl());
    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue('');
  });

  test('commodity details: when the number of animals is blank, keeps its checks and stays on the page', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toConsignmentDetails();

    // Act
    await animalsPages.consignmentDetails.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.errorSummary).toBeVisible();
    await expect(animalsPages.consignmentDetails.animalsRequiredErrorLink).toBeVisible();
    await animalsPages.overview.open(animalsPages.consignmentDetails.journeyIdFromUrl());
    await expect(animalsPages.overview.taskStatus(COMMODITY_DETAILS_TASK)).not.toHaveText(COMPLETE);
  });

  test('origin of the import: when the region code is longer than five characters, refuses the save and keeps nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('ABCDEF');

    // Act
    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
    await expect(animalsPages.originOfImport.regionCodeMaxLengthErrorLink).toBeVisible();
    await animalsPages.overview.open(animalsPages.originOfImport.journeyIdFromUrl());
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('');
  });

  test('what are you importing: when nothing is chosen, returns to the overview without an error', async ({
    animalsJourney,
    animalsPages,
  }) => {
    // Arrange
    await animalsJourney.toCommoditySelection();

    // Act
    await animalsPages.commoditySelection.saveAndReturnToOverview.click();

    // Assert
    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummary).toBeHidden();
    await expect(animalsPages.overview.taskStatus(COMMODITY_SELECTION_TASK)).toHaveText(TO_DO);
  });
});
