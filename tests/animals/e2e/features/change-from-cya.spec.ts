import { test, expect } from '@fixtures';

test.describe('Change from check your answers', { tag: '@duplicated-in-frontend' }, () => {
  test('a Change link opens the answering page with change context and the save returns to check your answers with the new value', async ({
    animalsSeededJourney,
    pages,
    animalsPages,
  }) => {
    test.slow();
    const referenceNumber = await animalsSeededJourney.createDraftNotification();
    await animalsSeededJourney.resumeInUi(referenceNumber, animalsPages.notificationView);

    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/origin\?change=1$/);
    await animalsPages.originOfImport.selectCountry('Belgium');
    await animalsPages.originOfImport.saveAndContinue.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(countryRow).toContainText('Belgium');

    const certifiedForRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Certified for' });
    await expect(certifiedForRow).toContainText('Slaughter');
    await animalsPages.notificationView.changeLink('Change additional animal details').click();
    await expect(animalsPages.additionalDetails.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/additional-details\?change=1$/);
    await animalsPages.additionalDetails.certifiedFor('Exhibition').check();
    await animalsPages.additionalDetails.saveAndContinue.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(pages.page).toHaveURL(/\/notification-view$/);
    await expect(certifiedForRow).toContainText('Exhibition');
  });
});
