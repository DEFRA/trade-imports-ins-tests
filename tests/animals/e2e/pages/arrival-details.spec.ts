import { test, expect } from '@fixtures';
import { SELECT_ONE_PLACEHOLDER } from '@domain/animals/constants/import-reason-page';
import { meansOfTransport } from '@domain/animals/constants/means-of-transport';
import { getRelativeAppDateText, getRelativeDatePickerValue } from '@utils/date-utils';

const EARLIEST_ALLOWED = getRelativeAppDateText({ dayOffset: -7 });
const LATEST_ALLOWED = getRelativeAppDateText({ monthOffset: 6 });
const OUT_OF_RANGE_MESSAGE = `Arrival date at port of entry must be between ${EARLIEST_ALLOWED} and ${LATEST_ALLOWED}`;
const QUESTION_FIELD_IDS = [
  'arrivalDateAtPort',
  'portOfEntry',
  'meansOfTransport',
  'transportIdentification',
  'transportDocumentReference',
];
const SELECT_A_PORT = 'Select a port';

test.describe('Arrival details page', { tag: '@duplicated-in-frontend' }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toArrivalDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.portOfEntry.field).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(animalsPages.arrivalDetails.transportIdentification).toBeVisible();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toBeVisible();
    await expect(animalsPages.arrivalDetails.saveAndContinue).toBeVisible();
  });

  test('sets every question label in the medium GOV.UK label size', async ({ animalsPages }) => {
    for (const fieldId of QUESTION_FIELD_IDS) {
      await expect(animalsPages.arrivalDetails.fieldLabel(fieldId), fieldId).toHaveClass(/govuk-label--m/);
    }
  });

  test('gives the arrival date hint a fixed example', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.fieldHint('arrivalDateAtPort')).toHaveText(
      'The expected date of arrival at the port of entry. For example, 27/3/2026',
    );
  });

  test('hints the port search and shows Select a port in its empty box and in the empty option of the list behind it', async ({
    animalsPages,
  }) => {
    await expect(animalsPages.arrivalDetails.fieldHint('portOfEntry')).toHaveText(
      'Select where the transporter will enter with the consignment. Start typing to search by port or airport name or code.',
    );
    await expect(animalsPages.arrivalDetails.portOfEntry.field).toHaveAttribute('placeholder', SELECT_A_PORT);
    await expect(animalsPages.arrivalDetails.portOfEntry.field).toHaveValue('');
    await expect(animalsPages.arrivalDetails.portOfEntry.select.locator('option[value=""]')).toHaveText(SELECT_A_PORT);
  });

  test('offers Select one, then Air, Rail, Road and Sea as the means of transport', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.meansOfTransportOptions).toHaveText([
      SELECT_ONE_PLACEHOLDER,
      meansOfTransport.airplane.display,
      meansOfTransport.railway.display,
      meansOfTransport.roadVehicle.display,
      meansOfTransport.vessel.display,
    ]);
  });

  test('opens the transport identification hint with Enter one of the following and lists the four identifiers', async ({
    animalsPages,
  }) => {
    await expect(animalsPages.arrivalDetails.transportIdentificationLeadIn).toHaveText('Enter one of the following:');
    await expect(animalsPages.arrivalDetails.transportIdentificationLeadIn).toHaveClass(/govuk-hint/);
    await expect(animalsPages.arrivalDetails.transportIdentificationList).toHaveClass(/govuk-hint/);
    await expect(animalsPages.arrivalDetails.transportIdentificationItems).toHaveText([
      'flight number',
      'train number',
      'road vehicle registration number',
      'vessel name (for ferries, also the road vehicle registration number)',
    ]);
  });

  test('leaves the arrival details unanswered on load', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.portOfEntry.field).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toHaveValue('');
  });

  test('accepts valid arrival details and completes the Arrival details task', async ({ animalsJourney, animalsPages }) => {
    await animalsJourney.fillArrivalDetails();
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Arrival details')).toHaveText('Complete');
  });

  test('saves a draft and returns to the overview with the Arrival details task still to do when submitted empty', async ({
    animalsPages,
  }) => {
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.overview.taskStatus('Arrival details')).toHaveText('To do');
  });

  test('restricts the date picker to one week back and six months ahead', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.arrivalDatePicker.root).toHaveAttribute('data-min-date', EARLIEST_ALLOWED);
    await expect(animalsPages.arrivalDetails.arrivalDatePicker.root).toHaveAttribute('data-max-date', LATEST_ALLOWED);
  });

  test('rejects a typed arrival date outside the allowed window', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.fillArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ yearOffset: -1 }));
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: OUT_OF_RANGE_MESSAGE })).toBeVisible();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
  });

  test('does not save an arrival date outside the allowed window', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.fillArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ yearOffset: -1 }));
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    const notificationUrl = pages.page.url();

    await pages.page.locator('.govuk-back-link').click();
    await animalsPages.overview.task('Arrival details').click();
    await animalsPages.arrivalDetails.heading.waitFor();

    expect(pages.page.url()).toBe(notificationUrl);
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue('');
  });
});
