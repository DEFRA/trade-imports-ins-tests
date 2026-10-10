import { test, expect } from '@fixtures';

const ARRIVAL_DETAILS_TASK = 'Arrival details';
const CHANGE_IMPORT_DETAILS = 'Change import details';
const AMENDED_REFERENCE = 'AMENDED-REF';
const AMENDING = 'Amending';

test.describe('Amendment page endings', { tag: ['@integration'] }, () => {
  test('a page opened from Overview while amending ends with Save and return, Save and continue and a link-styled Save and return to overview, with no cancel link, and Back goes to Overview', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.overview.open(reference);
    await animalsPages.overview.task(ARRIVAL_DETAILS_TASK).click();
    await expect(animalsPages.arrivalDetails.heading).toBeVisible();

    await expect(animalsPages.arrivalDetails.saveAndReturn).toBeVisible();
    await expect(animalsPages.arrivalDetails.saveAndContinue).toBeVisible();
    await expect(animalsPages.arrivalDetails.saveAndReturnToOverview).toBeVisible();
    await expect(animalsPages.arrivalDetails.saveAndReturnToOverview).toHaveClass(/govuk-link/);
    await expect(animalsPages.arrivalDetails.saveAndReturnToOverview).toHaveAttribute('value', 'hub');
    await expect(animalsPages.arrivalDetails.cancelAndReturnToOverview).toHaveCount(0);
    await expect(animalsPages.arrivalDetails.linkBack).toHaveAttribute('href', animalsPages.overview.expectedUrl(reference));

    await animalsPages.arrivalDetails.saveAndReturnToOverview.click();
    await expect(animalsPages.overview.heading).toBeVisible();
  });

  test('Save and return from a Change link goes back to the amend review showing the changed answer, posting change=1 and no action field', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.notificationView.open(reference);
    await animalsPages.notificationView.changeLink(CHANGE_IMPORT_DETAILS).click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();

    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await expect(animalsPages.originOfImport.linkBack).toHaveAttribute('href', animalsPages.overview.expectedUrl(reference));
    await expect(animalsPages.originOfImport.saveAndReturn).toHaveAttribute('formaction', /\/origin\?change=1$/);
    await expect(pages.page.locator('button[name="action"]')).toHaveCount(0);

    await animalsPages.originOfImport.internalReference.fill(AMENDED_REFERENCE);
    await animalsPages.originOfImport.saveAndReturn.click();

    await expect(pages.page).toHaveURL(/\/notification-view$/);
    const referenceRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Internal reference number' });
    await expect(referenceRow).toContainText(AMENDED_REFERENCE);
  });

  test('Save and continue while amending goes on as it does outside an amendment, not back to the review', async ({
    pages,
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();
    await animalsPages.notificationView.open(reference);
    await animalsPages.notificationView.changeLink(CHANGE_IMPORT_DETAILS).click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();

    await animalsPages.originOfImport.saveAndContinue.click();

    await expect(animalsPages.overview.heading).toBeVisible();
    await expect(pages.page).not.toHaveURL(/\/notification-view/);
  });

  test('the CPH number page, a party picker and the contact address page end with Save and return and Save and continue only, and Save and return goes to the amend review', async ({
    animalsPages,
    animalsSeededJourney,
  }) => {
    const reference = await animalsSeededJourney.createAmendNotification();

    await animalsPages.cphNumber.open(reference);
    await expect(animalsPages.cphNumber.heading).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndReturn).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndContinue).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndReturnToOverview).toHaveCount(0);
    await animalsPages.cphNumber.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.placeOfOriginSelection.open(reference);
    await expect(animalsPages.placeOfOriginSelection.saveAndReturn).toBeVisible();
    await expect(animalsPages.placeOfOriginSelection.saveAndContinue).toBeVisible();
    await expect(animalsPages.placeOfOriginSelection.saveAndReturnToOverview).toHaveCount(0);
    await animalsPages.placeOfOriginSelection.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();

    await animalsPages.contactAddress.open(reference);
    await expect(animalsPages.contactAddress.heading).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndReturn).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndContinue).toBeVisible();
    await expect(animalsPages.contactAddress.saveAndReturnToOverview).toHaveCount(0);
    await animalsPages.contactAddress.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
  });

  test('outside an amendment the CPH number page keeps its single primary button', async ({ animalsPages, animalsSeededJourney }) => {
    const reference = await animalsSeededJourney.createDraftNotification('readyToSubmit');

    await animalsPages.cphNumber.open(reference);
    await expect(animalsPages.cphNumber.saveAndContinue).toBeVisible();
    await expect(animalsPages.cphNumber.saveAndReturn).toHaveCount(0);
    await expect(animalsPages.cphNumber.saveAndReturnToOverview).toHaveCount(0);

    await animalsPages.originOfImport.open(reference);
    await expect(animalsPages.originOfImport.saveAndReturn).toHaveCount(0);
    await expect(animalsPages.originOfImport.cancelAndReturnToOverview).toBeVisible();
  });

  test('Continue on an amend review with an answer missing stays on the review with no error summary or error message', async ({
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

    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(animalsPages.notificationView.errorSummary).toHaveCount(0);
    await expect(pages.page.locator('.govuk-error-message')).toHaveCount(0);
    await expect(animalsPages.notificationView.journeyStrip).toContainText(AMENDING);
    await expect(animalsPages.declaration.heading).not.toBeVisible();
  });
});
