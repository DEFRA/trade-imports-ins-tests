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

  // A draft may be saved with a blank arrival date, so the page itself raises nothing on an empty
  // submit — the arrival fields are validated for shape, not for presence. Presence is a
  // completeness rule, enforced when the trader continues the notification: see
  // notification-view-states.spec.ts, which asserts the 'Complete arrival details' link in the
  // error summary there.
  //
  // This test used to expect an error summary here. It passed only because the frontend sent a
  // malformed value for a blank date, which the API rejected — the summary was a 400, not page
  // validation. The frontend now leaves a blank date out of the request.
  test('saves a draft and returns to the overview when submitted empty', async ({ pages, animalsPages }) => {
    await animalsPages.arrivalDetails.saveAndContinue.click();

    await expect(pages.page.getByRole('heading', { name: 'There is a problem' })).toHaveCount(0);
    await expect(animalsPages.overview.heading).toBeVisible();
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
