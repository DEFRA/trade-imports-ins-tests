import { test, expect } from '@fixtures';
import { getRelativeAppDateText, getRelativeDatePickerValue } from '@utils/date-utils';

const EARLIEST_ALLOWED = getRelativeAppDateText({ dayOffset: -7 });
const LATEST_ALLOWED = getRelativeAppDateText({ monthOffset: 6 });
const OUT_OF_RANGE_MESSAGE = `Arrival date at port of entry must be between ${EARLIEST_ALLOWED} and ${LATEST_ALLOWED}`;

test.describe('Arrival details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toArrivalDetails();
  });

  test('renders the page controls', async ({ pages }) => {
    await expect(pages.arrivalDetails.heading).toBeVisible();
    await expect(pages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(pages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(pages.arrivalDetails.transportIdentification).toBeVisible();
    await expect(pages.arrivalDetails.transportDocumentReference).toBeVisible();
    await expect(pages.arrivalDetails.saveAndContinue).toBeVisible();
  });

  test('leaves the arrival details unanswered on load', async ({ pages }) => {
    await expect(pages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(pages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(pages.arrivalDetails.meansOfTransport).toHaveValue('');
  });

  test('accepts valid arrival details', async ({ journey, pages }) => {
    await journey.fillArrivalDetails();
    await pages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages }) => {
    await pages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });

  test('restricts the date picker to one week back and six months ahead', async ({ pages }) => {
    await expect(pages.arrivalDetails.datePicker).toHaveAttribute('data-min-date', EARLIEST_ALLOWED);
    await expect(pages.arrivalDetails.datePicker).toHaveAttribute('data-max-date', LATEST_ALLOWED);
  });

  test('rejects a typed arrival date outside the allowed window', async ({ journey, pages }) => {
    await journey.fillArrivalDetails();
    await pages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ yearOffset: -1 }));
    await pages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: OUT_OF_RANGE_MESSAGE })).toBeVisible();
    await expect(pages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    await expect(pages.arrivalDetails.heading).toBeVisible();
  });

  test('does not save an arrival date outside the allowed window', async ({ journey, pages }) => {
    const rejected = getRelativeDatePickerValue({ yearOffset: -1 });
    await journey.fillArrivalDetails();
    await pages.arrivalDetails.fillArrivalDate(rejected);
    await pages.arrivalDetails.saveAndContinue.click();
    await expect(pages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    const notificationUrl = pages.page.url();

    // Back to the overview and in again — NOT journey.toArrivalDetails(), which
    // starts a fresh notification and would leave the field empty either way.
    await pages.page.locator('.govuk-back-link').click();
    await pages.overview.task('Arrival details').click();
    await pages.arrivalDetails.heading.waitFor();

    // Same notification, or the empty field below proves nothing.
    expect(pages.page.url()).toBe(notificationUrl);
    await expect(pages.arrivalDetails.arrivalDate).not.toHaveValue(rejected);
  });
});
