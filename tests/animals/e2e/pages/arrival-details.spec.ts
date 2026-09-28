import { test, expect } from '@fixtures';
import { getRelativeAppDateText, getRelativeDatePickerValue } from '@utils/date-utils';

const EARLIEST_ALLOWED = getRelativeAppDateText({ dayOffset: -7 });
const LATEST_ALLOWED = getRelativeAppDateText({ monthOffset: 6 });
const OUT_OF_RANGE_MESSAGE = `Arrival date at port of entry must be between ${EARLIEST_ALLOWED} and ${LATEST_ALLOWED}`;

test.describe('Arrival details page', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test.beforeEach(async ({ journey }) => {
    await journey.toArrivalDetails();
  });

  test('renders the page controls', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
    await expect(animalsPages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(animalsPages.arrivalDetails.transportIdentification).toBeVisible();
    await expect(animalsPages.arrivalDetails.transportDocumentReference).toBeVisible();
    await expect(animalsPages.arrivalDetails.saveAndContinue).toBeVisible();
  });

  test('leaves the arrival details unanswered on load', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.portOfEntry).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toBeVisible();
    await expect(animalsPages.arrivalDetails.meansOfTransport).toHaveValue('');
  });

  test('accepts valid arrival details', async ({ journey, pages, animalsPages }) => {
    await journey.fillArrivalDetails();
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
  });

  test('shows an error summary when submitted empty', async ({ pages, animalsPages }) => {
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
  });

  test('restricts the date picker to one week back and six months ahead', async ({ animalsPages }) => {
    await expect(animalsPages.arrivalDetails.datePicker).toHaveAttribute('data-min-date', EARLIEST_ALLOWED);
    await expect(animalsPages.arrivalDetails.datePicker).toHaveAttribute('data-max-date', LATEST_ALLOWED);
  });

  test('rejects a typed arrival date outside the allowed window', async ({ journey, pages, animalsPages }) => {
    await journey.fillArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(getRelativeDatePickerValue({ yearOffset: -1 }));
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toBeVisible();
    await expect(pages.page.getByRole('link', { name: OUT_OF_RANGE_MESSAGE })).toBeVisible();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();
  });

  test('does not save an arrival date outside the allowed window', async ({ journey, pages, animalsPages }) => {
    const rejected = getRelativeDatePickerValue({ yearOffset: -1 });
    await journey.fillArrivalDetails();
    await animalsPages.arrivalDetails.fillArrivalDate(rejected);
    await animalsPages.arrivalDetails.saveAndContinue.click();
    await expect(animalsPages.arrivalDetails.arrivalDateError).toContainText(OUT_OF_RANGE_MESSAGE);
    const notificationUrl = pages.page.url();

    // Back to the overview and in again — NOT journey.toArrivalDetails(), which
    // starts a fresh notification and would leave the field empty either way.
    await pages.page.locator('.govuk-back-link').click();
    await animalsPages.overview.task('Arrival details').click();
    await animalsPages.arrivalDetails.heading.waitFor();

    // Same notification, or the empty field below proves nothing.
    expect(pages.page.url()).toBe(notificationUrl);
    await expect(animalsPages.arrivalDetails.arrivalDate).not.toHaveValue(rejected);
  });
});
