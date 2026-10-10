import { test, expect } from '@fixtures';

const COMPLETE = 'Complete';
const ORIGIN_TASK = 'Where is this consignment coming from?';
const IMPORT_REASON_TASK = 'Main reason for import';
const COMMODITY_SELECTION_TASK = 'What are you importing?';
const ARRIVAL_DETAILS_TASK = 'Arrival details';
const IMPOSSIBLE_ARRIVAL_DATE = '31/2/2026';
const ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const COMMODITY_DETAILS_TASK = 'Commodity details';

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
    await expect(animalsPages.overview.taskStatus(COMMODITY_SELECTION_TASK)).not.toHaveText(COMPLETE);
  });
});
