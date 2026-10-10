import { test, expect } from '@fixtures';

/**
 * Amend resubmission through the UI. A submitted notification is amended from
 * the dashboard, one answer is changed through the UI, and
 * the amendment is resubmitted through check your answers + declaration —
 * returning the notification to Submitted with the edited value kept.
 *
 * The notification is submitted through the full UI journey (not API-seeded):
 * the declaration resubmit is gated on every task row being fulfilled, and
 * the API seed answers only the origin and commodity sections.
 */
test.describe('Amend resubmission', { tag: ['@integration'] }, () => {
  test('resubmits an amended notification: Submitted → Amending → Submitted with the edited answer kept', async ({
    animalsJourney,
    journeyContext,
    pages,
    animalsPages,
    animalsNotificationActions,
  }) => {
    test.slow();
    await animalsJourney.submitNotification();

    // Enter amend from the dashboard (SUBMITTED → AMEND) — re-enters at the hub.
    await animalsNotificationActions.amendNotification(journeyContext.journeyId);
    await expect(animalsPages.overview.journeyStrip).toContainText('Amending');

    // Change the country of origin through the amending check your answers page.
    await animalsPages.overview.reviewAndSubmitButton.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(animalsPages.notificationView.changeLink('Change import details')).toBeVisible();
    await expect(animalsPages.notificationView.changeLink('Change commodity 1')).toBeVisible();
    expect(await pages.page.getByRole('link', { name: /^Change/ }).count()).toBeGreaterThanOrEqual(4);
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await animalsPages.notificationView.changeLink('Change import details').click();
    await expect(animalsPages.originOfImport.heading).toBeVisible();
    await animalsPages.originOfImport.selectCountry('Belgium');
    await animalsPages.originOfImport.saveAndReturn.click();
    await expect(animalsPages.notificationView.heading).toBeVisible();
    await expect(countryRow).toContainText('Belgium');

    // Resubmit through the declaration (AMEND → SUBMITTED).
    await animalsPages.notificationView.continueButton.click();
    await expect(animalsPages.declaration.heading).toBeVisible();
    await animalsPages.declaration.confirmation.check();
    await animalsPages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    // Back in Submitted: the view is read-only again and keeps the edited value.
    await animalsNotificationActions.toNotificationView(journeyContext.journeyId);
    await expect(animalsPages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(countryRow).toContainText('Belgium');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    await expect(animalsPages.notificationView.cancelAmendment).not.toBeVisible();

    // And the dashboard offers Amend again for the resubmitted notification.
    await animalsPages.dashboard.open();
    await animalsPages.dashboard.searchForReference(journeyContext.journeyId);
    await expect(animalsPages.dashboard.amend(journeyContext.journeyId)).toBeVisible();
  });
});
