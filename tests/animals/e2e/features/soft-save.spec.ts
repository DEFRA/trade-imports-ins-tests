import { test, expect } from '@fixtures';
import { IMPORT_REASON_TASK } from '@domain/animals/constants/import-reason-page';
import { SELECT_COMMODITY_ERROR } from '@domain/animals/constants/commodity-selection-page';
import { ALL_ANSWERS, MANDATORY_ANSWERS } from '@domain/animals/constants/journey-options';
import { MEANS_OF_TRANSPORT_REQUIRED_MESSAGE } from '@domain/animals/constants/means-of-transport';

const TO_DO = 'To do';
const COMMODITY_SELECTION_TASK = 'What are you importing?';
const ARRIVAL_DETAILS_TASK = 'Arrival details';
const TRANSIT_COUNTRIES_TASK = 'Transit countries';
const IMPOSSIBLE_ARRIVAL_DATE = '31/2/2026';
const ARRIVAL_DATE_ERROR = 'Enter a real arrival date';
const COMMODITY_DETAILS_TASK = 'Commodity details';
const PORT_OF_EXIT_ERROR = 'Select a port of exit';
const DESTINATION_COUNTRY_ERROR = 'Select a destination country';

test.describe('Save and return to overview', () => {
  test('main import reason: when a required answer is missing, refuses the save, names each missing answer and keeps the answer given', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toImportReason();
    await animalsPages.importReason.reason('Transit').check();
    const referenceNumber = animalsPages.importReason.referenceNumberFromUrl();

    await animalsPages.importReason.saveAndReturnToOverview.click();

    await expect(animalsPages.importReason.heading).toBeVisible();
    await expect(animalsPages.importReason.errorSummaryLinks).toHaveText([PORT_OF_EXIT_ERROR, DESTINATION_COUNTRY_ERROR]);
    await expect(animalsPages.importReason.reason('Transit')).toBeChecked();
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, IMPORT_REASON_TASK)).toHaveText(TO_DO);
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
    await animalsPages.overview.openTaskAfterReopening(animalsPages.arrivalDetails.referenceNumberFromUrl(), ARRIVAL_DETAILS_TASK);
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue('');
  });

  test('arrival details: when no means of transport is chosen, refuses the save, shows the port back and keeps the task to do', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toArrivalDetails();
    await animalsPages.arrivalDetails.portOfEntry.choose(MANDATORY_ANSWERS.pointOfEntry.display);
    const referenceNumber = animalsPages.arrivalDetails.referenceNumberFromUrl();

    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();

    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummaryLinks).toHaveText([MEANS_OF_TRANSPORT_REQUIRED_MESSAGE]);
    await expect(animalsPages.arrivalDetails.portOfEntry.select).toHaveValue(MANDATORY_ANSWERS.pointOfEntry.value);
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, ARRIVAL_DETAILS_TASK)).toHaveText(TO_DO);
    await animalsPages.overview.openTaskAfterReopening(referenceNumber, ARRIVAL_DETAILS_TASK);
    await expect(animalsPages.arrivalDetails.portOfEntry.select).toHaveValue('');
  });

  test('transit countries: saves the countries listed and goes to the overview', async ({ animalsJourney, animalsPages }) => {
    const countryNames = ALL_ANSWERS.transitedCountries.map((country) => country.display);
    await animalsJourney.toTransitedCountries();
    for (const name of countryNames) {
      await animalsPages.transitedCountries.addCountry(name);
    }
    const referenceNumber = animalsPages.transitedCountries.referenceNumberFromUrl();

    await animalsPages.transitedCountries.saveAndReturnToOverview.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await animalsPages.overview.openTaskAfterReopening(referenceNumber, TRANSIT_COUNTRIES_TASK);
    await expect(animalsPages.transitedCountries.addedCountryNames).toHaveText(countryNames);
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
    const referenceNumber = animalsPages.consignmentDetails.referenceNumberFromUrl();
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, COMMODITY_DETAILS_TASK)).toHaveText(TO_DO);
  });

  test('what are you importing: when nothing is chosen, refuses the save with "Select a commodity" and leaves the task not complete', async ({
    animalsJourney,
    animalsPages,
  }) => {
    await animalsJourney.toCommoditySelection();
    const referenceNumber = animalsPages.commoditySelection.referenceNumberFromUrl();

    await animalsPages.commoditySelection.saveAndReturnToOverview.click();

    await expect(animalsPages.commoditySelection.heading).toBeVisible();
    await expect(animalsPages.commoditySelection.errorSummaryLinks).toHaveText([SELECT_COMMODITY_ERROR]);
    await expect(await animalsPages.overview.taskStatusAfterReopening(referenceNumber, COMMODITY_SELECTION_TASK)).toHaveText(TO_DO);
  });
});
