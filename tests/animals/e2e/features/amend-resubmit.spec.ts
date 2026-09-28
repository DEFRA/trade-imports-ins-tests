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
    journey,
    journeyContext,
    pages,
    notificationActions,
  }) => {
    test.slow();
    await journey.submitNotification();

    // Enter amend from the dashboard (SUBMITTED → AMEND) — re-enters at the hub.
    await notificationActions.amendNotification(journeyContext.journeyId);
    await expect(pages.overview.journeyStrip).toContainText('Amending');

    // Change the country of origin through the amending check your answers page.
    await pages.overview.reviewAndSubmitButton.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(pages.notificationView.changeLink('Change import details')).toBeVisible();
    await expect(pages.notificationView.changeLink('Change commodity 1')).toBeVisible();
    expect(await pages.page.getByRole('link', { name: /^Change/ }).count()).toBeGreaterThanOrEqual(4);
    const countryRow = pages.page.locator('.govuk-summary-list__row', { hasText: 'Country of origin' });
    await expect(countryRow).toContainText('France');
    await pages.notificationView.changeLink('Change import details').click();
    await expect(pages.originOfImport.heading).toBeVisible();
    await pages.originOfImport.selectCountry('Belgium');
    await pages.originOfImport.saveAndContinue.click();
    await expect(pages.notificationView.heading).toBeVisible();
    await expect(countryRow).toContainText('Belgium');

    // Resubmit through the declaration (AMEND → SUBMITTED).
    await pages.notificationView.continueButton.click();
    await expect(pages.declaration.heading).toBeVisible();
    await pages.declaration.confirmation.check();
    await pages.declaration.continueButton.click();
    await expect(pages.page.getByRole('heading', { name: 'Import notification submitted' })).toBeVisible();

    // Back in Submitted: the view is read-only again and keeps the edited value.
    await notificationActions.toNotificationView(journeyContext.journeyId);
    await expect(pages.notificationView.journeyStrip).toContainText('Submitted');
    await expect(countryRow).toContainText('Belgium');
    await expect(pages.page.getByRole('link', { name: /^Change/ })).toHaveCount(0);
    await expect(pages.notificationView.cancelAmendment).not.toBeVisible();

    // And the dashboard offers Amend again for the resubmitted notification.
    await pages.notificationDashboard.open();
    await pages.notificationDashboard.searchForReference(journeyContext.journeyId);
    await expect(pages.notificationDashboard.amend(journeyContext.journeyId)).toBeVisible();
  });
});
