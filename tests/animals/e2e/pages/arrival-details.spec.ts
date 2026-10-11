import { test, expect } from '@fixtures';
import { getRelativeAppDateText, getRelativeDatePickerValue } from '@utils/date-utils';

const EARLIEST_ALLOWED = getRelativeAppDateText({ dayOffset: -7 });
const LATEST_ALLOWED = getRelativeAppDateText({ monthOffset: 6 });
const OUT_OF_RANGE_MESSAGE = `Arrival date at port of entry must be between ${EARLIEST_ALLOWED} and ${LATEST_ALLOWED}`;

test.describe('Arrival details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ animalsJourney }) => {
    await animalsJourney.toArrivalDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(animalsPages.arrivalDetails.transportIdentification).toBeVisible();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toBeVisible();
    await expect(animalsPages.arrivalDetails.saveAndContinue).toBeVisible();
  });

  test('sets every arrival question in the medium label size', async ({ animalsPages }) => {
    for (const id of ['arrivalDateAtPort', 'portOfEntry', 'meansOfTransport', 'transportIdentification', 'transportDocumentReference']) {
      await expect(animalsPages.arrivalDetails.questionLabel(id)).toHaveClass(/govuk-label--m/);
    }
  });

  test('hints the port search and shows its placeholder', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.portOfEntryHint).toHaveText(
      'Select where the transporter will enter with the consignment. Start typing to search by port or airport name or code.',
    );
    await expect(animalsPages.arrivalDetails.portOfEntry).toHaveAttribute('placeholder', 'Select a port');
    await expect(animalsPages.arrivalDetails.portOfEntryPlaceholderOption).toHaveText('Select a port');
  });

  test('offers Air, Rail, Road and Sea as the means of transport, in that order', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.meansOfTransport.locator('option')).toHaveText(['Select one', 'Air', 'Rail', 'Road', 'Sea']);
  });

  test('leads the transport identification hint with "Enter one of the following:"', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.transportIdentificationHintLead).toHaveText('Enter one of the following:');
  });

  test('leaves the arrival details unanswered on load', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toHaveValue('');
  });

  test('accepts valid arrival details', async ({ animalsJourney, pages, animalsPages }) => {
    await animalsJourney.fillArrivalDetails();
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('save and continue: when no means of transport is chosen, refuses the save with an error on the means of transport', async ({
    pages,
    animalsPages,
  }) => {
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(animalsPages.arrivalDetails.errorSummary).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransportErrorLink).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransportError).toContainText('Select a means of transport to the port of entry');
    await expect(animalsPages.arrivalDetails.meansOfTransport).toHaveClass(/govuk-select--error/);
    await expect(pages.page).toHaveTitle(/^Error: /);
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();

    await animalsPages.arrivalDetails.meansOfTransportErrorLink.click();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeFocused();
  });

  test('save and continue: when no means of transport is chosen, keeps the other answers and saves nothing', async ({
    pages,
    animalsPages,
  }) => {
    const arrivalDate = getRelativeDatePickerValue({ monthOffset: 1 });
    await animalsPages.arrivalDetails.selectPort('Port of Dover - GB DVR');
    await animalsPages.arrivalDetails.fillArrivalDate(arrivalDate);
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(animalsPages.arrivalDetails.meansOfTransportError).toBeVisible();
    await expect(animalsPages.arrivalDetails.portOfEntryValue).toHaveValue('GB DVR');
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue(arrivalDate);
    const notificationUrl = pages.page.url();

    await pages.page.locator('.govuk-back-link').click();
    await animalsPages.overview.task('Arrival details').click();
    await animalsPages.arrivalDetails.heading.waitFor();

    expect(pages.page.url()).toBe(notificationUrl);
    await expect(animalsPages.arrivalDetails.arrivalDate).toHaveValue('');
    await expect(animalsPages.arrivalDetails.portOfEntryValue).toHaveValue('');
  });

  test('save and continue: when only the means of transport is chosen, goes on to the next page', async ({ animalsPages }) => {
    await animalsPages.arrivalDetails.meansOfTransport.selectOption({ label: 'Air' });
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.errorSummary).toHaveCount(0);
  });

  test('restricts the date picker to one week back and six months ahead', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.datePicker).toHaveAttribute('data-min-date', EARLIEST_ALLOWED);
    await expect(animalsPages.arrivalDetails.datePicker).toHaveAttribute('data-max-date', LATEST_ALLOWED);
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
    const rejected = getRelativeDatePickerValue({ yearOffset: -1 });
    await animalsJourney.fillArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(rejected);
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    const notificationUrl = pages.page.url();

    // Back to the overview and in again — NOT animalsJourney.toArrivalDetails(), which
    // starts a fresh notification and would leave the field empty either way.
    await pages.page.locator('.govuk-back-link').click();
    await animalsPages.overview.task('Arrival details').click();
    await animalsPages.arrivalDetails.heading.waitFor();

    // Same notification, or the empty field below proves nothing.
    expect(pages.page.url()).toBe(notificationUrl);
    await expect(animalsPages.arrivalDetails.arrivalDate).not.toHaveValue(rejected);
  });
});
