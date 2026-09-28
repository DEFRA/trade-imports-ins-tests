import { test, expect } from '@fixtures';

test.describe('Change from check your answers', { tag: ['@integration', '@duplicated-in-frontend'] }, () => {
  test('a Change link opens the answering page with change context and the save returns to check your answers with the new value', async ({
    seededJourney,
    pages,
  }) => {
    test.slow();
    const referenceNumber = await seededJourney.createDraftNotification('readyToSubmit');
    await seededJourney.resumeInUi(referenceNumber, pages.notificationView);

    // Design release 1 puts one Change link in each card's heading and none on
    // a row, so the link is named for the card and reaches every answer in it.
    // Origin leg: the Change link threads ?change=1 to the answering page, so
    // the save exits back to check your answers instead of the flow target.
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await pages.notificationView.changeLink('Change import details').click();
    await expect(pages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await pages.originOfImport.selectCountry('Belgium');
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(countryRow).toContainText('Belgium');

    // Additional animal details leg: without change context this save would
    // continue into the consignment flow; under change context it returns to
    // the summary.
    const certifiedForRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Certified for' });
    await expect(certifiedForRow).toContainText('Slaughter');
    await pages.notificationView.changeLink('Change additional animal details').click();
    await expect(pages.additionalDetails.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/additional-details\?change=1$/);
    await pages.additionalDetails.certifiedFor('Exhibition').check();
    await pages.additionalDetails.saveAndContinue.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(certifiedForRow).toContainText('Exhibition');
  });
});
