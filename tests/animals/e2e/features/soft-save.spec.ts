import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@flows/animals/journey';

const TO_DO = 'To do';
const ORIGIN_TASK = 'Where is this consignment coming from?';
const COMMODITY_SELECTION_TASK = 'What are you importing?';
const ARRIVAL_DETAILS_TASK = 'Arrival details';
const IMPOSSIBLE_ARRIVAL_DATE = '31/2/2026';
const ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const COMMODITY_DETAILS_TASK = 'Commodity details';

test.describe('Save and return to overview', () => {
  test('main import reason: when a required answer is missing, saves, leaves the task not complete and keeps the answers', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();

    await animalsPages.importReason.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(IMPORT_REASON_TASK)).toHaveText(TO_DO);
    await animalsPages.overview.task(IMPORT_REASON_TASK).click();
    await expect(animalsPages.importReason.reason('Transit')).toBeChecked();
  });

  test('origin of the import: when the region code is left blank, saves "Yes", leaves the task not complete and keeps the answer', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.regionCode.fill('');

    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus(ORIGIN_TASK)).toHaveText(TO_DO);
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await expect(animalsPages.originOfImport.radioRequiresOriginCode('Yes')).toBeChecked();
  });

  test('arrival details: when the arrival date names no day, refuses the save and keeps nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(IMPOSSIBLE_ARRIVAL_DATE);

    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummary).toBeVisible();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(ARRIVAL_DATE_ERROR);
    await animalsPages.overview.open(animalsPages.arrivalDetails.referenceNumberFromUrl());
    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue('');
  });

  test('commodity details: when the number of animals is blank, keeps its checks and stays on the page', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toConsignmentDetails();

    await animalsPages.consignmentDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.consignmentDetails.heading).toBeVisible();
    await expect(animalsPages.consignmentDetails.errorSummary).toBeVisible();
    await expect(animalsPages.consignmentDetails.animalsRequiredErrorLink).toBeVisible();
    await animalsPages.overview.open(animalsPages.consignmentDetails.referenceNumberFromUrl());
    await expect(animalsPages.overview.taskStatus(COMMODITY_DETAILS_TASK)).toHaveText(TO_DO);
  });

  test('origin of the import: when the region code is longer than five characters, refuses the save and keeps nothing', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.startNotification();
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await animalsPages.originOfImport.radioRequiresOriginCode('Yes').check();
    await animalsPages.originOfImport.removeRegionCodeMaxlength();
    await animalsPages.originOfImport.regionCode.fill('ABCDEF');

    await animalsPages.originOfImport.saveAndReturnToOverview.click();

    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(animalsPages.originOfImport.errorSummary).toBeVisible();
    await expect(animalsPages.originOfImport.regionCodeMaxLengthErrorLink).toBeVisible();
    await animalsPages.overview.open(animalsPages.originOfImport.referenceNumberFromUrl());
    await animalsPages.overview.task(ORIGIN_TASK).click();
    await expect(animalsPages.originOfImport.regionCode).toHaveValue('');
  });

  test('what are you importing: when nothing is chosen, returns to the overview without an error', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toCommoditySelection();

    await animalsPages.commoditySelection.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummary).toBeHidden();
    await expect(animalsPages.overview.taskStatus(COMMODITY_SELECTION_TASK)).toHaveText(TO_DO);
  });
});
